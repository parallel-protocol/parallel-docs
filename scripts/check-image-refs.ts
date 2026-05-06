#!/usr/bin/env tsx
/**
 * Sanity-check post-conversion : parcourt tous les MDX dans `docs/pages/`,
 * extrait les références `/images/[name].[ext]`, vérifie que chaque fichier
 * existe dans `docs/public/images/`. Logs les manquants groupés par MDX.
 *
 * Exit code :
 * - 0 si toutes les références résolvent
 * - 1 sinon (avec liste détaillée stderr)
 *
 * Usage : `pnpm check:images` (script à ajouter dans package.json)
 */
import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname_ = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname_, "..");
const PAGES_DIR = join(ROOT, "docs/pages");
const IMAGES_DIR = join(ROOT, "docs/public/images");
const IMAGE_REF_REGEX = /\/images\/([a-zA-Z0-9._-]+)/g;

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
  const mdxFiles = await findAllMdx(PAGES_DIR);
  console.log(`→ Scanning ${mdxFiles.length} MDX files for /images/ refs…`);

  const missing = new Map<string, Set<string>>(); // file → missing image names
  let totalRefs = 0;
  let resolvedRefs = 0;

  for (const file of mdxFiles) {
    const content = readFileSync(file, "utf-8");
    for (const match of content.matchAll(IMAGE_REF_REGEX)) {
      totalRefs++;
      const imageName = match[1];
      const imagePath = join(IMAGES_DIR, imageName);
      if (!existsSync(imagePath)) {
        const rel = relative(ROOT, file);
        if (!missing.has(rel)) missing.set(rel, new Set());
        missing.get(rel)?.add(imageName);
      } else {
        resolvedRefs++;
      }
    }
  }

  console.log(
    `\n  Total /images/ refs: ${totalRefs} · resolved: ${resolvedRefs} · missing: ${totalRefs - resolvedRefs}`,
  );

  if (missing.size === 0) {
    console.log(`\n✓ All image refs resolve to existing files.`);
    return;
  }

  console.error(`\n✗ Missing image references:`);
  for (const [file, names] of missing) {
    console.error(`  ${file}`);
    for (const name of names) {
      console.error(`    → /images/${name} (not found in docs/public/images/)`);
    }
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
