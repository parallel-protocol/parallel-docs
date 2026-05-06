import type { TransformContext, Transformer } from "./types";

/**
 * Applique une chaîne de transformeurs en séquence sur un markdown source.
 *
 * - Sync OU async : chaque transformeur peut retourner `string` ou `Promise<string>`,
 *   le runner gère les deux via `await`.
 * - Pas de parallélisation (l'ordre matters : ex. `frontmatter` doit
 *   passer après `stripFooter` pour ne pas extraire le titre du footer).
 * - Erreurs : remontent telles quelles. À la charge de l'appelant de catch
 *   et de logger en contexte (page, transformeur).
 */
export async function runPipeline(
  source: string,
  ctx: TransformContext,
  transformers: readonly Transformer[],
): Promise<string> {
  let out = source;
  for (const t of transformers) {
    out = await t.apply(out, ctx);
  }
  return out;
}
