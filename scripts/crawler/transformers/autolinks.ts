import type { Transformer } from "../types";

/**
 * Convertit les autolinks CommonMark `<https://...>` / `<http://...>` /
 * `<mailto:...>` en liens markdown explicites `[url](url)`.
 *
 * Pourquoi : MDX (vs CommonMark pur) interprète `<` comme une ouverture de
 * tag JSX. Un autolink GitBook comme `<https://github.com/foo>` casse le
 * parser MDX dès le `:` après `https` (`:` n'est pas un caractère valide
 * dans un nom de tag JSX).
 *
 * Stratégie sûre : on ne matche que les URLs commençant par `http://`,
 * `https://` ou `mailto:` — pas de faux positif sur les vraies balises HTML.
 *
 * Trouvé sur Parallel : 3 pages (developers-guide, classic-vaults,
 * super-vault-sv) avec `<https://github.com/...>`.
 */

const AUTOLINK_REGEX = /<(https?:\/\/[^\s<>]+|mailto:[^\s<>]+)>/g;

export const autolinks: Transformer = {
  name: "autolinks",
  apply: (source: string) => source.replace(AUTOLINK_REGEX, (_, url: string) => `[${url}](${url})`),
};
