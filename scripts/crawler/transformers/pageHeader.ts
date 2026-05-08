import matter from "gray-matter";
import type { Transformer, TransformContext } from "../types";

/**
 * Injecte `<PageHeader breadcrumb={...} title="..." subtitle={...} />` au top
 * du body MDX, juste après le frontmatter. Le composant rend un `<header>`
 * GitBook-like contenant breadcrumb + H1 + subtitle dans un seul bloc.
 *
 * Pourquoi le H1 ici (et pas via Vocs) :
 *   Vocs n'auto-rend pas l'H1 dans le body (juste dans `<head><title>`).
 *   On rend donc le H1 nous-mêmes pour matcher le layout GitBook
 *   (breadcrumb au-dessus, subtitle en-dessous, dans le même bloc visuel).
 *
 * Construit le breadcrumb depuis `pathname(ctx.url)` :
 *  - exclut le dernier segment (= page courante, redondant avec H1)
 *  - chaque entrée a un href cumulatif (`/a`, `/a/b`, …)
 *  - `LABEL_OVERRIDES` pour les acronymes (eUSD, RedStone…)
 *
 * No-op si racine `/` ET pas de subtitle ET pas de title (rare).
 *
 * Doit tourner EN DERNIER dans le pipeline, après `frontmatter` (qui pose
 * title + subtitle dans le YAML) — ainsi pageHeader peut lire les 2 props
 * directement depuis le frontmatter qu'il vient de parser.
 */

const LABEL_OVERRIDES: Record<string, string> = {
  eusd: "eUSD",
  redstone: "RedStone",
};

function humanize(segment: string): string {
  if (segment in LABEL_OVERRIDES) return LABEL_OVERRIDES[segment];
  return segment
    .split("-")
    .map((w) => (w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

function buildBreadcrumb(
  pathname: string,
  validRoutes?: ReadonlySet<string>,
): BreadcrumbEntry[] {
  if (pathname === "/" || pathname === "") return [];
  const segments = pathname.split("/").filter((s) => s.length > 0);
  // Exclure le dernier segment (= page courante, redondant avec H1)
  const breadcrumbSegments = segments.slice(0, -1);
  let cumulative = "";
  return breadcrumbSegments.map((seg) => {
    cumulative += `/${seg}`;
    const entry: BreadcrumbEntry = { label: humanize(seg) };
    // Si validRoutes est fourni, on n'émet un href que pour les routes qui
    // existent réellement (sinon → 404 au clic). Sans validRoutes, fallback
    // legacy : on émet toujours un href.
    if (!validRoutes || validRoutes.has(cumulative)) {
      entry.href = cumulative;
    }
    return entry;
  });
}

export const pageHeader: Transformer = {
  name: "pageHeader",
  apply: (source: string, ctx: TransformContext) => {
    const parsed = matter(source);
    const pathname = new URL(ctx.url).pathname;
    const breadcrumb = buildBreadcrumb(pathname, ctx.validRoutes);
    const title = parsed.data.title as string | undefined;
    const subtitle = parsed.data.subtitle as string | undefined;
    const hasTitle = Boolean(title && title.trim().length > 0);
    const hasSubtitle = Boolean(subtitle && subtitle.trim().length > 0);

    if (breadcrumb.length === 0 && !hasTitle && !hasSubtitle) return source;

    const importLine = `import { PageHeader } from '@/components/PageHeader'`;
    const breadcrumbJson = JSON.stringify(breadcrumb);
    const titleProp = hasTitle ? ` title={${JSON.stringify(title)}}` : "";
    const subtitleProp = hasSubtitle
      ? ` subtitle={${JSON.stringify(subtitle)}}`
      : "";
    const headerJsx = `<PageHeader breadcrumb={${breadcrumbJson}}${titleProp}${subtitleProp} />`;

    const body = parsed.content.replace(/^\s*\n+/, "");
    const newBody = `${importLine}\n\n${headerJsx}\n\n${body}`;
    return matter.stringify(newBody, parsed.data);
  },
};
