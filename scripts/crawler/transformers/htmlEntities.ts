import type { Transformer } from "../types";

/**
 * Nettoie les entités HTML résiduelles que GitBook insère systématiquement
 * dans le markdown source.
 *
 * - `&#x20;` (entité HTML pour ESPACE, marqueur GitBook end-of-line) → espace.
 *   Le rendu HTML est correct sans cette transformation (MDX décode l'entité)
 *   mais le source MDX devient bruité et pollue les diffs / recherches.
 * - Trailing whitespace en fin de ligne → strippé (l'entité finit souvent à
 *   la fin d'une phrase → décodée en espace de fin de ligne).
 *
 * Note : on NE collapse PAS les espaces multiples au milieu de ligne, pour
 * ne pas accidentellement casser du contenu intentionnel (markdown hard
 * line breaks `  \n`, alignment dans les tables, etc.). En pratique le
 * source GitBook n'utilise quasiment jamais de hard line breaks (1 cas
 * trouvé sur 177 pages — accidentel) mais autant rester strict.
 *
 * Idempotent : tous ces remplacements convergent vers une forme stable.
 *
 * Doit tourner APRÈS `stripFooter` (le footer contient des `&#x20;`
 * mais sera supprimé de toute façon) et tôt dans le pipeline pour que
 * les autres transformeurs voient déjà un markdown propre.
 */

const HTML_SPACE_ENTITY = /&#x20;/g;
const TRAILING_WHITESPACE = / +$/gm;

export const htmlEntities: Transformer = {
  name: "htmlEntities",
  apply: (source: string) => {
    let out = source.replace(HTML_SPACE_ENTITY, " ");
    out = out.replace(TRAILING_WHITESPACE, "");
    return out;
  },
};
