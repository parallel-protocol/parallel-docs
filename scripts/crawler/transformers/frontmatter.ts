import matter from "gray-matter";
import type { Transformer } from "../types";

const MAX_DESCRIPTION_LENGTH = 160;
const H1_REGEX = /^#\s+(.+?)\s*$/m;

const HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&#x27;": "'",
  "&nbsp;": " ",
};

// Unescape the few HTML entities GitBook injects into markdown text (notably
// `&amp;` in titles like "Hyperlane & Eden"). Meta descriptions are consumed
// raw by social-card scrapers, so leaving entities encoded shows up as
// literal "&amp;" in Twitter / LinkedIn / Discord previews.
function unescapeHtml(s: string): string {
  return s.replace(
    /&(?:amp|lt|gt|quot|apos|nbsp|#39|#x27);/g,
    (m) => HTML_ENTITY_MAP[m] ?? m,
  );
}

function extractFirstParagraph(bodyAfterH1: string): string {
  let remaining = bodyAfterH1.replace(/^\s*\n+/, "");
  // Boucle : skip les tables markdown (|…) et blocs HTML (<tag…) qui ne font
  // pas une bonne meta description ; on continue jusqu'au prochain bloc.
  // Un heading (#…) en tête bloque la recherche (= description vide), comme
  // précédemment — ça reflète "page sans paragraphe d'intro".
  while (remaining.length > 0) {
    const match = remaining.match(/^([^\n]+(?:\n[^\n]+)*)/);
    if (!match) return "";
    const para = match[1].split(/\n##/)[0].trim();

    if (para.startsWith("#")) return "";

    if (para.startsWith("|") || /^<[a-zA-Z]/.test(para)) {
      const next = remaining.slice(match[0].length).replace(/^\s*\n+/, "");
      if (next === remaining) return ""; // safety
      remaining = next;
      continue;
    }

    return para.replace(/\n/g, " ");
  }
  return "";
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export const frontmatter: Transformer = {
  name: "frontmatter",
  apply: (source: string) => {
    const parsed = matter(source);
    const content = parsed.content;
    const passthroughSubtitle = parsed.data.subtitle as string | undefined;
    const hasSubtitle =
      typeof passthroughSubtitle === "string" &&
      passthroughSubtitle.trim().length > 0;

    const h1Match = content.match(H1_REGEX);
    if (!h1Match) {
      throw new Error("[frontmatter] No H1 found in source markdown");
    }

    const title = h1Match[1].trim();
    const afterH1 = content.slice((h1Match.index ?? 0) + h1Match[0].length);
    const rawDescription = extractFirstParagraph(afterH1);
    // Fallback to subtitle when the body opens with a table / HTML block /
    // heading and `extractFirstParagraph` returns "". Better than letting
    // og:description be empty on the home page and other short stub pages.
    const descriptionSource =
      rawDescription || (hasSubtitle ? (passthroughSubtitle as string).trim() : "");
    const description = truncate(unescapeHtml(descriptionSource), MAX_DESCRIPTION_LENGTH);

    const bodyWithoutH1 = content.replace(H1_REGEX, "").replace(/^\s*\n+/, "");

    const data: Record<string, unknown> = { title, description };
    if (hasSubtitle) {
      data.subtitle = passthroughSubtitle;
    }
    return matter.stringify(bodyWithoutH1, data);
  },
};
