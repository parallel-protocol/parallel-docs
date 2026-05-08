import { fetchEmbedMeta } from "../embedMeta";
import type { Transformer } from "../types";

/**
 * Convertit la syntaxe GitBook `{% embed url="X" %}` en composant
 * `<LinkCard href="X" title=… favicon=… hostname=… />` avec les méta OG
 * de la page cible (favicon + og:title), pour reproduire le rendu card
 * de GitBook plutôt qu'un plain link.
 *
 * Deux formes supportées :
 * - Self-closing : `{% embed url="X" %}`
 *     → fetch méta de X → `<LinkCard href title favicon hostname />`
 * - Block avec body : `{% embed url="X" %}body{% endembed %}`
 *     → body force le `title`, on fetch quand même favicon + hostname
 *
 * Strip les `<>` de markdown autolink qui ont leaké dans la valeur de
 * l'attribut url (cf. eUSD proof-of-solvency, Parallel bug-bounty).
 *
 * Ce transformer DOIT tourner AVANT `autolinks` pour ne pas que les
 * `<https://...>` à l'intérieur des embeds soient transformés en
 * `[url](url)` markdown links → casserait le parsing de l'URL.
 *
 * Async : fetch HTTP des méta (cached sur disque via `embedMeta.ts`).
 */

const EMBED_BLOCK_REGEX =
  /\{% embed url="<?([^>"]+?)>?" %\}([\s\S]*?)\{% endembed %\}/g;
const EMBED_SELF_REGEX = /\{% embed url="<?([^>"]+?)>?" %\}/g;
const COMPONENT_IMPORT = `import { LinkCard } from '@/components/LinkCard'`;

function escapeJsxAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

interface MatchToReplace {
  start: number;
  end: number;
  url: string;
  /** Title forcé par le body GitBook (si présent), sinon undefined. */
  bodyTitle?: string;
}

function collectMatches(source: string): MatchToReplace[] {
  const matches: MatchToReplace[] = [];
  // Block embeds first — leur regex consomme aussi le marker self-closing
  // d'ouverture, donc on les match en priorité.
  for (const m of source.matchAll(EMBED_BLOCK_REGEX)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    const body = m[2].trim();
    matches.push({
      start,
      end,
      url: m[1],
      bodyTitle: body.length > 0 ? body : undefined,
    });
  }
  for (const m of source.matchAll(EMBED_SELF_REGEX)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    // Skip si déjà couvert par un block match.
    const overlapsBlock = matches.some(
      (b) => start >= b.start && start < b.end,
    );
    if (overlapsBlock) continue;
    matches.push({ start, end, url: m[1] });
  }
  matches.sort((a, b) => a.start - b.start);
  return matches;
}

export const embeds: Transformer = {
  name: "embeds",
  apply: async (source: string) => {
    const matches = collectMatches(source);
    if (matches.length === 0) return source;

    // Fetch toutes les méta en parallèle (cached → no network for warm cache)
    const metas = await Promise.all(
      matches.map((m) => fetchEmbedMeta(m.url)),
    );

    // Reconstruction du source en remplaçant chaque match par la JSX.
    let out = "";
    let cursor = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const meta = metas[i];
      out += source.slice(cursor, m.start);

      const titleStr = m.bodyTitle ?? meta.title;
      const parts: string[] = [`href="${escapeJsxAttr(m.url)}"`];
      parts.push(`title="${escapeJsxAttr(titleStr)}"`);
      if (meta.favicon) parts.push(`favicon="${escapeJsxAttr(meta.favicon)}"`);
      if (meta.hostname) parts.push(`hostname="${escapeJsxAttr(meta.hostname)}"`);
      out += `<LinkCard ${parts.join(" ")} />`;
      cursor = m.end;
    }
    out += source.slice(cursor);

    if (!out.includes("import { LinkCard }")) {
      out = `${COMPONENT_IMPORT}\n\n${out}`;
    }
    return out;
  },
};
