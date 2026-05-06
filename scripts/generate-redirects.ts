#!/usr/bin/env tsx
/**
 * Génère `vercel.json` à partir du sitemap GitBook caché en
 * `tmp/gitbook-source/_sitemap.json` (produit par `pnpm crawl`).
 *
 * Pour chaque URL du sitemap GitBook, écrit un redirect 1:1
 * `{ source: pathname, destination: pathname, permanent: true }`. Vu
 * que les slugs eUSD sont identiques entre GitBook et Vocs (audit §5
 * confirmé), source === destination dans tous les cas. Le fichier est
 * néanmoins utile pour :
 * - documenter l'inventaire complet des URLs publiques pré-bascule
 * - rester en place si une URL change à l'avenir (juste éditer la destination)
 *
 * Sanity-check inline : pour chaque entry, vérifie que le MDX
 * correspondant existe dans `docs/pages/`. Si un MDX manque, exit 1
 * avec la liste des pages cassées.
 *
 * Logs aussi les "orphan MDX" (présents dans `docs/pages/` mais pas
 * référencés par le sitemap) — utile pour repérer des stubs Phase 1
 * non écrasés par le crawler ou des pages manuellement ajoutées.
 *
 * Usage : `pnpm generate:redirects`
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { SitemapEntry } from "./crawler/sitemap";

const __dirname_ = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname_, "..");
const TMP_DIR = join(ROOT, "tmp/gitbook-source");
const PAGES_DIR = join(ROOT, "docs/pages");
const SITEMAP_CACHE = join(TMP_DIR, "_sitemap.json");
const VERCEL_JSON = join(ROOT, "vercel.json");

interface VercelRedirect {
  source: string;
  destination: string;
  permanent: true;
}

async function findAllMdx(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await findAllMdx(full)));
    } else if (e.isFile() && e.name.endsWith(".mdx")) {
      out.push(full);
    }
  }
  return out;
}

async function main(): Promise<void> {
  if (!existsSync(SITEMAP_CACHE)) {
    throw new Error(
      `No sitemap cache at ${SITEMAP_CACHE}. Run \`pnpm crawl <sitemap-url>\` first.`,
    );
  }

  const entries: SitemapEntry[] = JSON.parse(
    readFileSync(SITEMAP_CACHE, "utf-8"),
  );
  console.log(`→ Generating redirects from ${entries.length} sitemap entries…`);

  const redirects: VercelRedirect[] = [];
  const missingMdx: string[] = [];
  const sourceDestMismatches: string[] = [];
  const factorizerRedirects: string[] = [];
  const expectedMdx = new Set<string>();

  for (const entry of entries) {
    const mdxPath = join(ROOT, entry.outputPath);
    expectedMdx.add(entry.outputPath);

    if (!existsSync(mdxPath)) {
      // Factorizer case : the per-chain page (e.g.
      // `developers-hub/contract-addresses/parallel-v3/usdp/ethereum.mdx`)
      // has been collapsed into a single `index.mdx` rendering
      // `<ContractAddressesPage>` with a chain picker. Redirect
      // `/usdp/ethereum` → `/usdp?chain=ethereum` so old GitBook URLs
      // deep-link into the picker.
      const parentDir = dirname(entry.outputPath);
      const parentIndexMdx = join(ROOT, parentDir, "index.mdx");
      const lastSegment = entry.pathname.split("/").pop() || "";
      const parentPathname = entry.pathname.slice(0, -(lastSegment.length + 1));
      if (existsSync(parentIndexMdx) && lastSegment && parentPathname) {
        const source = entry.pathname;
        const destination = `${parentPathname}?chain=${lastSegment}`;
        redirects.push({ source, destination, permanent: true });
        factorizerRedirects.push(`${source} → ${destination}`);
        continue;
      }
      missingMdx.push(`${entry.url} → ${entry.outputPath}`);
      continue;
    }

    const source = entry.pathname;
    const destination = entry.pathname;
    if (source !== destination) {
      sourceDestMismatches.push(`${entry.url}: ${source} !== ${destination}`);
    }

    redirects.push({ source, destination, permanent: true });
  }

  // Détecter les orphan MDX (présents dans docs/pages/ mais pas référencés
  // par le sitemap) — utile pour repérer des stubs Phase 1 oubliés.
  const allMdxFiles = await findAllMdx(PAGES_DIR);
  const orphanMdx = allMdxFiles
    .map((p) => relative(ROOT, p))
    .filter((rel) => !expectedMdx.has(rel));

  // Lit le vercel.json existant pour préserver d'éventuels autres champs
  // (headers, rewrites, etc.) qu'on ajouterait plus tard.
  let existing: Record<string, unknown> = {};
  if (existsSync(VERCEL_JSON)) {
    try {
      existing = JSON.parse(readFileSync(VERCEL_JSON, "utf-8"));
    } catch {
      // Fichier corrompu ou non-JSON, on l'écrase.
    }
  }

  const config = { ...existing, redirects };
  writeFileSync(VERCEL_JSON, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`✓ Wrote ${redirects.length} redirects to vercel.json`);

  // Reporting
  if (sourceDestMismatches.length > 0) {
    console.warn(
      `\n⚠ ${sourceDestMismatches.length} source ≠ destination cases (URL changes detected) :`,
    );
    for (const m of sourceDestMismatches) console.warn(`  ${m}`);
  } else {
    console.log(`✓ Sanity: source === destination on all ${redirects.length} entries.`);
  }

  if (orphanMdx.length > 0) {
    console.warn(
      `\n⚠ ${orphanMdx.length} orphan MDX (present in docs/pages/ but not in sitemap) :`,
    );
    for (const o of orphanMdx) console.warn(`  ${o}`);
  } else {
    console.log(`✓ Sanity: no orphan MDX, all pages are reachable via the sitemap.`);
  }

  if (factorizerRedirects.length > 0) {
    console.log(
      `\nℹ ${factorizerRedirects.length} factorizer redirects (per-chain → index?chain=) :`,
    );
    for (const f of factorizerRedirects.slice(0, 5)) console.log(`  ${f}`);
    if (factorizerRedirects.length > 5) {
      console.log(`  … and ${factorizerRedirects.length - 5} more`);
    }
  }

  if (missingMdx.length > 0) {
    console.error(
      `\n✗ ${missingMdx.length} sitemap entries point to MISSING MDX files :`,
    );
    for (const m of missingMdx) console.error(`  ${m}`);
    process.exit(1);
  }

  console.log(
    `\n✓ All ${entries.length} sitemap entries resolve to existing MDX. Ready for deploy.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
