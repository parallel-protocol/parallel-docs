import type { Transformer } from "../types";

/**
 * Escape les `$` "monétaires" hors des blocs math `$$…$$`.
 *
 * Vocs charge `remark-math` qui parse `$…$` comme math inline. Sur les pages
 * stablecoins, on a beaucoup de mentions de prix (`1$`, `$1`, `$0.5`). Quand
 * deux `$` non-escapés se retrouvent dans le même paragraphe, tout le
 * contenu entre eux est routé vers KaTeX → texte rendu en MathML
 * (lettres espacées) ET fallback texte gardé → doublon visible.
 *
 * Stratégie :
 *  1. Découper le source en segments [text, math-block, text, math-block, …]
 *     où `math-block` est le contenu entre `$$…$$`.
 *  2. Dans chaque segment text, remplacer chaque `$` non-déjà-escapé par `\$`.
 *  3. Recoller — le contenu des blocs math reste intact.
 *
 * Hypothèse Parallel-spécifique vérifiée 2026-05-07 : la doc n'utilise PAS
 * de math inline `$…$`, uniquement du math block `$$…$$`. Donc on peut
 * sereinement escape tous les `$` hors block, sans casser de vraie formule
 * inline. Si on ajoute du math inline plus tard, il faudra revoir cette
 * heuristique (probablement matcher uniquement les `$` adjacents à des
 * chiffres : `[0-9]\$|\$[0-9]`).
 *
 * Idempotent : un `\$` déjà présent reste `\$` (negative lookbehind sur `\`).
 *
 * Doit tourner AVANT `mathUnescape` pour que ce dernier voie les `$$` de
 * math block intacts.
 */

const BLOCK_MATH_REGEX = /\$\$[\s\S]*?\$\$/g;
// Match `$` non-escapé (pas précédé d'un `\`).
const UNESCAPED_DOLLAR_REGEX = /(?<!\\)\$/g;

function escapeDollarsInText(segment: string): string {
  return segment.replace(UNESCAPED_DOLLAR_REGEX, "\\$");
}

export const escapeDollarSigns: Transformer = {
  name: "escapeDollarSigns",
  apply: (source: string) => {
    let lastIndex = 0;
    let out = "";
    for (const m of source.matchAll(BLOCK_MATH_REGEX)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      // Texte avant le bloc math : escape les $.
      out += escapeDollarsInText(source.slice(lastIndex, start));
      // Bloc math : intact.
      out += m[0];
      lastIndex = end;
    }
    // Reste après le dernier bloc math (ou tout le source si aucun bloc).
    out += escapeDollarsInText(source.slice(lastIndex));
    return out;
  },
};
