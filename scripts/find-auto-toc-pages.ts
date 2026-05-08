#!/usr/bin/env tsx
/**
 * Recensement : trouve toutes les pages `index.md` (sources GitBook) qui
 * matchent le pattern "auto-TOC" (= H1 + bullet list de liens .md, rien
 * d'autre). Ces pages doivent être transformées en `<PageCardGrid>` plutôt
 * que rendues telles quelles (sinon Vocs affiche une bullet list à plat de
 * tous les descendants — vs. la grid d'immediate children que GitBook rend).
 *
 * Usage :
 *   pnpm tsx scripts/find-auto-toc-pages.ts
 */
import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const TMP_DIR = join(ROOT, "tmp/gitbook-source");

// Match le footer GitBook (cf. stripFooter.ts).
const FOOTER_REGEX =
  /\n*---\n+#\s+Agent Instructions:\s+Querying This Documentation[\s\S]*$/;

// Match une ligne de bullet list de la forme `- [text](url-finissant-en.md)` ou
// `* [text](url-finissant-en.md)`. GitBook utilise les deux indifféremment.
// On accepte path absolu (`/foo/bar.md`), URL complète, ou path relatif.
const BULLET_LINE_REGEX = /^\s*[-*]\s+\[([^\]]+)\]\(([^)]+\.md)\)\s*$/;

interface AutoTocPage {
  path: string;
  h1: string;
  itemCount: number;
  items: { label: string; url: string }[];
}

interface NonMatchReason {
  path: string;
  reason: string;
  preview: string;
}

async function walkMd(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const name of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...(await walkMd(p)));
    else if (name.isFile() && name.name === "index.md") out.push(p);
  }
  return out;
}

function detect(content: string): AutoTocPage | NonMatchReason {
  const stripped = content.replace(FOOTER_REGEX, "").trim();
  const lines = stripped.split("\n");

  // Cherche le H1
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length || !lines[i].startsWith("# ")) {
    return { path: "", reason: "no H1 at top", preview: stripped.slice(0, 120) };
  }
  const h1 = lines[i].replace(/^#\s+/, "").trim();
  i++;

  // Skip blank lines
  while (i < lines.length && lines[i].trim() === "") i++;

  // Tout ce qui reste DOIT être uniquement des bullet items
  const items: { label: string; url: string }[] = [];
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    const m = line.match(BULLET_LINE_REGEX);
    if (!m) {
      return {
        path: "",
        reason: `non-bullet content at line ${i + 1}: ${line.slice(0, 80)}`,
        preview: stripped.slice(0, 200),
      };
    }
    items.push({ label: m[1].trim(), url: m[2].trim() });
    i++;
  }

  if (items.length < 2) {
    return {
      path: "",
      reason: `only ${items.length} item(s) — not worth converting`,
      preview: stripped.slice(0, 200),
    };
  }

  return { path: "", h1, itemCount: items.length, items };
}

async function main() {
  const files = await walkMd(TMP_DIR);
  console.log(`→ Scanning ${files.length} index.md files…\n`);

  const matches: AutoTocPage[] = [];
  const nonMatches: NonMatchReason[] = [];

  for (const f of files) {
    const rel = relative(TMP_DIR, f);
    const content = await readFile(f, "utf-8");
    const result = detect(content);
    if ("h1" in result) {
      matches.push({ ...result, path: rel });
    } else {
      nonMatches.push({ ...result, path: rel });
    }
  }

  console.log(`=== ${matches.length} auto-TOC pages found ===\n`);
  for (const m of matches) {
    console.log(`  ${m.path}`);
    console.log(`    H1: "${m.h1}"`);
    console.log(`    Items: ${m.itemCount}`);
  }

  console.log(`\n=== ${nonMatches.length} non-matching index.md (sample 5) ===\n`);
  for (const n of nonMatches.slice(0, 5)) {
    console.log(`  ${n.path}`);
    console.log(`    Reason: ${n.reason}`);
  }

  console.log(
    `\nTotal index.md scanned: ${files.length} | matches: ${matches.length} | non-matches: ${nonMatches.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
