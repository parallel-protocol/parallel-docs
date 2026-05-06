import type { Transformer } from "../types";

/**
 * Convertit la syntaxe GitBook `{% stepper %}…{% endstepper %}` (avec
 * sous-blocs `{% step %}…{% endstep %}`) en liste ordonnée markdown native.
 *
 * Stratégie : extraire le H3 leading de chaque step → bold title, puis
 * indenter le reste du body avec 3 espaces (continuation de list item).
 * Liste ordonnée native = sémantique propre, pas de composant custom requis.
 *
 * Format de sortie :
 *   1. **Step Title**
 *
 *      Step body paragraph.
 *
 *      - sub-list item
 *
 *   2. **Next Title**
 *
 *      Body.
 *
 * Pour eUSD : 2 steppers (8 steps total) sur flashloan-module-integration.
 * Pour Parallel : à activer aussi (probable usage similaire).
 */

const STEPPER_BLOCK_REGEX = /\{% stepper %\}([\s\S]*?)\{% endstepper %\}/g;
const STEP_REGEX = /\{% step %\}([\s\S]*?)\{% endstep %\}/g;
const LEADING_H3_REGEX = /^###\s+(.+?)\s*$/m;

function indentBody(body: string): string {
  return body
    .split("\n")
    .map((line) => (line.length > 0 ? `   ${line}` : ""))
    .join("\n");
}

function formatStep(rawContent: string, index: number): string {
  const trimmed = rawContent.trim();
  const h3Match = trimmed.match(LEADING_H3_REGEX);
  const num = `${index + 1}.`;

  if (h3Match) {
    const title = h3Match[1].trim();
    const body = trimmed.replace(LEADING_H3_REGEX, "").replace(/^\s*\n+/, "");
    if (body.length === 0) {
      return `${num} **${title}**`;
    }
    return `${num} **${title}**\n\n${indentBody(body)}`;
  }

  // Pas de H3 → utiliser le contenu tel quel comme corps de l'item
  const indented = indentBody(trimmed).trimStart();
  return `${num} ${indented}`;
}

export const steppers: Transformer = {
  name: "steppers",
  apply: (source: string) =>
    source.replace(STEPPER_BLOCK_REGEX, (_, inner: string) => {
      const steps: string[] = [];
      for (const m of inner.matchAll(STEP_REGEX)) {
        steps.push(m[1]);
      }
      if (steps.length === 0) return inner.trim();
      return steps.map((s, i) => formatStep(s, i)).join("\n\n");
    }),
};
