#!/usr/bin/env tsx
/**
 * Génère `src/sidebar.generated.ts` à partir de l'arbo `docs/pages/`.
 *
 * Stratégie :
 * - Walk récursif de `docs/pages/`, lit chaque MDX pour extraire le `title`
 *   du frontmatter.
 * - Pour chaque dossier ayant un `index.mdx` ET des enfants, le rend en
 *   tant que section avec `link` (vers le parent) + `items` (les enfants).
 * - Pour chaque dossier sans `index.mdx`, le rend en tant que section sans
 *   `link`, juste `items`.
 * - Pour chaque fichier MDX sans dossier enfant, le rend en tant que leaf.
 * - **Ordre des enfants : position dans le sitemap GitBook** (chargé depuis
 *   `tmp/gitbook-source/_sitemap.json` si dispo). Fallback alphabétique si
 *   sitemap absent ou route inconnue. `CHILDREN_ORDER` reste un override
 *   manuel quand la décision UX Cooper Labs diffère de GitBook.
 * - Ordre top-level : `TOP_LEVEL_ORDER` manuel (Introduction, Products, …)
 *   parce que ce sont des regroupements logiques (UPPERCASE), pas des routes.
 * - `collapsed: true` par défaut sur :
 *    - tout ce qui contient `parallel-v2` (legacy)
 *    - `dao-multisigs` (sous-dossier élections, peu consulté)
 *    - `dao-treasury` (rapports peu consultés)
 *
 * À régénérer après chaque `pnpm convert`. Idempotent.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import matter from "gray-matter";

const __dirname_ = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname_, "..");
const PAGES_DIR = join(ROOT, "src/pages");
const OUTPUT = join(ROOT, "src/sidebar.generated.ts");
const SITEMAP_CACHE = join(ROOT, "tmp/gitbook-source/_sitemap.json");

interface SitemapEntry {
  url: string;
  pathname: string;
  outputPath: string;
}

/**
 * Charge l'ordre canonique des routes depuis le sitemap GitBook crawlé.
 * Map: route Vocs (ex. `/products/parallel-v3/how-it-works/parallelizer-module`)
 * → position dans le sitemap (entier, plus petit = plus haut).
 *
 * Si le sitemap n'existe pas, on ABORTE au lieu de retomber sur l'ordre
 * alphabétique. Le fallback silencieux réordonnait toute la navigation — il
 * remontait notamment Parallel V2 (legacy) au-dessus de Parallel V3 — et
 * réécrivait ~800 lignes de `sidebar.generated.ts` sans que ça se voie.
 * Mieux vaut refuser de générer que produire une nav plausible mais fausse.
 */
export function loadSitemapOrder(sitemapPath: string = SITEMAP_CACHE): Map<string, number> {
  const order = new Map<string, number>();
  if (!existsSync(sitemapPath)) {
    throw new Error(
      `[generate-sidebar] route order cache not found at ${sitemapPath}.
Without it every child would be re-sorted alphabetically, which reorders the whole
sidebar (legacy v2 ends up above v3). Run \`pnpm crawl <sitemap-url>\` to rebuild the
cache before regenerating, or edit CHILDREN_ORDER in this script for a manual order.`,
    );
  }
  try {
    const raw = readFileSync(sitemapPath, "utf-8");
    const entries = JSON.parse(raw) as SitemapEntry[];
    for (let i = 0; i < entries.length; i++) {
      // Normalise la route Vocs : strip trailing slash sauf root.
      let route = entries[i].pathname || "/";
      if (route.length > 1 && route.endsWith("/")) route = route.slice(0, -1);
      order.set(route, i);
    }
  } catch (err) {
    console.warn(
      `[generate-sidebar] failed to parse sitemap cache: ${(err as Error).message} — falling back to alphabetical`,
    );
  }
  return order;
}

const SITEMAP_ORDER = loadSitemapOrder();

interface SidebarItem {
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
}

const TOP_LEVEL_ORDER: string[] = [
  "introduction",
  "products",
  "security",
  "governance",
  "developers-hub",
  "resources",
];

/**
 * Override the rendered text for a given path. Default text comes from the
 * MDX frontmatter `title`, falling back to the slug. Use this to rename
 * sections without touching the source MDX.
 */
const LABEL_OVERRIDES: Record<string, string> = {
  "/governance": "DAO & Governance",
  "/developers-hub/contract-addresses": "Contract Addresses",
};

/**
 * Override exceptionnel pour des parents où l'ordre Cooper Labs diffère de
 * GitBook (ex. promotion d'une page peu rangée GitBook). Vide par défaut :
 * tout l'ordre vient du sitemap (cf. `SITEMAP_ORDER`). À utiliser uniquement
 * pour des cas où le sitemap dit la mauvaise chose, sinon laisser passer.
 *
 * Format : route parent → liste ordonnée de slugs enfants. Les enfants non
 * listés sont appendés selon l'ordre du sitemap (donc fallback automatique).
 */
const CHILDREN_ORDER: Record<string, string[]> = {};

const COLLAPSED_BY_DEFAULT_PATTERNS = [
  /\/parallel-v2(\/|$)/,
  /\/dao-multisigs(\/|$)/,
  /\/dao-treasury(\/|$)/,
  /\/contract-addresses(\/|$)/, // verbose chain factorizations
];

function shouldBeCollapsed(absPath: string): boolean {
  return COLLAPSED_BY_DEFAULT_PATTERNS.some((re) => re.test(absPath));
}

function readTitle(mdxPath: string): string {
  try {
    const raw = readFileSync(mdxPath, "utf-8");
    const { data } = matter(raw);
    if (typeof data.title === "string" && data.title.trim()) return data.title.trim();
  } catch {
    // ignore — fallback to slug
  }
  return "";
}

function slugToText(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function pathToRoute(absPath: string): string {
  // docs/pages/foo/bar.mdx → /foo/bar
  // docs/pages/foo/bar/index.mdx → /foo/bar
  // docs/pages/index.mdx → /
  const rel = relative(PAGES_DIR, absPath);
  let route = `/${rel}`.replace(/\.mdx$/, "");
  route = route.replace(/\/index$/, "");
  if (route === "/index") route = "/";
  return route || "/";
}

function buildItem(absPath: string, depth: number): SidebarItem | null {
  const stats = statSync(absPath);
  if (stats.isFile()) {
    if (!absPath.endsWith(".mdx")) return null;
    const route = pathToRoute(absPath);
    const slug = absPath.replace(/\.mdx$/, "").split("/").pop() || "";
    if (slug === "index") return null; // handled at parent level
    return {
      text: readTitle(absPath) || slugToText(slug),
      link: route,
    };
  }

  if (stats.isDirectory()) {
    const entries = readdirSync(absPath);
    const indexMdx = entries.includes("index.mdx") ? join(absPath, "index.mdx") : null;
    const childMap = new Map<string, SidebarItem>();

    for (const entry of entries) {
      if (entry === "index.mdx") continue;
      const child = buildItem(join(absPath, entry), depth + 1);
      if (!child) continue;
      const slug = entry.replace(/\.mdx$/, "");
      childMap.set(slug, child);
    }

    const children = sortChildren(childMap, pathToRoute(absPath));

    if (children.length === 0) {
      // Directory with only an index — treat as a leaf
      if (indexMdx) {
        return {
          text: readTitle(indexMdx) || slugToText(absPath.split("/").pop() || ""),
          link: pathToRoute(indexMdx),
        };
      }
      return null;
    }

    const slug = absPath.split("/").pop() || "";
    const route = pathToRoute(absPath);
    const text =
      LABEL_OVERRIDES[route] ||
      (indexMdx ? readTitle(indexMdx) || slugToText(slug) : slugToText(slug));
    const item: SidebarItem = { text, items: children };
    if (indexMdx) item.link = pathToRoute(indexMdx);
    // Collapse rule : every section with children is collapsed by default
    // (chevron always visible, content hidden until click). Matches GitBook
    // UX where only depth-1 section headers are shown on first load and the
    // user expands progressively. Vocs auto-expands the branch matching the
    // current URL, so navigation never lands on a collapsed page.
    item.collapsed = true;
    return item;
  }

  return null;
}

export function sortChildren(
  childMap: Map<string, SidebarItem>,
  parentRoute: string,
  sitemapOrder: Map<string, number> = SITEMAP_ORDER,
): SidebarItem[] {
  // Snapshot positions avant le tri pour éviter que `sitemapPosition` ne soit
  // recalculé n fois quand l'arg `sitemapOrder` est custom (pour les tests).
  const positionFor = (item: SidebarItem): number => {
    const route = item.link ?? findFirstLink(item);
    if (!route) return Number.MAX_SAFE_INTEGER;
    return sitemapOrder.get(route) ?? Number.MAX_SAFE_INTEGER;
  };

  const manualOrder = CHILDREN_ORDER[parentRoute];
  if (manualOrder) {
    const ordered: SidebarItem[] = [];
    for (const slug of manualOrder) {
      const found = childMap.get(slug);
      if (found) {
        ordered.push(found);
        childMap.delete(slug);
      }
    }
    // Reste (= non listé dans l'override) : ordre sitemap, puis alpha en fallback
    const remaining = [...childMap.values()].sort((a, b) => {
      const diff = positionFor(a) - positionFor(b);
      return diff !== 0 ? diff : a.text.localeCompare(b.text);
    });
    return [...ordered, ...remaining];
  }

  return [...childMap.values()].sort((a, b) => {
    const diff = positionFor(a) - positionFor(b);
    return diff !== 0 ? diff : a.text.localeCompare(b.text);
  });
}

function sectionKey(item: SidebarItem): string {
  // Prefer the section's own link (when an index.mdx exists), then fall back
  // to the first descendant's link, then to the text (slugified). The first
  // two cover label-renamed sections like "DAO & Governance" whose own
  // index doesn't exist but whose children share a `/governance/...` prefix.
  const fromLink = item.link?.split("/")[1];
  if (fromLink) return fromLink.toLowerCase();
  const firstChildLink = findFirstLink(item);
  if (firstChildLink) {
    const parts = firstChildLink.split("/").filter(Boolean);
    if (parts[0]) return parts[0].toLowerCase();
  }
  return item.text.toLowerCase().replace(/\s+/g, "-");
}

function findFirstLink(item: SidebarItem): string | undefined {
  if (item.link) return item.link;
  if (!item.items) return undefined;
  for (const child of item.items) {
    const found = findFirstLink(child);
    if (found) return found;
  }
  return undefined;
}

function orderTopLevel(items: SidebarItem[]): SidebarItem[] {
  const indexed = new Map<string, SidebarItem>();
  for (const it of items) {
    indexed.set(sectionKey(it), it);
  }
  const ordered: SidebarItem[] = [];
  for (const key of TOP_LEVEL_ORDER) {
    const found = indexed.get(key);
    if (found) {
      ordered.push(found);
      indexed.delete(key);
    }
  }
  // Append remaining (alphabetical)
  const remaining = [...indexed.values()].sort((a, b) => a.text.localeCompare(b.text));
  return [...ordered, ...remaining];
}

function main(): void {
  const entries = readdirSync(PAGES_DIR);
  const root: SidebarItem[] = [];

  for (const entry of entries) {
    if (entry === "index.mdx") continue; // homepage, treated as Overview
    const child = buildItem(join(PAGES_DIR, entry), 1);
    if (child) root.push(child);
  }

  const ordered = orderTopLevel(root);

  // Inject "Overview" (the homepage at /) as the FIRST child of the
  // Introduction section, matching docs.parallel.best where the GitBook home
  // sits inside the INTRODUCTION header (not as a separate top-level slot).
  const introduction = ordered.find(
    (it) => sectionKey(it) === "introduction" || it.text.toLowerCase() === "introduction",
  );
  if (introduction) {
    introduction.items = [{ text: "Overview", link: "/" }, ...(introduction.items ?? [])];
  }

  // Top-level sections are UPPERCASE collapsible headers :
  //  - no `link` (the header itself isn't a navigation target)
  //  - `collapsed: false` so they render expanded by default but with a
  //    chevron the user can click to collapse the whole section
  //  - text in UPPERCASE for the GitBook visual hierarchy
  // Items at depth ≥ 2 keep their link/collapsed/normal-case as built.
  for (const it of ordered) {
    it.text = it.text.toUpperCase();
    delete it.link;
    it.collapsed = false;
  }

  const finalSidebar = ordered;

  const banner = `/**
 * AUTO-GENERATED via \`pnpm generate:sidebar\` — DO NOT EDIT MANUALLY.
 * Source : arbo \`docs/pages/\` post-conversion. Regénérer après chaque
 * \`pnpm convert\`.
 *
 * Manual override : éditer scripts/generate-sidebar.ts (TOP_LEVEL_ORDER,
 * COLLAPSED_BY_DEFAULT_PATTERNS) ou tweaker dans vocs.config.tsx après import.
 */
`;
  const body = `${banner}
import type { Sidebar } from "vocs";

export const sidebar: Sidebar = ${JSON.stringify(finalSidebar, null, 2)};
`;

  writeFileSync(OUTPUT, body);

  // Stats
  const countItems = (items: SidebarItem[]): number =>
    items.reduce((acc, it) => acc + 1 + (it.items ? countItems(it.items) : 0), 0);
  const total = countItems(finalSidebar);

  console.log(`✓ Wrote ${OUTPUT.replace(ROOT, "")}`);
  console.log(`  ${total} sidebar entries (top-level: ${finalSidebar.length})`);
}

// Skip auto-execution when imported (e.g. by tests). `pathToFileURL` est
// utilisé pour gérer correctement les chemins avec espaces (URL-encoded en
// `%20` dans `import.meta.url`) — un simple `file://${argv[1]}` ne match pas.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
