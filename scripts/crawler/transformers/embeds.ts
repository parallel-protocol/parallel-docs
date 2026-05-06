import type { Transformer } from "../types";

/**
 * Convertit la syntaxe GitBook `{% embed url="X" %}` en lien markdown
 * standard `[text](url)`.
 *
 * Deux formes supportées :
 * - Self-closing : `{% embed url="X" %}` → `[X](X)` (texte = URL)
 * - Block avec body : `{% embed url="X" %}body{% endembed %}` → `[body](X)`
 *
 * Strip aussi les `<>` de markdown autolink qui ont leaké dans la valeur
 * de l'attribut url (cf. eUSD proof-of-solvency : `url="<https://...>"`).
 *
 * Pour eUSD : 1 occurrence (self-closing sur proof-of-solvency).
 * Pour Parallel : potentiellement plus, avec embeds gov forum / votes.
 */

const EMBED_BLOCK_REGEX =
  /\{% embed url="<?([^>"]+?)>?" %\}([\s\S]*?)\{% endembed %\}/g;
const EMBED_SELF_REGEX = /\{% embed url="<?([^>"]+?)>?" %\}/g;

export const embeds: Transformer = {
  name: "embeds",
  apply: (source: string) => {
    let out = source.replace(EMBED_BLOCK_REGEX, (_, url: string, body: string) => {
      const text = body.trim() || url;
      return `[${text}](${url})`;
    });
    // Après consommation des blocs, ne restent que les self-closing.
    out = out.replace(EMBED_SELF_REGEX, (_, url: string) => `[${url}](${url})`);
    return out;
  },
};
