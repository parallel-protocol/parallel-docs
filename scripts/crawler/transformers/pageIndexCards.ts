import type { Transformer, TransformContext } from "../types";

/**
 * Transforme les pages parentes "auto-TOC" GitBook en grille de cards
 * `<PageCardGrid>` listant uniquement les enfants directs.
 *
 * Pattern détecté (après `stripFooter`) :
 *   # Some Title
 *
 *   - [Child A](https://docs.parallel.best/.../child-a.md)
 *   - [Grandchild A1](https://docs.parallel.best/.../child-a/sub.md)
 *   - [Child B](https://docs.parallel.best/.../child-b.md)
 *   …
 *
 * GitBook auto-rend ces pages comme une grille de 3 cards (Child A / B / …)
 * en filtrant uniquement les enfants directs. Vocs n'a pas d'équivalent
 * natif → on injecte le composant `<PageCardGrid>` qui reproduit le rendu.
 *
 * Conditions strictes (pour éviter de transformer une page avec contenu
 * rédactionnel qui aurait aussi une liste à la fin) :
 *   1. La page est une `index.mdx` (parent de section)
 *   2. Après le H1, le body ne contient QUE des bullet items + lignes vides
 *   3. Au moins 2 enfants directs après filtrage
 *
 * Pipeline order : APRÈS `internalLinks` (bénéficie du resolution si présent),
 * AVANT `hints` (pour que le markdown reste propre lors du parsing). Les
 * liens GitBook full-URL `https://docs.parallel.best/...md` ne sont PAS
 * transformés par `internalLinks` (court-circuit URL externe), donc on les
 * normalise nous-mêmes ici.
 *
 * Idempotent : ne fait rien si le source contient déjà `<PageCardGrid`.
 */

const BULLET_LINE_REGEX = /^\s*[-*]\s+\[([^\]]+)\]\(([^)]+)\)(?:\s*[:\-–—]\s*.*)?\s*$/;
const COMPONENT_IMPORT = `import { PageCardGrid } from '@/components/PageCardGrid'`;
const GITBOOK_HOST_PREFIX = "https://docs.parallel.best";

interface BulletItem {
  /** Card title — matche `PageCardItem.title` côté composant. */
  title: string;
  /** Route Vocs normalisée (ex. `/products/parallel-v2/how-it-works/vaults`). */
  href: string;
}

/**
 * Normalise un href de bullet list en route Vocs.
 *  - `https://docs.parallel.best/foo/bar.md`     → `/foo/bar`
 *  - `https://docs.parallel.best/foo/bar.md#sec` → `/foo/bar` (anchor stripped)
 *  - `/foo/bar.md`                                → `/foo/bar`
 *  - `/foo/bar`                                   → `/foo/bar`
 *  - Autre (URL externe, mailto:, etc.)           → null (skip)
 */
function normalizeHref(rawHref: string): string | null {
  let href = rawHref.trim();
  // Strip GitBook host prefix
  if (href.startsWith(GITBOOK_HOST_PREFIX)) {
    href = href.slice(GITBOOK_HOST_PREFIX.length);
  }
  // External / non-internal links → skip
  if (!href.startsWith("/")) return null;
  // Strip query / fragment
  const qIdx = href.indexOf("?");
  if (qIdx !== -1) href = href.slice(0, qIdx);
  const fIdx = href.indexOf("#");
  if (fIdx !== -1) href = href.slice(0, fIdx);
  // Strip trailing .md
  if (href.endsWith(".md")) href = href.slice(0, -3);
  // Strip trailing slash (sauf si c'est juste `/`)
  if (href.length > 1 && href.endsWith("/")) href = href.slice(0, -1);
  return href || null;
}

/**
 * Renvoie le path Vocs courant à partir de `ctx.url`. Pour une page
 * `index.mdx`, on s'attend à un chemin SANS le segment final `index`
 * (ex. `/products/parallel-v2/how-it-works`).
 */
function currentRoute(ctxUrl: string): string {
  try {
    const u = new URL(ctxUrl);
    let p = u.pathname;
    if (p.endsWith("/")) p = p.slice(0, -1);
    return p || "/";
  } catch {
    return "/";
  }
}

/**
 * Filtre `items` pour ne garder que les enfants DIRECTS de `parentRoute`.
 * Un enfant direct est un href dont le path = parentRoute + "/" + un seul
 * segment (pas de `/` supplémentaire après).
 */
function keepImmediateChildren(
  items: BulletItem[],
  parentRoute: string,
): BulletItem[] {
  const prefix = parentRoute === "/" ? "/" : `${parentRoute}/`;
  return items.filter((it) => {
    if (!it.href.startsWith(prefix)) return false;
    const remainder = it.href.slice(prefix.length);
    if (remainder.length === 0) return false;
    return !remainder.includes("/");
  });
}

interface DetectionResult {
  matches: false;
  reason?: string;
}

interface DetectionMatch {
  matches: true;
  bodyStart: number; // index de fin de la section "h1 + listing" dans le source
  bodyEnd: number;
  items: BulletItem[];
}

/**
 * Détecte si le body (sans frontmatter) match le pattern auto-TOC.
 * `body` doit déjà avoir été dépouillé du footer GitBook.
 */
function detect(body: string): DetectionResult | DetectionMatch {
  const lines = body.split("\n");
  let i = 0;
  // Skip leading blanks
  while (i < lines.length && lines[i].trim() === "") i++;
  // Need a H1
  if (i >= lines.length || !lines[i].startsWith("# ")) {
    return { matches: false, reason: "no H1" };
  }
  const h1LineIdx = i;
  i++;
  // Skip blanks
  while (i < lines.length && lines[i].trim() === "") i++;
  const listStartIdx = i;

  // Parse bullet items (and only bullet items)
  const items: BulletItem[] = [];
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    const m = line.match(BULLET_LINE_REGEX);
    if (!m) {
      return {
        matches: false,
        reason: `non-bullet content at line ${i + 1}`,
      };
    }
    const href = normalizeHref(m[2]);
    if (href) items.push({ title: m[1].trim(), href });
    i++;
  }

  if (items.length < 2) {
    return { matches: false, reason: "fewer than 2 bullet items" };
  }

  // Compute byte-offset bounds in the original body for replacement.
  // We replace from the start of the H1 line up to the end of the last
  // bullet (we re-emit the H1 + a fresh component below it).
  let cursor = 0;
  for (let k = 0; k < h1LineIdx; k++) cursor += lines[k].length + 1; // +1 for \n
  const bodyStart = cursor;
  // `bodyEnd` = end of the body (we consumed everything until end-of-input)
  const bodyEnd = body.length;

  return { matches: true, bodyStart, bodyEnd, items };
}

function emitReplacement(h1: string, items: BulletItem[]): string {
  const itemsJson = JSON.stringify(items);
  return `# ${h1}\n\n<PageCardGrid items={${itemsJson}} />\n`;
}

export const pageIndexCards: Transformer = {
  name: "pageIndexCards",
  apply: (source: string, ctx: TransformContext) => {
    // Idempotent : si déjà transformé, no-op.
    if (source.includes("<PageCardGrid")) return source;

    // Le pipeline n'expose pas le frontmatter ici (il est ajouté plus tard
    // par `frontmatter`), donc le `source` à ce stade est juste le body
    // GitBook brut (sans frontmatter, sans footer si stripFooter a tourné).
    const detection = detect(source);
    if (!detection.matches) return source;

    const parentRoute = currentRoute(ctx.url);
    const immediate = keepImmediateChildren(detection.items, parentRoute);
    // Render even when a single immediate child remains : GitBook auto-TOC
    // pages often list immediate + grandchildren in the same bullet block, so
    // post-filter we may legitimately end up with one card (cf. addresses or
    // onchain-tools on Monet). Skip only when there's strictly nothing.
    if (immediate.length < 1) return source;

    // Extract H1 text from the original body to preserve casing/punctuation.
    const h1Match = source.slice(detection.bodyStart).match(/^#\s+(.+?)\s*$/m);
    const h1Text = h1Match ? h1Match[1] : "";
    if (!h1Text) return source;

    const before = source.slice(0, detection.bodyStart);
    const replacement = emitReplacement(h1Text, immediate);
    // We always inject the import once at the very top of the produced body
    // (frontmatter transformer runs later and prepends `---`, so this becomes
    // the first body line under the frontmatter).
    return `${COMPONENT_IMPORT}\n\n${before}${replacement}`;
  },
};
