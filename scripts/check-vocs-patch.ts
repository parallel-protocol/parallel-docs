#!/usr/bin/env tsx
/**
 * Fails the build when the patched Vocs is not the one installed.
 *
 * `patches/vocs@2.0.11.patch` is applied by pnpm at install time. Vercel
 * restores `node_modules` from a previous deployment's build cache, and pnpm
 * then reports "Already up to date" without re-applying patches — so editing
 * the patch file changes nothing until the build cache is cleared, and the
 * deployment silently ships the unpatched behaviour.
 *
 * That happened once: the root path kept serving HTML to AI agents after the
 * patch that fixed it was merged. Nothing failed; production was just wrong.
 *
 * Each marker below is a string the patch introduces. If one is missing, the
 * installed copy predates the current patch.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const MARKERS: { file: string; contains: string; what: string }[] = [
  {
    file: "node_modules/vocs/dist/waku/internal/middleware/md-router.js",
    contains: "isTerminal || isAiAgent",
    what: "the root path answers AI agents with markdown",
  },
  {
    file: "node_modules/vocs/dist/internal/vite-plugins.js",
    contains: "tsconfigPaths: true",
    what: "tsconfig path aliases resolve in dev",
  },
];

const missing = MARKERS.filter(({ file, contains }) => {
  const path = join(ROOT, file);
  return !existsSync(path) || !readFileSync(path, "utf-8").includes(contains);
});

if (missing.length > 0) {
  // A warning, not a failure. Clearing the Vercel build cache needs dashboard
  // rights that the people deploying this repo do not all have, so failing here
  // would block every deployment on an action they cannot take. The behaviour
  // these patches cover is handled independently in `delivery-routes.ts`.
  console.warn("\n[check-vocs-patch] WARNING — the installed vocs is missing this patch:\n");
  for (const { file, what } of missing) console.warn(`  - ${what}\n    (${file})`);
  console.warn(
    "\nOn Vercel this means the build cache restored an older node_modules and\n" +
      "pnpm re-applied nothing. Redeploy with 'Redeploy without existing Build\n" +
      "Cache', or locally run `pnpm install --force`.\n",
  );
}

console.log(`[check-vocs-patch] vocs patch applied (${MARKERS.length} markers found)`);
