#!/usr/bin/env tsx
/**
 * Post-build SEO step — runs after `vocs build` (wired into the `build` script).
 *
 * 1. Emits `sitemap.xml` into the build output, listing every page under
 *    `src/pages` as `https://docs.parallel.best/<route>` with `lastmod` set to
 *    the build date. Vocs' built-in sitemap plugin (`vocs:sitemap`) only runs
 *    when `baseUrl` is configured — and `baseUrl` must stay UNSET in this repo
 *    (see the comment in `vocs.config.ts`: it emits a `<base href>` that breaks
 *    assets/search on preview deploys) — so we emit the sitemap ourselves with
 *    the production origin hardcoded. Route mapping mirrors `vocs:sitemap`:
 *    skip `_`-prefixed files/dirs, strip `.md/.mdx/.tsx`, `/index` → parent.
 *
 * 2. Injects the PostHog analytics snippet before `</head>` of every
 *    prerendered HTML page. Vocs v2 removed the v1 `head` config option (no
 *    head/slots hook reaches `<head>`), so build-time injection is the only
 *    non-patch way to add the script tag.
 *
 * 3. Injects `<link rel="canonical">` and `<meta property="og:url">` into every
 *    page, for the same reason — Vocs emits neither, and `baseUrl` (which would
 *    give it an origin to build them from) has to stay unset. The URL comes from
 *    the page's own output path, so it always matches where the page is served,
 *    and the same route mapping feeds the sitemap, so the two cannot drift.
 *
 * Steps 2 and 3 strip what a previous run added before re-adding it, so running
 * this over an already-processed build is a byte-for-byte no-op.
 *
 * Output dirs handled: `dist/public` (local `vocs build`) and
 * `.vercel/output/static` (Vocs Vercel adapter / Build Output API).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";

import { PRODUCTION_ORIGIN } from "../site.config";
import { MIMO_DEPRECATED_ADDRESSES } from "../src/data/mimo-deprecated-addresses";
import { PAR_ADDRESSES } from "../src/data/par-addresses";
import { PAUSD_DEPRECATED_ADDRESSES } from "../src/data/pausd-deprecated-addresses";
import { PRL_ADDRESSES } from "../src/data/prl-addresses";
import { USDP_ADDRESSES } from "../src/data/usdp-addresses";
import { type AddressBook, expandComponents } from "./md-components";
import { type VercelConfig, withDeliveryRoutes } from "./delivery-routes";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES_DIR = join(ROOT, "src/pages");
const SITE_URL = PRODUCTION_ORIGIN;
const OUTPUT_DIRS = [join(ROOT, "dist/public"), join(ROOT, ".vercel/output/static")];

const POSTHOG_KEY = "phc_pSCW7Si5pRWrp7Fdt4A8u37jrCWnPt9nN3qYAX6FHtW3";
const POSTHOG_HOST = "https://eu.i.posthog.com";
// Official posthog-js loader stub + init. `capture_pageview: "history_change"`
// captures the initial pageview AND client-side (SPA) navigations — Vocs
// routes client-side after hydration, so a plain `true` would miss most views.
// `autocapture: false` per analytics policy (pageviews only).
const POSTHOG_SNIPPET = `<script>!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init("${POSTHOG_KEY}",{api_host:"${POSTHOG_HOST}",capture_pageview:"history_change",autocapture:false})</script>`;

function walk(
  dir: string,
  filter: (name: string) => boolean,
  options: { skipUnderscore: boolean },
): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (options.skipUnderscore && entry.name.startsWith("_")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, filter, options));
    else if (filter(entry.name)) files.push(full);
  }
  return files;
}

/**
 * Maps a path relative to a page root — `src/pages` for sources, the build
 * output dir for prerendered HTML — to the route it is served at. Mirrors the
 * route mapping of vocs' built-in `vocs:sitemap` plugin. Single source of truth:
 * the sitemap and the canonical/og:url injection must never disagree.
 */
function routeFromRelative(relPath: string): string {
  return (
    `/${relPath}`
      .replace(/\.(mdx?|tsx?|html)$/, "")
      .replace(/\/index$/, "/")
      .replace(/\/$/, "") || "/"
  );
}

/** Route for a source page under `src/pages`. */
function routeFor(pageFile: string): string {
  return routeFromRelative(relative(PAGES_DIR, pageFile));
}

/** Absolute canonical URL for a route. The home page carries no trailing slash. */
function urlForRoute(route: string): string {
  return route === "/" ? SITE_URL : `${SITE_URL}${route}`;
}

/** Every source file under `src/pages` that is a real page. */
function pageFiles(): string[] {
  // `_`-prefixed files/dirs are layout internals (`_slots.tsx`, `_root.css`), not pages.
  return walk(PAGES_DIR, (name) => /\.(mdx?|tsx?)$/.test(name), { skipUnderscore: true });
}

/**
 * A page opts out of the sitemap by setting `robots: 'noindex, …'` in its
 * frontmatter — the same field Vocs reads to emit the `<meta name="robots">`
 * tag. Keeping both off one declaration means a page can never be noindexed in
 * its head while still being advertised in the sitemap.
 */
function isNoindex(pageFile: string): boolean {
  if (!/\.mdx?$/.test(pageFile)) return false;
  const { data } = matter(readFileSync(pageFile, "utf-8"));
  return typeof data.robots === "string" && /\bnoindex\b/i.test(data.robots);
}

type RouteSets = {
  /** Every served route — these all get a canonical, noindex or not. */
  all: Set<string>;
  /** Routes we want crawled and indexed — exactly what the sitemap lists. */
  indexable: Set<string>;
};

function collectRoutes(): RouteSets {
  const files = pageFiles();
  return {
    all: new Set(files.map(routeFor)),
    indexable: new Set(files.filter((file) => !isNoindex(file)).map(routeFor)),
  };
}

function buildSitemap(routes: Set<string>, modified: Map<string, string>): string {
  const buildDate = new Date().toISOString().split("T")[0];
  const sorted = [...routes].sort((a, b) => urlForRoute(a).localeCompare(urlForRoute(b)));

  const entries = sorted
    .map((route) => {
      // The page's own `article:modified_time` when we have it, the build date
      // only as a fallback for pages that never emitted one.
      const lastmod = (modified.get(route) ?? buildDate).split("T")[0];
      return [
        "  <url>",
        `    <loc>${urlForRoute(route)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</urlset>",
    "",
  ].join("\n");
}

// Existing canonical/og:url tags are stripped before ours are written, so a
// re-run replaces rather than duplicates. Attribute order varies between
// emitters, hence matching on the identifying attribute rather than a fixed shape.
const CANONICAL_TAG = /[ \t]*<link\b[^>]*\brel=["']?canonical["']?[^>]*>[ \t]*\n?/gi;
const OG_URL_TAG = /[ \t]*<meta\b[^>]*\bproperty=["']?og:url["']?[^>]*>[ \t]*\n?/gi;
// Any previously injected PostHog script, identified by the project key rather
// than by an exact snippet match so an older snippet is still replaced.
const POSTHOG_TAG = new RegExp(
  `[ \\t]*<script\\b[^>]*>(?:(?!<\\/script>)[\\s\\S])*?${POSTHOG_KEY}(?:(?!<\\/script>)[\\s\\S])*?<\\/script>[ \\t]*\\n?`,
  "gi",
);

type HeadStats = { posthog: number; canonical: number; jsonld: number; skipped: string[] };

/**
 * Injects the PostHog snippet into every prerendered page, plus a canonical
 * link and `og:url` into the ones that are real routes.
 *
 * The canonical is derived from each file's own output path, so it always
 * matches the URL the page is actually served at; `routes` (the sitemap's route
 * set) then decides which files are pages at all. That keeps the canonical count
 * equal to the sitemap URL count by construction and leaves waku's `404.html`
 * and `_root.d/index.html` shells without a canonical, which is what we want —
 * they are not addressable content.
 */
function injectHeadTags(
  outDir: string,
  routes: Set<string>,
  meta: Map<string, { title: string; description: string }>,
  modified: Map<string, string>,
): HeadStats {
  // Keep `_`-prefixed dirs here: `_root.d/index.html` is waku's fallback HTML
  // shell served for routes that are not statically generated.
  const htmlFiles = walk(outDir, (name) => name.endsWith(".html"), { skipUnderscore: false });
  const stats: HeadStats = { posthog: 0, canonical: 0, jsonld: 0, skipped: [] };

  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf-8");
    const headEnd = html.indexOf("</head>");
    if (headEnd === -1) continue;

    const before = html.slice(0, headEnd);
    const rest = html.slice(headEnd);

    // Strip anything this script previously added, then re-append in a fixed
    // order, so a re-run over an already-processed build is a byte-for-byte no-op.
    const hadPosthog = POSTHOG_TAG.test(before);
    POSTHOG_TAG.lastIndex = 0;
    let head = before
      .replace(CANONICAL_TAG, "")
      .replace(OG_URL_TAG, "")
      .replace(JSONLD_TAG, "")
      .replace(POSTHOG_TAG, "");

    const route = routeFromRelative(relative(outDir, file));
    if (routes.has(route)) {
      const url = urlForRoute(route);
      head += `<link rel="canonical" href="${url}"/><meta property="og:url" content="${url}"/>`;
      head += jsonLdScript(buildGraph(route, meta, modified));
      stats.jsonld++;
      stats.canonical++;
    } else {
      stats.skipped.push(relative(outDir, file));
    }

    head += POSTHOG_SNIPPET;
    if (!hadPosthog) stats.posthog++;

    if (head !== before) writeFileSync(file, head + rest, "utf-8");
  }
  return stats;
}

// ---------------------------------------------------------------------------
// Structured data, real `lastmod`, and an llms.txt in the llmstxt.org shape.
// ---------------------------------------------------------------------------

/** The shared entity id. Every Parallel host points its schema at this one. */
const ORG_ID = "https://parallel.best/#organization";
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Vocs emits `article:modified_time` per page. We reuse it rather than the build
 * clock so `lastmod` and `dateModified` describe the content, not the deploy —
 * a sitemap that claims every page changed on every deploy trains crawlers to
 * ignore the field.
 */
const MODIFIED_TIME_TAG =
  /<meta\b[^>]*\bproperty=["']?article:modified_time["']?[^>]*\bcontent=["']([^"']+)["'][^>]*>/i;

/** Any `<script type="application/ld+json">` this script previously injected. */
const JSONLD_TAG =
  /[ \t]*<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>[ \t]*\n?/gi;

function readModifiedTimes(outDir: string): Map<string, string> {
  const times = new Map<string, string>();
  for (const file of walk(outDir, (name) => name.endsWith(".html"), { skipUnderscore: false })) {
    const match = readFileSync(file, "utf-8").match(MODIFIED_TIME_TAG);
    if (match) times.set(routeFromRelative(relative(outDir, file)), match[1]);
  }
  return times;
}

/** Route → frontmatter title, used for breadcrumb names and llms.txt entries. */
function pageMeta(): Map<string, { title: string; description: string }> {
  const meta = new Map<string, { title: string; description: string }>();
  for (const file of pageFiles()) {
    if (!/\.mdx?$/.test(file)) continue;
    const { data } = matter(readFileSync(file, "utf-8"));
    meta.set(routeFor(file), {
      title: typeof data.title === "string" ? data.title : "",
      description:
        typeof data.description === "string" ? data.description.replace(/\s+/g, " ").trim() : "",
    });
  }
  return meta;
}

function jsonLdScript(payload: unknown): string {
  // `<` is escaped so a value can never close the script element early.
  return `<script type="application/ld+json">${JSON.stringify(payload).replace(/</g, "\\u003c")}</script>`;
}

/** Ancestor routes of `/a/b/c`, deepest last, home first. */
function breadcrumbTrail(route: string): string[] {
  if (route === "/") return ["/"];
  const parts = route.split("/").filter(Boolean);
  const trail = ["/"];
  for (let i = 0; i < parts.length; i++) trail.push(`/${parts.slice(0, i + 1).join("/")}`);
  return trail;
}

function buildGraph(
  route: string,
  meta: Map<string, { title: string; description: string }>,
  modified: Map<string, string>,
): unknown {
  const url = urlForRoute(route);
  const organization = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Parallel Protocol",
    url: "https://parallel.best",
    sameAs: [
      `${SITE_URL}/`,
      "https://x.com/ParallelMoney",
      "https://github.com/parallel-protocol",
      "https://t.me/parallel_money",
      "https://discord.gg/vuuAVAxpcF",
    ],
  };
  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: "Parallel Documentation",
    isPartOf: { "@id": "https://parallel.best/#website" },
    publisher: { "@id": ORG_ID },
  };
  const graph: unknown[] = [organization, website];

  if (route !== "/") {
    const title = meta.get(route)?.title;
    const dateModified = modified.get(route);
    graph.push({
      "@type": "TechArticle",
      ...(title ? { headline: title } : {}),
      url,
      ...(dateModified ? { dateModified } : {}),
      publisher: { "@id": ORG_ID },
      isPartOf: { "@id": WEBSITE_ID },
      image: `${SITE_URL}/og-image.png`,
    });

    // Only rungs that are real, titled routes — a breadcrumb pointing at a URL
    // that does not exist is worse than a shorter breadcrumb.
    const items = breadcrumbTrail(route)
      .map((step) => ({ step, name: step === "/" ? "Docs" : meta.get(step)?.title }))
      .filter((rung): rung is { step: string; name: string } => Boolean(rung.name))
      .map((rung, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: rung.name,
        item: urlForRoute(rung.step),
      }));
    if (items.length > 1) graph.push({ "@type": "BreadcrumbList", itemListElement: items });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * Sections of `llms.txt`, in reading order. Vocs' own generator emits one flat
 * list of every page with no summary and no grouping; llmstxt.org asks for an
 * H1, a blockquote summary, then H2 sections of described links. Keyed by the
 * first route segment.
 */
const LLMS_SECTIONS: { key: string; heading: string }[] = [
  { key: "introduction", heading: "Start here" },
  { key: "products", heading: "Products" },
  { key: "agents", heading: "Agents and payments" },
  { key: "developers-hub", heading: "Developer reference" },
  { key: "governance", heading: "Governance" },
  { key: "security", heading: "Security" },
  { key: "resources", heading: "Resources" },
];

const LLMS_SUMMARY =
  "Public documentation of Parallel, a decentralized stablecoin protocol by Cooper Labs. " +
  "USDp is an overcollateralized USD stablecoin live on 24 chains; sUSDp is its ERC-4626 " +
  "savings vault; PRL is the governance token. The Parallelizer engine mints and burns USDp " +
  "against a basket of reserve assets, with fees that adapt to each asset's exposure, and " +
  "redemption against a proportional share of the backing is available at any time. The " +
  "protocol also runs an x402 payment facilitator and an MCP server for AI agents.";

/**
 * Answer engines routinely confuse this protocol with similarly named projects.
 * Stating the distinction in the file they read first is cheaper than correcting
 * the answers afterwards.
 */
const LLMS_DISAMBIGUATION = [
  "## Disambiguation",
  "",
  "Parallel Protocol (this documentation) is a decentralized stablecoin protocol issuing USDp.",
  "It is unrelated to:",
  "",
  "- Parallel.ai, the AI web-research company.",
  "- Parallel Finance, the Polkadot lending protocol.",
  "- USDP by Paxos, a centrally issued stablecoin — Parallel's stablecoin is USDp.",
  "",
  "Parallel V2 was previously known as Mimo. Pages under `/products/parallel-v2` document",
  "that legacy system; current work is Parallel V3.",
].join("\n");

function buildLlmsTxt(
  routes: Set<string>,
  meta: Map<string, { title: string; description: string }>,
  modified: Map<string, string>,
): string {
  const latest = [...modified.values()].sort().pop();
  const lines: string[] = [
    "# Parallel Documentation",
    "",
    `> ${LLMS_SUMMARY}`,
    "",
    `Last updated: ${(latest ?? new Date().toISOString()).split("T")[0]}`,
    "",
  ];

  const seen = new Set<string>();
  const entry = (route: string): string | null => {
    const info = meta.get(route);
    if (!info?.title) return null;
    seen.add(route);
    const description = info.description ? `: ${info.description}` : "";
    return `- [${info.title}](${urlForRoute(route)})${description}`;
  };

  const overview = entry("/");
  if (overview) lines.push("## Overview", "", overview, "");

  for (const { key, heading } of LLMS_SECTIONS) {
    const items = [...routes]
      .filter((route) => route === `/${key}` || route.startsWith(`/${key}/`))
      .sort()
      .map(entry)
      .filter((line): line is string => line !== null);
    if (items.length > 0) lines.push(`## ${heading}`, "", ...items, "");
  }

  const rest = [...routes]
    .filter((route) => !seen.has(route))
    .sort()
    .map(entry)
    .filter((line): line is string => line !== null);
  if (rest.length > 0) lines.push("## Other pages", "", ...rest, "");

  lines.push(
    "## Full text",
    "",
    `- [Complete documentation as a single file](${SITE_URL}/llms-full.txt)`,
    "",
    LLMS_DISAMBIGUATION,
    "",
  );

  return lines.join("\n");
}

/**
 * The address books, keyed by the identifier the MDX passes as `chains={…}`.
 * Kept next to the expander so a new book is one line here and nothing else.
 */
const ADDRESS_BOOKS: Record<string, AddressBook> = {
  USDP_ADDRESSES,
  PRL_ADDRESSES,
  PAR_ADDRESSES,
  MIMO_DEPRECATED_ADDRESSES,
  PAUSD_DEPRECATED_ADDRESSES,
};

/**
 * Rewrites the markdown exports in place so answer engines read the content a
 * browser shows, not the JSX that would have produced it.
 */
function expandMarkdownExports(outDir: string): { touched: number; total: number } {
  const mdDir = join(outDir, "assets/md");
  if (!existsSync(mdDir)) return { touched: 0, total: 0 };
  const files = walk(mdDir, (name) => name.endsWith(".md"), { skipUnderscore: false });
  let touched = 0;
  for (const file of files) {
    const before = readFileSync(file, "utf-8");
    const after = expandComponents(before, ADDRESS_BOOKS);
    if (after !== before) {
      writeFileSync(file, after, "utf-8");
      touched++;
    }
  }
  return { touched, total: files.length };
}


/**
 * Merges our headers and redirects into the routing config the Vocs Vercel
 * adapter wrote. Absent on a plain `vocs build` — the adapter only runs inside
 * a Vercel build — so a local run reports it and moves on.
 */
function applyDeliveryRoutes(): "written" | "absent" {
  const configPath = join(ROOT, ".vercel/output/config.json");
  if (!existsSync(configPath)) return "absent";
  const config = JSON.parse(readFileSync(configPath, "utf-8")) as VercelConfig;
  writeFileSync(configPath, `${JSON.stringify(withDeliveryRoutes(config), null, 2)}\n`, "utf-8");
  return "written";
}

function main(): void {
  const outDirs = OUTPUT_DIRS.filter((dir) => existsSync(dir));
  if (outDirs.length === 0) {
    console.error(
      `[postbuild-seo] no build output found (looked for ${OUTPUT_DIRS.map((d) => relative(ROOT, d)).join(", ")}) — run \`vocs build\` first.`,
    );
    process.exit(1);
  }

  const delivery = applyDeliveryRoutes();
  console.log(
    delivery === "written"
      ? "[postbuild-seo] .vercel/output/config.json: security headers, static image cache and redirects merged"
      : "[postbuild-seo] .vercel/output/config.json absent (local build) — headers and redirects not applied",
  );

  const { all, indexable } = collectRoutes();
  const meta = pageMeta();
  // Read once, from the first output dir: both dirs hold the same pages.
  const modified = readModifiedTimes(outDirs[0]);
  const sitemap = buildSitemap(indexable, modified);
  const llms = buildLlmsTxt(indexable, meta, modified);
  const urlCount = (sitemap.match(/<loc>/g) ?? []).length;
  const noindexCount = all.size - indexable.size;
  const datedCount = [...indexable].filter((route) => modified.has(route)).length;
  for (const dir of outDirs) {
    writeFileSync(join(dir, "sitemap.xml"), sitemap, "utf-8");
    // Overwrites the flat list Vocs writes at `buildEnd` — this step runs after it.
    writeFileSync(join(dir, "llms.txt"), llms, "utf-8");
    const md = expandMarkdownExports(dir);
    const { posthog, canonical, jsonld, skipped } = injectHeadTags(dir, all, meta, modified);
    console.log(
      `[postbuild-seo] ${relative(ROOT, dir)}: sitemap.xml (${urlCount} URLs, ${noindexCount} noindex page(s) excluded, ${datedCount} with a real lastmod), llms.txt, components expanded in ${md.touched}/${md.total} markdown export(s), canonical + og:url on ${canonical} page(s), JSON-LD on ${jsonld} page(s), PostHog injected into ${posthog} HTML file(s)`,
    );
    // Every served route keeps a canonical, including the noindex ones: they
    // are still real URLs, they are just not advertised for indexing.
    if (canonical !== all.size) {
      console.error(
        `[postbuild-seo] canonical count (${canonical}) does not match page count (${all.size}) in ${relative(ROOT, dir)}`,
      );
      process.exit(1);
    }
    // Never let a page lose its canonical silently.
    if (skipped.length > 0) {
      console.log(`[postbuild-seo]   no canonical (not a page route): ${skipped.join(", ")}`);
    }
  }
}

main();
