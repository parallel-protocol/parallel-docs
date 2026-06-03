// One-shot: pre-render `$$ … $$` block math to static KaTeX HTML and inject it
// into the MDX pages as `<Math html={…} />`.
//
// Why: Vocs v2's MDX pipeline does NOT register remark-math's *micromark*
// syntax extension (config `markdown.remarkPlugins` only affect the mdast
// transform phase), so `$$ … $$` is never recognised as math and the inner
// `\frac{…}` braces make the MDX expression parser throw. There are only a
// handful of formulas (two legacy Super Vault pages), so we render them to
// static KaTeX HTML at author time. The `<Math>` component injects the HTML
// via `dangerouslySetInnerHTML` (KaTeX emits string `style="…"` attributes
// that MDX/JSX would otherwise reject). The KaTeX stylesheet is loaded from
// `src/pages/_root.css`.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const katex = require("katex");

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const MATH_IMPORT = `import { Math } from '@/components/Math'`;
const FILES = [
  "src/pages/products/parallel-v2/how-it-works/super-vaults-sv/automated-rebalance.mdx",
  "src/pages/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimoautorebalance.mdx",
];

let total = 0;
for (const rel of FILES) {
  const path = ROOT + rel;
  let src = readFileSync(path, "utf8");
  let count = 0;

  src = src.replace(/^\$\$\n([\s\S]*?)\n\$\$$/gm, (_m, tex) => {
    count++;
    const html = katex.renderToString(tex.trim(), {
      displayMode: true,
      throwOnError: true,
    });
    // JSON.stringify gives a safely-escaped JS string literal for the MDX
    // expression — no stray braces/quotes leak into the MDX parser.
    return `<Math html={${JSON.stringify(html)}} />`;
  });

  // Inject the import after the frontmatter block if not already present.
  if (count > 0 && !src.includes(MATH_IMPORT)) {
    src = src.replace(/^(---\n[\s\S]*?\n---\n)/, `$1\n${MATH_IMPORT}\n`);
  }

  writeFileSync(path, src);
  total += count;
  console.log(`${rel}: rendered ${count} formula(s)`);
}
console.log(`Done — ${total} formula(s) pre-rendered.`);
