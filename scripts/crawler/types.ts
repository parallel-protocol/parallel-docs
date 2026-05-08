/**
 * Types canoniques du pipeline de transformeurs GitBook → Vocs/MDX.
 *
 * Tous les transformeurs (Phase 1 + Phase 2 + Phase 3) implémentent l'interface
 * `Transformer`. Le runner les applique en chaîne sur le markdown source.
 */

/**
 * Contexte d'exécution passé à chaque transformeur.
 *
 * - `url` : URL source GitBook de la page (ex. `https://docs.eusd.xyz/foo/bar`).
 *   Utile pour résoudre les liens relatifs ou télécharger les images.
 * - `outputPath` : chemin MDX final (ex. `docs/pages/foo/bar.mdx`).
 *   Utile pour les transformeurs qui ont besoin du contexte de routing.
 * - `imagesDir` : dossier où écrire les binaires d'images téléchargées
 *   (ex. `docs/public/images`).
 * - `cache` : index permettant aux transformeurs async (ex. images) de skip
 *   un téléchargement déjà effectué. La clé est libre (recommandé : hash).
 */
export interface TransformContext {
  url: string;
  outputPath: string;
  imagesDir: string;
  cache: ImageCache;
  /**
   * Set des routes Vocs valides (ex. `/products`, `/products/parallel-v3`).
   * Quand fourni, les transformeurs qui génèrent des liens internes (notamment
   * `pageHeader` pour le breadcrumb) n'émettent un `href` que si la route est
   * présente dans le set ; sinon ils rendent un `<span>` plain text. Évite les
   * 404 pour les segments intermédiaires sans `index.mdx` (ex. `/security`,
   * `/governance`). Optionnel pour rester rétro-compat avec les tests unitaires
   * qui ne fournissent pas ce contexte (fallback : tous les `href` sont émis).
   */
  validRoutes?: ReadonlySet<string>;
}

/**
 * Cache disque-friendly pour les téléchargements d'images.
 *
 * Implémentation typique : un Map<string, string> en mémoire indexé sur le
 * hash GitBook, avec persistance sur disque entre runs (lecture du dossier
 * `imagesDir` au démarrage).
 */
export interface ImageCache {
  has(key: string): boolean;
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

/**
 * Signature uniforme d'un transformeur.
 *
 * - `name` : identifiant lisible (utile pour les logs et les tests).
 * - `apply` : transforme la source. Peut être sync OU async — le runner gère
 *   les deux cas via `await`. Les transformeurs Phase 1 sont sync sauf
 *   `images` qui est async (fetch HTTP).
 *
 * Convention : un transformeur ne doit JAMAIS lever sur une entrée vide ou
 * sur une absence du pattern qu'il cible (ex. `stripFooter` no-op si pas de
 * footer). Idempotence souhaitable.
 */
export interface Transformer {
  name: string;
  apply: (source: string, ctx: TransformContext) => string | Promise<string>;
}
