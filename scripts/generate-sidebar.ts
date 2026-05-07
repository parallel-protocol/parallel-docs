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

/**
 * Override the rendered text for a given path. Default text comes from the
 * MDX frontmatter `title`, falling back to the slug. Use this to rename
 * top-level sections without touching the source MDX.
 */
const LABEL_OVERRIDES: Record<string, string> = {
  "/governance": "DAO & Governance",
};

/**
 * Force a specific child ordering for some parents (route → ordered list of
 * child slugs). Children not listed are appended alphabetically. Matches
 * docs.parallel.best canonical sidebar order.
 *
 * Source : visual diff against docs.parallel.best (the GitBook curated order
 * is non-alphabetical and reflects information architecture, not file names).
 */
const CHILDREN_ORDER: Record<string, string[]> = {
  "/products": ["parallel-v3", "parallel-v2"],
  "/products/parallel-v3": [
    "how-it-works",
    "stablecoins-and-savings",
    "governance",
    "licensing",
  ],
  // /products/parallel-v3/how-it-works : alphabetical matches GitBook
  // (Bridging → Flashloan → Parallelizer → Savings).
  "/products/parallel-v2": ["stablecoins", "how-it-works", "licensing"],
  "/products/parallel-v2/how-it-works": [
    "vaults",
    "super-vaults-sv",
    "bridging-module",
  ],
  "/security": [
    "proof-of-solvency",
    "parallel-emergency-guardians",
    "hypernative",
    "keepers",
    "bug-bounty-program",
    "insurance-fund",
    "audits",
  ],
  "/developers-hub": [
    "developers-guide",
    "parallel-v3",
    "parallel-v2",
    "parallel-governance-token-prl",
    "contract-addresses",
  ],
  "/governance": [
    "parallel-governance-token-prl",
    "sprl",
    "governance-process",
    "proposal-framework",
    "dao-multisigs",
    "dao-treasury",
  ],
  "/governance/parallel-governance-token-prl": [
    "issuance",
    "tokenomics",
    "governance",
    "bridging-module",
    "mimo-to-prl-migration",
  ],
  "/governance/parallel-governance-token-prl/tokenomics": [
    "epoch-concept",
    "staking-mechanisms",
    "paraboost",
    "fee-distribution",
  ],
  "/governance/proposal-framework": [
    "parallel-integration-request-pir",
    "parallel-governance-proposal-pgp",
    "parallel-improvement-protocol-pip",
  ],
};

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

function sortChildren(childMap: Map<string, SidebarItem>, parentRoute: string): SidebarItem[] {
  const order = CHILDREN_ORDER[parentRoute];
  if (!order) {
    return [...childMap.values()].sort((a, b) => a.text.localeCompare(b.text));
  }
  const ordered: SidebarItem[] = [];
  for (const slug of order) {
    const found = childMap.get(slug);
    if (found) {
      ordered.push(found);
      childMap.delete(slug);
    }
  }
  // Append remaining (alphabetical) so a missing override entry doesn't drop pages
  const remaining = [...childMap.values()].sort((a, b) => a.text.localeCompare(b.text));
  return [...ordered, ...remaining];
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

  // Overview = single link to the homepage, kept as the very first sidebar
  // entry (above Introduction). Matches docs.parallel.best where the GitBook
  // home is its own top-level slot, not nested under any section.
  const overview: SidebarItem = { text: "Overview", link: "/" };
  const finalSidebar = [overview, ...ordered];

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
