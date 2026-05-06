import type { Transformer } from "../types";

/**
 * Unescape markdown-style escapes (`\*`, `\_`) INSIDE math blocks
 * (`$$...$$` block and `$...$` inline) so KaTeX renders multiplication
 * and subscripts correctly.
 *
 * Pourquoi : GitBook échappe systématiquement `*` et `_` à l'export
 * (convention markdown pour qu'ils ne soient pas interprétés comme
 * italic/bold). Mais à l'intérieur d'un bloc math, KaTeX attend les
 * caractères bruts (`*` pour la multiplication, `_` pour l'indice).
 *
 * Trouvé sur Parallel : page super-vaults-sv/automated-rebalance —
 * `totalFees = fixedFee + variableFee \* rebalanceValue` rendait littéralement
 * `\*` au lieu de `·`.
 *
 * Stratégie : ne traiter que le contenu DANS les blocs math (`$$...$$`
 * et `$...$`). Préserver les `\\` et autres commandes TeX intactes.
 */

const BLOCK_MATH_REGEX = /\$\$([\s\S]*?)\$\$/g;
const INLINE_MATH_REGEX = /(?<!\$)\$([^$\n]+?)\$(?!\$)/g;

function unescapeMathChars(content: string): string {
  // Only `\*` → `*` and `\_` → `_`. Other `\` sequences are TeX commands.
  return content.replace(/\\([*_])/g, "$1");
}

export const mathUnescape: Transformer = {
  name: "mathUnescape",
  apply: (source: string) => {
    let out = source.replace(BLOCK_MATH_REGEX, (_, inner: string) => `$$${unescapeMathChars(inner)}$$`);
    out = out.replace(INLINE_MATH_REGEX, (_, inner: string) => `$${unescapeMathChars(inner)}$`);
    return out;
  },
};
