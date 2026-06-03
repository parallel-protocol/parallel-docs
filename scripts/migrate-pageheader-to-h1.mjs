// One-shot migration: replace the custom <PageHeader> component with a native
// markdown H1 (`# {title}`) on every MDX page — matching the validated
// eUSD/Rocky v2-clean approach. Drops the import, the breadcrumb and the
// subtitle (subtitle is preserved in frontmatter `description`). Keeps any
// hero <img> that precedes the header.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const PAGES_DIR = fileURLToPath(new URL("../src/pages/", import.meta.url));

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".mdx")) out.push(full);
  }
  return out;
}

function decodeTitle(raw) {
  return raw
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

let changed = 0;
const skipped = [];

for (const file of walk(PAGES_DIR)) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("<PageHeader")) continue;

  const lines = src.split("\n");
  const out = [];
  let replaced = false;

  for (const line of lines) {
    // Drop the PageHeader import line.
    if (/^\s*import\s+\{\s*PageHeader\s*\}\s+from\s+['"]@\/components\/PageHeader['"]\s*;?\s*$/.test(line)) {
      continue;
    }
    // Replace the <PageHeader ... /> tag with a markdown H1.
    if (/<PageHeader\b/.test(line)) {
      const m = line.match(/title=\{"((?:[^"\\]|\\.)*)"\}/);
      if (m) {
        out.push(`# ${decodeTitle(m[1])}`);
        replaced = true;
      } else {
        out.push(line); // leave untouched if unexpected shape
      }
      continue;
    }
    out.push(line);
  }

  if (!replaced) {
    skipped.push(file);
    continue;
  }

  // Collapse a possible double blank line left where the import used to be.
  let result = out.join("\n").replace(/\n{3,}/g, "\n\n");
  writeFileSync(file, result);
  changed++;
}

console.log(`Rewrote ${changed} pages.`);
if (skipped.length) console.log("Skipped (no title match):", skipped);
