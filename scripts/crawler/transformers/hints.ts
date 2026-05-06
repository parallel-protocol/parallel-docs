import type { Transformer } from "../types";

/**
 * Convertit la syntaxe GitBook `{% hint style="X" %}…{% endhint %}` en
 * directive Vocs `:::X\n…\n:::` (rendue comme une `<aside>` callout via
 * `remarkCallout` natif Vocs).
 *
 * Styles supportés (1:1 avec les types Vocs Callout) :
 *   info, warning, danger, tip, success, note
 *
 * Pour eUSD : 8 occurrences (info + warning sur stabilizer/flashloan
 * integration, oracles index, redstone). Audit §5 disait 0 — c'était
 * un sous-échantillon de 6 pages.
 */

const HINT_BLOCK_REGEX =
  /\{% hint style="(info|warning|danger|tip|success|note)" %\}([\s\S]*?)\{% endhint %\}/g;

const VALID_STYLES = new Set(["info", "warning", "danger", "tip", "success", "note"]);

export const hints: Transformer = {
  name: "hints",
  apply: (source: string) =>
    source.replace(HINT_BLOCK_REGEX, (_, style: string, content: string) => {
      const safeStyle = VALID_STYLES.has(style) ? style : "info";
      const trimmed = content.trim();
      return `:::${safeStyle}\n${trimmed}\n:::`;
    }),
};
