import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { extension as mimeExtension } from "mime-types";
import type { Transformer, TransformContext } from "../types";

/**
 * Le markdown source GitBook référence les images sous `/files/[hash]` (40-char
 * hex), mais ce hash n'est PAS directement fetchable (`/files/[hash]` retourne
 * 404 sur tous les patterns testés). Le HTML rendu utilise un proxy signé
 * `~gitbook/image?url=...&sign=...&sv=2` avec un blob-id interne distinct.
 *
 * Stratégie :
 * 1. Toujours fetch le HTML rendu de la page (ctx.url) — sert aussi à
 *    extraire le `subtitle` injecté dans le frontmatter.
 * 2. Extraire le subtitle via regex (<p class="text-lg text-tint clear-both">)
 *    et l'injecter dans le frontmatter source via gray-matter.
 * 3. Si la page a `/files/[hash]` :
 *    - Extraire les `<img data-testid="zoom-image" src="...">` du HTML
 *    - Matcher par ordre (DOM order = markdown order, vérifié empiriquement)
 *    - Download depuis l'URL HTML, validate Content-Type, save sous
 *      `<hash-markdown>.<ext>` dans `imagesDir`
 *    - Réécrire `/files/<hash>` → `/images/<hash>.<ext>` dans la source
 *
 * Si la page n'a aucun `/files/`, on saute le download d'images mais on
 * fait quand même l'extraction subtitle.
 *
 * Si le count HTML ≠ count markdown, log warning et skip rewrite images.
 * Si le Content-Type n'est pas une image, log warning et skip ce hash.
 */

const FILES_REF_REGEX = /\/files\/([a-zA-Z0-9_-]+)/g;

// Match <img ... data-testid="zoom-image" ... src="..."> peu importe l'ordre
// des attributs (data-testid avant src OU inversement). Capture l'URL src.
const HTML_IMG_DATA_FIRST = /<img\b[^>]*?\bdata-testid="zoom-image"[^>]*?\bsrc="([^"]+)"/g;
const HTML_IMG_SRC_FIRST = /<img\b[^>]*?\bsrc="([^"]+)"[^>]*?\bdata-testid="zoom-image"/g;

// Subtitle GitBook : <p class="… text-lg … text-tint … clear-both …">TEXT</p>
// Les classes peuvent apparaître dans n'importe quel ordre, et le <p> peut
// avoir d'autres classes / attributs.
const SUBTITLE_REGEX =
  /<p\b[^>]*\bclass="(?=[^"]*\btext-lg\b)(?=[^"]*\btext-tint\b)(?=[^"]*\bclear-both\b)[^"]*"[^>]*>([^<]+)<\/p>/i;

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractSubtitle(html: string): string | null {
  const m = html.match(SUBTITLE_REGEX);
  if (!m) return null;
  const raw = decodeHtmlEntities(m[1]).trim();
  return raw.length > 0 ? raw : null;
}

function extractContentImageUrls(html: string): string[] {
  const matches: { index: number; url: string }[] = [];
  for (const m of html.matchAll(HTML_IMG_DATA_FIRST)) {
    matches.push({ index: m.index ?? 0, url: decodeHtmlEntities(m[1]) });
  }
  for (const m of html.matchAll(HTML_IMG_SRC_FIRST)) {
    matches.push({ index: m.index ?? 0, url: decodeHtmlEntities(m[1]) });
  }
  matches.sort((a, b) => a.index - b.index);
  return matches.map((m) => m.url);
}

function injectSubtitleIntoFrontmatter(source: string, subtitle: string): string {
  const parsed = matter(source);
  // gray-matter caches parse results by input string; clone `data` before
  // mutating so we don't pollute the cache for subsequent calls with the
  // same source string (notably across tests).
  const data = { ...parsed.data, subtitle };
  return matter.stringify(parsed.content, data);
}

async function downloadOne(
  url: string,
  hash: string,
  ctx: TransformContext,
): Promise<string | null> {
  const cached = ctx.cache.get(hash);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[images] ${hash} → HTTP ${res.status} (${url})`);
    return null;
  }

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!contentType.startsWith("image/")) {
    // Garde-fou : URL signée expirée ou erreur silencieuse renvoyant du HTML.
    console.warn(
      `[images] ${hash} → unexpected content-type "${contentType}" (likely expired signed URL or 404 silent)`,
    );
    return null;
  }

  const ext = mimeExtension(contentType) || "bin";
  const filename = `${hash}.${ext}`;
  const buffer = new Uint8Array(await res.arrayBuffer());
  await mkdir(ctx.imagesDir, { recursive: true });
  await writeFile(join(ctx.imagesDir, filename), buffer);
  ctx.cache.set(hash, filename);
  return filename;
}

export const images: Transformer = {
  name: "images",
  apply: async (source: string, ctx: TransformContext) => {
    const refs = Array.from(source.matchAll(FILES_REF_REGEX), (m) => m[1]);
    const hasFiles = refs.length > 0;

    // Fetch HTML systématiquement (sert pour subtitle et images).
    let html: string;
    try {
      const res = await fetch(ctx.url);
      if (!res.ok) {
        throw new Error(`Failed to fetch HTML page ${ctx.url} → ${res.status}`);
      }
      html = await res.text();
    } catch (err) {
      console.warn(`[images] ${ctx.url}: ${(err as Error).message}`);
      return source;
    }

    // Étape 1 : subtitle (toujours appliquée si trouvée).
    let out = source;
    const subtitle = extractSubtitle(html);
    if (subtitle) {
      out = injectSubtitleIntoFrontmatter(out, subtitle);
    }

    // Étape 2 : images (uniquement si la page a des /files/).
    if (!hasFiles) return out;

    const htmlUrls = extractContentImageUrls(html);

    if (htmlUrls.length !== refs.length) {
      console.warn(
        `[images] ${ctx.url}: count mismatch (${refs.length} markdown refs vs ${htmlUrls.length} HTML zoom-images), skipping rewrite`,
      );
      return out;
    }

    // Match par ordre, dédup downloads pour mêmes hashes.
    const filenames = new Map<string, string>();
    for (let i = 0; i < refs.length; i++) {
      const hash = refs[i];
      if (filenames.has(hash)) continue;
      const filename = await downloadOne(htmlUrls[i], hash, ctx);
      if (filename) filenames.set(hash, filename);
    }

    return out.replace(FILES_REF_REGEX, (m, hash) => {
      const filename = filenames.get(hash);
      return filename ? `/images/${filename}` : m;
    });
  },
};
