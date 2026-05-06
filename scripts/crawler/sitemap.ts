import { XMLParser } from "fast-xml-parser";

export interface SitemapEntry {
  /** URL absolue source GitBook (ex. `https://docs.eusd.xyz/products/foo`) */
  url: string;
  /** Pathname seul, normalisé sans trailing slash (sauf root `/`) */
  pathname: string;
  /** Chemin MDX cible relatif au repo root, ex. `docs/pages/products/foo/index.mdx` */
  outputPath: string;
}

const PAGES_PREFIX = "docs/pages";

/**
 * Vrai si une autre URL du sitemap est enfant directe ou indirecte de `url`.
 * Détermine si la page est un "parent" et doit être routée en `index.mdx`.
 */
export function hasChildren(url: string, allUrls: readonly string[]): boolean {
  const prefix = url.endsWith("/") ? url : `${url}/`;
  return allUrls.some((u) => u !== url && u.startsWith(prefix));
}

function normalizePathname(rawPathname: string): string {
  if (rawPathname === "" || rawPathname === "/") return "/";
  return rawPathname.replace(/\/+$/, "");
}

export function buildEntry(url: string, allUrls: readonly string[]): SitemapEntry {
  let pathname: string;
  try {
    pathname = normalizePathname(new URL(url).pathname);
  } catch {
    pathname = normalizePathname(url);
  }

  let outputPath: string;
  if (pathname === "/") {
    outputPath = `${PAGES_PREFIX}/index.mdx`;
  } else if (hasChildren(url, allUrls)) {
    outputPath = `${PAGES_PREFIX}${pathname}/index.mdx`;
  } else {
    outputPath = `${PAGES_PREFIX}${pathname}.mdx`;
  }

  return { url, pathname, outputPath };
}

/**
 * Récupère et parse un sitemap XML GitBook.
 *
 * Format attendu : `<urlset><url><loc>…</loc></url>…</urlset>`.
 * Pour chaque URL, calcule l'`outputPath` final en tenant compte des
 * relations parent/enfant (page parente → `index.mdx`).
 */
export async function fetchSitemap(sitemapUrl: string): Promise<SitemapEntry[]> {
  const res = await fetch(sitemapUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: ${sitemapUrl} → ${res.status}`);
  }
  const xml = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xml);

  const urls = parsed?.urlset?.url ?? [];
  const list = Array.isArray(urls) ? urls : [urls];
  const allUrls: string[] = list
    .map((u: { loc?: string | number | boolean }) =>
      u.loc !== undefined ? String(u.loc) : "",
    )
    .filter((u: string) => u.length > 0);

  return allUrls.map((url) => buildEntry(url, allUrls));
}

/**
 * Donne le chemin relatif où cacher le markdown source brut crawlé,
 * sous `tmp/gitbook-source/`. Mirror de la structure URL, avec
 * `index.md` pour les pages parentes.
 */
export function tmpRelPathFor(entry: SitemapEntry): string {
  if (entry.pathname === "/") return "index.md";
  if (entry.outputPath.endsWith("/index.mdx")) {
    return `${entry.pathname.replace(/^\//, "")}/index.md`;
  }
  return `${entry.pathname.replace(/^\//, "")}.md`;
}

/**
 * Construit l'URL `.md` source GitBook pour une entrée donnée.
 *
 * GitBook expose chaque page rendue HTML avec un endpoint `.md` jumeau
 * (ex. `/foo/bar` → `/foo/bar.md`). Cas spécial root : `/.md` ne marche
 * généralement pas, on tente `/index.md`.
 */
export function gitbookMdUrlFor(entry: SitemapEntry): string {
  const u = new URL(entry.url);
  if (entry.pathname === "/") {
    // Empirique : `/.md` retourne le vrai Overview (`/index.md` retourne
    // une page "Not Found" malgré un HTTP 200, vérifié sur docs.eusd.xyz).
    return `${u.origin}/.md`;
  }
  return `${entry.url.replace(/\/$/, "")}.md`;
}
