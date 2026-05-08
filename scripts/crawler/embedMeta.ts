import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * Méta extraites d'une URL externe pour rendre une `<LinkCard>` à la
 * GitBook (favicon + titre OG + nom court). Fetché au build du crawler
 * (Vocs est statique → on ne peut pas le faire au runtime).
 */
export interface EmbedMeta {
  url: string;
  /** og:title || twitter:title || `<title>` || hostname court (fallback). */
  title: string;
  /** apple-touch-icon || icon (png) || shortcut icon || `${origin}/favicon.ico`. */
  favicon: string;
  /** Hostname sans TLD ni `www.` (ex. `immunefi.com` → `immunefi`). */
  hostname: string;
}

interface CacheEntry extends EmbedMeta {
  fetchedAt: number; // epoch ms
}

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const FETCH_TIMEOUT_MS = 5_000;
const USER_AGENT = "Cooper-Labs-Docs-Crawler/1.0";

let cache: Map<string, CacheEntry> | null = null;
let cachePath: string | null = null;
let cacheDirty = false;

/**
 * Initialise le cache disque (lazy). Appelable plusieurs fois — second
 * appel = no-op. À appeler par le runner avant le batch de fetch.
 */
export async function initEmbedMetaCache(path: string): Promise<void> {
  if (cache !== null && cachePath === path) return;
  cachePath = path;
  cache = new Map();
  if (existsSync(path)) {
    try {
      const raw = await readFile(path, "utf-8");
      const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
      for (const [k, v] of Object.entries(parsed)) cache.set(k, v);
    } catch {
      // Cache corrompu → on repart de zéro, pas de raison de crasher.
      cache = new Map();
    }
  }
}

/**
 * Persiste le cache si modifié. À appeler par le runner après le batch.
 */
export async function flushEmbedMetaCache(): Promise<void> {
  if (!cache || !cachePath || !cacheDirty) return;
  const obj: Record<string, CacheEntry> = {};
  for (const [k, v] of cache.entries()) obj[k] = v;
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify(obj, null, 2));
  cacheDirty = false;
}

/**
 * Réinitialise le cache (uniquement pour les tests).
 */
export function __resetEmbedMetaCache(): void {
  cache = null;
  cachePath = null;
  cacheDirty = false;
}

/** Hostname GitBook-style : `immunefi.com` → `immunefi`, `www.x.com` → `x`. */
export function shortHostname(rawUrl: string): string {
  let host: string;
  try {
    host = new URL(rawUrl).hostname;
  } catch {
    return rawUrl;
  }
  host = host.replace(/^www\./i, "");
  const parts = host.split(".");
  if (parts.length <= 1) return host;
  // Strip uniquement le dernier segment (TLD). Edge case `.co.uk` toléré
  // (le brief accepte explicitement le rendu approximatif).
  return parts.slice(0, -1).join(".");
}

interface ParsedLink {
  rel?: string;
  type?: string;
  href?: string;
  sizes?: string;
}

function parseLinkTags(html: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  const tagRegex = /<link\b([^>]*?)\/?>/gi;
  for (const m of html.matchAll(tagRegex)) {
    const attrs = m[1];
    const link: ParsedLink = {};
    const relMatch = attrs.match(/\brel\s*=\s*["']([^"']+)["']/i);
    if (relMatch) link.rel = relMatch[1].toLowerCase();
    const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);
    if (typeMatch) link.type = typeMatch[1].toLowerCase();
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (hrefMatch) link.href = hrefMatch[1];
    const sizesMatch = attrs.match(/\bsizes\s*=\s*["']([^"']+)["']/i);
    if (sizesMatch) link.sizes = sizesMatch[1];
    links.push(link);
  }
  return links;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'");
}

/** Extrait le og:title / twitter:title / `<title>` du HTML. */
export function extractTitle(html: string): string | null {
  // og:title (avec attribut content="..." dans n'importe quel ordre)
  const ogMatch = html.match(
    /<meta\b[^>]*?\bproperty\s*=\s*["']og:title["'][^>]*?\bcontent\s*=\s*["']([^"']+)["']/i,
  ) ||
    html.match(
      /<meta\b[^>]*?\bcontent\s*=\s*["']([^"']+)["'][^>]*?\bproperty\s*=\s*["']og:title["']/i,
    );
  if (ogMatch) return decodeHtmlEntities(ogMatch[1]).trim();

  const twitterMatch = html.match(
    /<meta\b[^>]*?\bname\s*=\s*["']twitter:title["'][^>]*?\bcontent\s*=\s*["']([^"']+)["']/i,
  ) ||
    html.match(
      /<meta\b[^>]*?\bcontent\s*=\s*["']([^"']+)["'][^>]*?\bname\s*=\s*["']twitter:title["']/i,
    );
  if (twitterMatch) return decodeHtmlEntities(twitterMatch[1]).trim();

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) return decodeHtmlEntities(titleMatch[1]).trim();

  return null;
}

/** Sélectionne la meilleure URL de favicon depuis les `<link>` parsés. */
export function pickFavicon(html: string, baseUrl: string): string {
  const links = parseLinkTags(html);
  // Helper : résout l'URL absolue par rapport à baseUrl.
  const resolve = (href: string) => {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return "";
    }
  };

  // Priorité : apple-touch-icon (haute résolution) → icon png → icon → shortcut icon
  const candidates: string[] = [];
  for (const l of links) {
    if (!l.rel || !l.href) continue;
    const rels = l.rel.split(/\s+/);
    if (rels.includes("apple-touch-icon")) candidates.push(l.href);
  }
  for (const l of links) {
    if (!l.rel || !l.href) continue;
    const rels = l.rel.split(/\s+/);
    if (rels.includes("icon") && l.type === "image/png") candidates.push(l.href);
  }
  for (const l of links) {
    if (!l.rel || !l.href) continue;
    const rels = l.rel.split(/\s+/);
    if (rels.includes("icon") && l.type !== "image/png") candidates.push(l.href);
  }
  for (const l of links) {
    if (!l.rel || !l.href) continue;
    const rels = l.rel.split(/\s+/);
    if (rels.includes("shortcut") && rels.includes("icon")) {
      candidates.push(l.href);
    }
  }
  for (const c of candidates) {
    const abs = resolve(c);
    if (abs) return abs;
  }
  // Fallback : /favicon.ico à la racine du domaine.
  try {
    const u = new URL(baseUrl);
    return `${u.origin}/favicon.ico`;
  } catch {
    return "";
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!ct.includes("html")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Récupère les méta d'une URL externe. Cached, robuste aux échecs réseau.
 *
 * Si `initEmbedMetaCache` n'a pas été appelé, fonctionne sans cache (refetch
 * à chaque appel — pratique pour les tests, à éviter en prod).
 */
export async function fetchEmbedMeta(url: string): Promise<EmbedMeta> {
  const hostname = shortHostname(url);
  const fallback: EmbedMeta = { url, title: hostname || url, favicon: "", hostname };

  // Cache hit ?
  if (cache) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return {
        url: cached.url,
        title: cached.title,
        favicon: cached.favicon,
        hostname: cached.hostname,
      };
    }
  }

  const html = await fetchHtml(url);
  let result: EmbedMeta;
  if (html === null) {
    console.warn(`[embedMeta] failed to fetch ${url} — using fallback`);
    result = fallback;
  } else {
    const title = extractTitle(html) || fallback.title;
    const favicon = pickFavicon(html, url);
    result = { url, title, favicon, hostname };
  }

  if (cache) {
    cache.set(url, { ...result, fetchedAt: Date.now() });
    cacheDirty = true;
  }
  return result;
}
