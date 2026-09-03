import type { TransformContext, Transformer } from "../types";

/**
 * Injecte une hero image en haut de la page d'accueil (`/`) uniquement.
 *
 * Le source GitBook ne contient pas l'asset hero (c'est un asset custom
 * GitBook géré côté plate-forme, pas inclus dans le markdown export).
 * On injecte donc l'image manuellement dans la pipeline en pointant vers
 * `docs/public/hero*.webp` (synchronisé depuis `_brand-assets/Parallel/`).
 *
 * Ce transformer doit tourner APRÈS frontmatter et pageHeader (il insère
 * juste après le `---` de frontmatter), AVANT tout autre contenu MDX.
 */

const FRONTMATTER_END_REGEX = /^(---\n[\s\S]*?\n---\n+)/;
const HERO_JSX = `<img src="/hero-1125.webp" srcSet="/hero-750.webp 750w, /hero-1125.webp 1125w, /hero.webp 1500w" sizes="(min-width: 1080px) 672px, 100vw" width="1500" height="400" alt="Enter the Parallel World" style={{width: '100%', height: 'auto', borderRadius: 12, marginBottom: '1.5rem'}} />`;

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
    if (source.includes('alt="Enter the Parallel World"')) return source; // idempotent
    return source.replace(FRONTMATTER_END_REGEX, `$1${HERO_JSX}\n\n`);
  },
};
