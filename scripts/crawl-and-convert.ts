#!/usr/bin/env tsx
/**
 * CLI principal du crawler GitBook → Vocs/MDX.
 *
 * Sub-commandes :
 *   pnpm crawl <sitemap-url>   : fetch sitemap + raw .md → tmp/gitbook-source/
 *   pnpm convert               : tmp/gitbook-source/ → docs/pages/ (pipeline)
 *   pnpm build:content <url>   : crawl + convert en une passe
 *
 * Pas de gestion des secrets ni d'auth — l'endpoint .md GitBook est public.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { factorizeContractAddresses } from "./crawler/factorizers/contractAddressesFactorizer";
import { runPipeline } from "./crawler/pipeline";
import {
  fetchSitemap,
  gitbookMdUrlFor,
  type SitemapEntry,
  tmpRelPathFor,
} from "./crawler/sitemap";
import { autolinks } from "./crawler/transformers/autolinks";
import { embeds } from "./crawler/transformers/embeds";
import { frontmatter } from "./crawler/transformers/frontmatter";
import { hashtagHeadings } from "./crawler/transformers/hashtagHeadings";
import { hero } from "./crawler/transformers/hero";
import { hints } from "./crawler/transformers/hints";
import { legacyBanner } from "./crawler/transformers/legacyBanner";
import { htmlAttrs } from "./crawler/transformers/htmlAttrs";
import { images } from "./crawler/transformers/images";
import { internalLinks } from "./crawler/transformers/internalLinks";
import { mathUnescape } from "./crawler/transformers/mathUnescape";
import { pageHeader } from "./crawler/transformers/pageHeader";
import { steppers } from "./crawler/transformers/steppers";
import { stripFooter } from "./crawler/transformers/stripFooter";
import { tabs } from "./crawler/transformers/tabs";
import type { ImageCache, Transformer, TransformContext } from "./crawler/types";

const __dirname_ = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname_, "..");
const TMP_DIR = join(ROOT, "tmp/gitbook-source");
const IMAGES_DIR = join(ROOT, "docs/public/images");
const PAGES_DIR = join(ROOT, "docs/pages");
// `src/data/` so the generated `@/data/...` imports resolve via the
// `@/*` → `./src/*` Vite alias (set in vocs.config.tsx).
const DATA_DIR = join(ROOT, "src/data");
const SITEMAP_CACHE = join(TMP_DIR, "_sitemap.json");

/**
 * Pipeline canonique. Ordre figé :
 * 1. stripFooter      — retire le footer Agent Instructions avant tout
 * 2. hashtagHeadings  — nettoie les pictos H2/H3 avant que `frontmatter` ne lise le H1
 * 3. htmlAttrs        — class= → className= + void elements self-close (compat MDX/JSX)
 * 4. internalLinks    — résout les `.md` avant `images` (qui ignore les links non-image)
 * 5. hints            — `{% hint style="X" %}…{% endhint %}` → `:::X…:::` (Vocs callout natif)
 * 6. tabs             — `{% tabs %}…{% endtabs %}` → sections H4 empilées (cleanup quirk table)
 * 7. embeds           — `{% embed url="X" %}` → `[X](X)` lien markdown
 * 8. steppers         — `{% stepper %}…{% endstepper %}` → liste ordonnée markdown
 * 9. images           — async, télécharge images + injecte subtitle (extrait HTML rendu)
 * 10. frontmatter     — injecte le YAML, extrait le H1 du body propre, passthrough subtitle
 * 11. pageHeader      — injecte `<PageHeader>` (breadcrumb + subtitle) au top du body
 * 12. hero            — injecte hero image sur `/` après pageHeader
 * 13. legacyBanner    — DERNIER : injecte banner "⚠️ v2 legacy" sur les pages /parallel-v2/
 */
const PIPELINE: readonly Transformer[] = [
  stripFooter,
  hashtagHeadings,
  htmlAttrs,
  autolinks, // <url> → [url](url) avant tout, sinon MDX casse sur le `<`
  mathUnescape, // unescape \* et \_ DANS $$...$$ pour que KaTeX rende multiplication/indices
  internalLinks,
  hints,
  tabs,
  embeds,
  steppers,
  images,
  frontmatter,
  pageHeader,
  hero, // injecte hero "Enter the Parallel World" sur `/` (cf. hero.ts pour le src)
  legacyBanner, // DERNIER : banner legacy v2 sur /parallel-v2/ pages
];

class FsImageCache implements ImageCache {
  private map = new Map<string, string>();
  has(k: string) {
    return this.map.has(k);
  }
  get(k: string) {
    return this.map.get(k);
  }
  set(k: string, v: string) {
    this.map.set(k, v);
  }
}

async function loadCacheFromDisk(dir: string): Promise<FsImageCache> {
  const cache = new FsImageCache();
  if (!existsSync(dir)) return cache;
  const files = await readdir(dir);
  for (const f of files) {
    const m = f.match(/^([a-zA-Z0-9_-]+)\.(\w+)$/);
    if (m) cache.set(m[1], f);
  }
  return cache;
}

async function cmdCrawl(sitemapUrl: string): Promise<void> {
  console.log(`→ Fetching sitemap ${sitemapUrl}…`);
  const entries = await fetchSitemap(sitemapUrl);
  console.log(`  ${entries.length} pages found`);

  await mkdir(TMP_DIR, { recursive: true });
  await writeFile(SITEMAP_CACHE, JSON.stringify(entries, null, 2));

  let okCount = 0;
  for (const entry of entries) {
    const mdUrl = gitbookMdUrlFor(entry);
    const rel = tmpRelPathFor(entry);
    const tmpPath = join(TMP_DIR, rel);
    await mkdir(dirname(tmpPath), { recursive: true });

    try {
      const res = await fetch(mdUrl);
      if (!res.ok) {
        console.warn(`  ✗ ${mdUrl} → ${res.status}`);
        continue;
      }
      const text = await res.text();
      await writeFile(tmpPath, text);
      okCount++;
      console.log(`  ✓ ${entry.pathname} (${text.length} bytes)`);
    } catch (err) {
      console.warn(`  ✗ ${mdUrl} → ${(err as Error).message}`);
    }
  }
  console.log(
    `\n✓ Crawl done: ${okCount}/${entries.length} pages cached in ${relative(ROOT, TMP_DIR)}/`,
  );
}

async function cmdConvert(): Promise<void> {
  if (!existsSync(SITEMAP_CACHE)) {
    throw new Error(
      `No sitemap cache at ${SITEMAP_CACHE}. Run \`pnpm crawl <sitemap-url>\` first.`,
    );
  }
  const entries: SitemapEntry[] = JSON.parse(
    await readFile(SITEMAP_CACHE, "utf-8"),
  );
  await mkdir(IMAGES_DIR, { recursive: true });
  const cache = await loadCacheFromDisk(IMAGES_DIR);
  console.log(`→ Converting ${entries.length} pages…`);

  let okCount = 0;
  let imageCountStart = (await readdir(IMAGES_DIR)).length;
  const errors: string[] = [];

  for (const entry of entries) {
    const tmpPath = join(TMP_DIR, tmpRelPathFor(entry));
    if (!existsSync(tmpPath)) {
      console.warn(`  ✗ no cached source for ${entry.pathname}`);
      continue;
    }
    const source = await readFile(tmpPath, "utf-8");
    const ctx: TransformContext = {
      url: entry.url,
      outputPath: entry.outputPath,
      imagesDir: IMAGES_DIR,
      cache,
    };
    try {
      const out = await runPipeline(source, ctx, PIPELINE);
      const outPath = join(ROOT, entry.outputPath);
      await mkdir(dirname(outPath), { recursive: true });
      await writeFile(outPath, out);
      okCount++;
      console.log(`  → ${entry.outputPath}`);
    } catch (err) {
      const msg = `${entry.outputPath} → ${(err as Error).message}`;
      console.warn(`  ✗ ${msg}`);
      errors.push(msg);
    }
  }

  const imageCountEnd = (await readdir(IMAGES_DIR)).length;
  const imagesAdded = imageCountEnd - imageCountStart;

  console.log(
    `\n✓ Convert done: ${okCount}/${entries.length} pages, ${imagesAdded} new images`,
  );
  if (errors.length > 0) {
    console.log(`\n  Errors:\n${errors.map((e) => `    - ${e}`).join("\n")}`);
    process.exit(1);
  }

  // Post-pipeline: factorize per-chain contract address pages into single
  // route + data file (Parallel-specific). Skipped via --no-factorize.
  if (!process.argv.includes("--no-factorize")) {
    console.log("\n→ Factorizing contract address pages…");
    await mkdir(DATA_DIR, { recursive: true });
    const results = await factorizeContractAddresses({
      pagesDir: PAGES_DIR,
      dataDir: DATA_DIR,
    });
    if (results.length === 0) {
      console.log("  (no chain-specific address pages found — skipping)");
    } else {
      for (const r of results) {
        console.log(
          `  ✓ ${r.stablecoin}: ${r.chainsProcessed.length} chains → ${relative(ROOT, r.outputDataPath)}`,
        );
      }
    }
  }
}

async function main(): Promise<void> {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case "crawl": {
      const sitemapUrl = args[0];
      if (!sitemapUrl) {
        throw new Error("Usage: pnpm crawl <sitemap-url>");
      }
      await cmdCrawl(sitemapUrl);
      break;
    }
    case "convert":
      await cmdConvert();
      break;
    case "build": {
      const sitemapUrl = args[0];
      if (!sitemapUrl) {
        throw new Error("Usage: pnpm build:content <sitemap-url>");
      }
      await cmdCrawl(sitemapUrl);
      await cmdConvert();
      break;
    }
    default:
      throw new Error(
        `Unknown command: ${cmd}. Use crawl | convert | build.`,
      );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
