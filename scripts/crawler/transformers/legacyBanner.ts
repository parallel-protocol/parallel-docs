import type { Transformer, TransformContext } from "../types";

/**
 * Injecte un banner "⚠️ legacy v2" en haut des pages legacy parallel-v2.
 *
 * Pages ciblées :
 *  - /products/parallel-v2/... (docs produit v2)
 *  - /developers-hub/parallel-v2/... (docs dev v2)
 *
 * Le banner est inséré APRÈS le `<PageHeader>` JSX (s'il est présent), ou à
 * défaut juste après le frontmatter, pour respecter l'ordre visuel GitBook.
 *
 * Doit tourner EN DERNIER dans le pipeline, après `hero`, pour voir la
 * version finale du MDX avec frontmatter + PageHeader déjà injectés.
 *
 * Idempotent : pas de double injection si le banner est déjà présent.
 */

const BANNER =
  ":::warning\nYou're reading the legacy **v2** documentation. For current Parallel features, see [v3](/products/parallel-v3).\n:::";

const FRONTMATTER_END_REGEX = /^(---\n[\s\S]*?\n---\n)/;

function isV2Page(outputPath: string): boolean {
  return (
    outputPath.includes("/parallel-v2/") ||
    outputPath.endsWith("/parallel-v2.mdx") ||
    outputPath.endsWith("/parallel-v2/index.mdx")
  );
}

export const legacyBanner: Transformer = {
  name: "legacyBanner",
  apply: (source: string, ctx: TransformContext) => {
    if (!isV2Page(ctx.outputPath)) return source;
    if (source.includes("legacy **v2**")) return source; // idempotent

    // Insert after <PageHeader .../> — the regex captures the tag line and the
    // optional blank line immediately following it, then re-emits both before
    // inserting the banner so the visual separation is preserved.
    const withPageHeader = source.replace(
      /(<PageHeader [^\n]*\/>)\n(\n?)/,
      (_, tag, nl) => `${tag}\n${nl || "\n"}${BANNER}\n\n`,
    );
    if (withPageHeader !== source) return withPageHeader;

    // Fallback: no PageHeader found — insert after the frontmatter closing ---
    const withFrontmatter = source.replace(
      FRONTMATTER_END_REGEX,
      `$1\n${BANNER}\n\n`,
    );
    if (withFrontmatter !== source) return withFrontmatter;

    // Last resort: no frontmatter either — prepend to the document
    return `${BANNER}\n\n${source}`;
  },
};
