import type { Transformer } from "../types";

/**
 * Normalise les HTML inline pour la compat MDX/JSX :
 *
 * 1. **Attributs** : `class="…"` → `className="…"` (JSX)
 * 2. **Void elements** : `<img>`, `<br>`, `<hr>` etc. doivent être
 *    self-closed (`<img />`) en JSX. HTML les autorise non-fermés mais
 *    MDX/JSX lève "Unexpected closing tag" sinon.
 *
 * GitBook injecte parfois du HTML brut dans le markdown source (ex.
 * `<a class="button primary">…</a>` ou `<figure><img src="…"></figure>`).
 * Ce transformer normalise les 2 cas en 1 passe.
 *
 * Limitations connues (non-bloquantes pour eUSD) :
 * - Le regex matche dans tout le source, y compris à l'intérieur de
 *   blocs ``` qui contiendraient du `class=` ou `<img>` littéral. Improbable
 *   sur eUSD (audit a montré 0 code block sur 6 pages samplées).
 * - Couvre `class` et les void elements HTML standards. Si on rencontre
 *   `for=` (label), `tabindex=`, etc., les ajouter au pattern.
 */

// Match `<tag … class=` (à l'intérieur d'un tag HTML uniquement, pas en prose).
// Le `<` et l'espace avant `class` empêchent les faux positifs.
const CLASS_ATTR_REGEX = /(<[a-zA-Z][^>]*?\s)class(\s*=)/g;

// Liste des void elements HTML (cf. spec WHATWG). Ces tags ne peuvent pas
// avoir de contenu et doivent être self-closed en JSX.
const VOID_ELEMENTS_PATTERN = "img|br|hr|input|meta|link|area|base|col|embed|source|track|wbr";

// Match `<voidtag … >` qui n'est pas déjà self-closed (lookbehind `(?<!\/)`).
const VOID_TAG_REGEX = new RegExp(
  `(<(?:${VOID_ELEMENTS_PATTERN})\\b[^>]*?)(?<!\\/)>`,
  "g",
);

export const htmlAttrs: Transformer = {
  name: "htmlAttrs",
  apply: (source: string) => {
    let out = source.replace(CLASS_ATTR_REGEX, "$1className$2");
    out = out.replace(VOID_TAG_REGEX, "$1 />");
    return out;
  },
};
