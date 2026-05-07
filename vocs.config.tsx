import { resolve } from "node:path";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { defineConfig } from "vocs";
import { sidebar } from "./src/sidebar.generated";

// Site origin used for `baseUrl` (powers asset prefixing + `og:url`) and the
// absolute `og:image`. Resolution order :
//   1. `SITE_URL` — manual override (set this in Vercel prod env vars to
//      `https://docs.parallel.best` once Cooper Labs cuts over to the
//      custom domain).
//   2. `VERCEL_PROJECT_PRODUCTION_URL` — auto-injected on Vercel production
//      deploys (matches the project's canonical URL alias).
//   3. `VERCEL_URL` — auto-injected on every Vercel deploy (per-deploy URL
//      with the random hash). Used for previews.
//   4. Fallback : the canonical preview domain.
//
// Without this resolution, hardcoding `docs.parallel.best` makes Vocs
// prepend ALL asset paths (logos, hero, og:image) with that origin at
// build time, so `/logo-b.png` becomes `https://docs.parallel.best/logo-b.png`
// on Vercel deploys — which 404s because Vercel serves from a different host.
const SITE_URL = (() => {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://docs-parallel.vercel.app";
})();

export default defineConfig({
  title: "Parallel Documentation",
  description:
    "Public documentation of the Parallel stablecoin protocol — USDP, sUSDP, PRL, multi-chain.",
  rootDir: "docs",
  baseUrl: SITE_URL,
  vite: {
    resolve: {
      alias: {
        // `process.cwd()` resolves to the project root (where Vocs is invoked).
        // Avoid `fileURLToPath(import.meta.url)` — Vite's `.tsx` config bundling
        // rewrites `import.meta.url` to `__vite_injected_original_import_meta_url`,
        // which isn't actually defined at runtime (Vocs 1.4.1 + Vite 7).
        "@": resolve(process.cwd(), "./src"),
      },
    },
  },
  iconUrl: "/logo-b.png",
  // Vocs swaps automatically based on prefers-color-scheme + theme toggle.
  logoUrl: {
    light: "/logo-b.png", // black wordmark on light backgrounds
    dark: "/logo-w.png", // white wordmark on dark backgrounds
  },
  // Vocs 1.4.1 `useOgImageUrl` hook returns `undefined` when `ogImageUrl` is a
  // plain string (the early `if (!pathKey) return undefined` short-circuits the
  // string-case fallthrough below it). Workaround: pass it as an object map
  // keyed by pathname prefix — `"/"` matches every page.
  //
  // Absolute URL: Vocs does NOT auto-prepend `baseUrl` to a static og:image
  // (only the `%logo`/`%title`/`%description` template tokens get baseUrl
  // injected). Social-card scrapers require an absolute URL to fetch the image,
  // so we hardcode it here using SITE_URL.
  ogImageUrl: { "/": `${SITE_URL}/og-image.png` },
  // No static `twitter:title` / `twitter:description` here — Twitter, Discord,
  // Slack, LinkedIn and Telegram all fall back to `og:title` / `og:description`
  // (which Vocs emits per page from frontmatter), so we get page-specific
  // social cards for free without maintaining a parallel set of meta tags.
  head: () => (
    <>
      <link rel="apple-touch-icon" href="/logo-b.png" />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
        crossOrigin="anonymous"
      />
      {/* Parallel brand typography : IBM Plex Serif (regular + italic, 400/500/700). */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,700;1,400;1,700&display=swap"
      />
      <meta property="og:site_name" content="Parallel Documentation" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Parallel — Stablecoin Protocol" />
    </>
  ),
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  theme: {
    accentColor: {
      // Parallel brand: purple-heart-700 (light) / purple-heart-500 (dark)
      // Source: app.parallel.best CSS — --primary: var(--purple-heart-700)
      light: "#5a42b8",
      dark: "#7d72e4",
    },
  },
  topNav: [
    { text: "Get USDp", link: "https://app.parallel.best/mint/" },
    { text: "Stake USDp", link: "https://app.parallel.best/earn/" },
  ],
  sidebar,

});
