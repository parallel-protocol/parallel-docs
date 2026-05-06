import type { Transformer } from "../types";

/**
 * Convertit la syntaxe GitBook `{% tabs %}…{% endtabs %}` en JSX
 * `<Tabs>/<Tab>` correspondant au composant Radix-based de Phase 1
 * (src/components/Tabs).
 *
 * Quirk GitBook (vérifié sur eUSD redstone, potentiellement présent sur
 * Parallel proof-of-solvency) : à l'export `.md`, les markers `{% endtab %}`
 * et `{% endtabs %}` se retrouvent parfois mergés dans des cellules de tableau
 * (`| {% endtab %} | | | | |`). Ce transformer pré-nettoie ces lignes AVANT
 * de parser les blocs `{% tabs %}`.
 *
 * Quand au moins un bloc est converti, l'import du composant est prépendé
 * en haut du fichier (idempotent : jamais dupliqué).
 */

const TABS_IMPORT = `import { Tabs, Tab } from '@/components/Tabs';`;

// Lignes "fausse rangée de tableau" qui contiennent uniquement un marker
// {% endtab %} ou {% endtabs %} dans la 1ère cellule.
const TABLE_ROW_MARKER_REGEX = /^\|\s*\{%\s*(end(?:tab|tabs))\s*%\}\s*\|.*$/gm;

const TABS_BLOCK_REGEX = /\{% tabs %\}([\s\S]*?)\{% endtabs %\}/g;
const TAB_REGEX = /\{% tab title="([^"]+)" %\}([\s\S]*?)\{% endtab %\}/g;

function preCleanupTableRows(source: string): string {
  return source.replace(TABLE_ROW_MARKER_REGEX, (_, marker: string) => `\n{% ${marker} %}`);
}

function parseTabsBlock(inner: string): string {
  const sections: { title: string; content: string }[] = [];
  for (const match of inner.matchAll(TAB_REGEX)) {
    sections.push({ title: match[1], content: match[2].trim() });
  }
  if (sections.length === 0) return inner.trim();
  const tabsContent = sections
    .map((s) => `  <Tab label=${JSON.stringify(s.title)}>\n${s.content}\n  </Tab>`)
    .join("\n");
  return `<Tabs>\n${tabsContent}\n</Tabs>`;
}

export const tabs: Transformer = {
  name: "tabs",
  apply: (source: string) => {
    const cleaned = preCleanupTableRows(source);
    let replaced = false;
    const result = cleaned.replace(TABS_BLOCK_REGEX, (_, inner: string) => {
      replaced = true;
      return parseTabsBlock(inner);
    });
    if (!replaced) return result;
    if (result.includes(TABS_IMPORT)) return result;
    return `${TABS_IMPORT}\n\n${result}`;
  },
};
