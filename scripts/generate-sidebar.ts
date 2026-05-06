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
 * - Ordre : utilise un `SECTION_ORDER` manuel pour les top-level (Overview,
 *   Introduction, Products, Security, Governance, Developers Hub, Resources).
 *   Au-delà, ordre alphabétique sur les `text`.
 * - `collapsed: true` par défaut sur :
 *    - tout ce qui contient `parallel-v2` (legacy)
 *    - `dao-multisigs` (sous-dossier élections, peu consulté)
 *    - `dao-treasury` (rapports peu consultés)
 *
 * À régénérer après chaque `pnpm convert`. Idempotent.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname_ = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname_, "..");
const PAGES_DIR = join(ROOT, "docs/pages");
const OUTPUT = join(ROOT, "src/sidebar.generated.ts");

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

function buildItem(absPath: string): SidebarItem | null {
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
    const children: SidebarItem[] = [];

    for (const entry of entries) {
      if (entry === "index.mdx") continue;
      const child = buildItem(join(absPath, entry));
      if (child) children.push(child);
    }

    children.sort((a, b) => a.text.localeCompare(b.text));

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
    const text = indexMdx
      ? readTitle(indexMdx) || slugToText(slug)
      : slugToText(slug);
    const item: SidebarItem = { text, items: children };
    if (indexMdx) item.link = pathToRoute(indexMdx);
    if (shouldBeCollapsed(absPath)) item.collapsed = true;
    return item;
  }

  return null;
}

function orderTopLevel(items: SidebarItem[]): SidebarItem[] {
  const indexed = new Map<string, SidebarItem>();
  for (const it of items) {
    const key = (it.link?.split("/")[1] || it.text.toLowerCase().replace(/\s+/g, "-"))
      .toLowerCase();
    indexed.set(key, it);
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
    const child = buildItem(join(PAGES_DIR, entry));
    if (child) root.push(child);
  }

  const ordered = orderTopLevel(root);

  // Prepend Overview
  const homepage: SidebarItem = { text: "Overview", link: "/" };
  const finalSidebar = [homepage, ...ordered];

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

main();
