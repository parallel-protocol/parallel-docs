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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES_DIR = join(ROOT, "src/pages");
const SITE_URL = "https://docs.parallel.best";
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

/** Every route that is a real page, i.e. exactly what the sitemap lists. */
function pageRoutes(): Set<string> {
  // `_`-prefixed files/dirs are layout internals (`_slots.tsx`, `_root.css`), not pages.
  const pages = walk(PAGES_DIR, (name) => /\.(mdx?|tsx?)$/.test(name), { skipUnderscore: true });
  return new Set(pages.map(routeFor));
}

function buildSitemap(routes: Set<string>): string {
  const lastmod = new Date().toISOString().split("T")[0];
  const locs = [...routes].map(urlForRoute).sort((a, b) => a.localeCompare(b));

  const entries = locs
    .map((loc) =>
      ["  <url>", `    <loc>${loc}</loc>`, `    <lastmod>${lastmod}</lastmod>`, "  </url>"].join(
        "\n",
      ),
    )
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

type HeadStats = { posthog: number; canonical: number; skipped: string[] };

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
function injectHeadTags(outDir: string, routes: Set<string>): HeadStats {
  // Keep `_`-prefixed dirs here: `_root.d/index.html` is waku's fallback HTML
  // shell served for routes that are not statically generated.
  const htmlFiles = walk(outDir, (name) => name.endsWith(".html"), { skipUnderscore: false });
  const stats: HeadStats = { posthog: 0, canonical: 0, skipped: [] };

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
    let head = before.replace(CANONICAL_TAG, "").replace(OG_URL_TAG, "").replace(POSTHOG_TAG, "");

    const route = routeFromRelative(relative(outDir, file));
    if (routes.has(route)) {
      const url = urlForRoute(route);
      head += `<link rel="canonical" href="${url}"/><meta property="og:url" content="${url}"/>`;
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

function main(): void {
  const outDirs = OUTPUT_DIRS.filter((dir) => existsSync(dir));
  if (outDirs.length === 0) {
    console.error(
      `[postbuild-seo] no build output found (looked for ${OUTPUT_DIRS.map((d) => relative(ROOT, d)).join(", ")}) — run \`vocs build\` first.`,
    );
    process.exit(1);
  }

  const routes = pageRoutes();
  const sitemap = buildSitemap(routes);
  const urlCount = (sitemap.match(/<loc>/g) ?? []).length;
  for (const dir of outDirs) {
    writeFileSync(join(dir, "sitemap.xml"), sitemap, "utf-8");
    const { posthog, canonical, skipped } = injectHeadTags(dir, routes);
    console.log(
      `[postbuild-seo] ${relative(ROOT, dir)}: sitemap.xml (${urlCount} URLs), canonical + og:url on ${canonical} page(s), PostHog injected into ${posthog} HTML file(s)`,
    );
    if (canonical !== urlCount) {
      console.error(
        `[postbuild-seo] canonical count (${canonical}) does not match sitemap URL count (${urlCount}) in ${relative(ROOT, dir)}`,
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
