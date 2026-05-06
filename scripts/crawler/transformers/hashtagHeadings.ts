import type { Transformer } from "../types";

/**
 * Match H2/H3 préfixés par un picto "hashtag" GitBook (variants Unicode).
 *
 * Caractères ciblés :
 * - `#️⃣` : `#` (U+0023) + VS-16 (U+FE0F) + Combining Enclosing Keycap (U+20E3)
 * - `*️⃣` : `*` (U+002A) + VS-16 (U+FE0F) + Combining Enclosing Keycap (U+20E3)
 * - `🔢` : Input Numbers (U+1F522) — backup
 *
 * On accepte 0+ espaces entre le picto et le texte du titre (cas `### #️⃣Foo`
 * sans espace, cas `### #️⃣  Foo` avec plusieurs espaces).
 *
 * `#{2,3}` exclut les H1 (gérés par `frontmatter`).
 */
const HEADING_PICTO_REGEX = /^(#{2,3})\s+(?:[#*]️⃣|\u{1F522})\s*(.+)$/gmu;

export const hashtagHeadings: Transformer = {
  name: "hashtagHeadings",
  apply: (source: string) => source.replace(HEADING_PICTO_REGEX, "$1 $2"),
};
