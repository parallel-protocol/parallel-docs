import type { Transformer, TransformContext } from "../types";

/**
 * Injecte une hero image en haut de la page d'accueil (`/`) uniquement.
 *
 * Le source GitBook ne contient pas l'asset hero (c'est un asset custom
 * GitBook géré côté plate-forme, pas inclus dans le markdown export).
 * On injecte donc l'image manuellement dans la pipeline en pointant vers
 * `docs/public/hero.jpg` (synchronisé depuis `_brand-assets/Parallel/`).
 *
 * Ce transformer doit tourner APRÈS frontmatter et pageHeader (il insère
 * juste après le `---` de frontmatter), AVANT tout autre contenu MDX.
 */

const FRONTMATTER_END_REGEX = /^(---\n[\s\S]*?\n---\n+)/;
const HERO_JSX = `<img src="/hero.jpg" alt="Enter the Parallel World" style={{width: '100%', height: 'auto', borderRadius: 12, marginBottom: '1.5rem'}} />`;

export const hero: Transformer = {
  name: "hero",
  apply: (source: string, ctx: TransformContext) => {
    const pathname = (() => {
      try {
        return new URL(ctx.url).pathname;
      } catch {
        return ctx.url;
      }
    })();

    if (pathname !== "/") return source;
    if (source.includes('src="/hero.jpg"')) return source; // idempotent
    return source.replace(FRONTMATTER_END_REGEX, `$1${HERO_JSX}\n\n`);
  },
};
