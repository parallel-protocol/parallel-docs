import { defineConfig } from "vocs/config";
import { resolveSiteUrl } from "./site.config";
import { sidebar } from "./src/sidebar.generated";

// Absolute site origin — used ONLY for the absolute `og:image` URL.
// IMPORTANT: do NOT feed this into `baseUrl`. Vocs turns `baseUrl` into a
// `<base href>`, which makes ALL relative assets (client JS, search index,
// logo) resolve against that fixed domain — so on any preview URL (or
// localhost) the hashed assets 404 against production → no hydration →
// search / sidebar / theme all dead. Leaving `baseUrl` unset lets assets
// resolve relative to the actual serving host (works on prod + previews).
//
// Previously this fell back to the project's `.vercel.app` host, so every
// production page advertised its social card on a preview domain. It now
// resolves to the real production origin, shared with the sitemap and the
// canonical tags — see `site.config.ts`.
const SITE_URL = resolveSiteUrl();

export default defineConfig({
  title: "Parallel Documentation",
  description:
    "Public documentation of the Parallel stablecoin protocol — USDp, sUSDp, PRL, multi-chain.",
  // NOTE: `baseUrl` intentionally NOT set — see SITE_URL comment above
  // (it emits a `<base href>` that breaks relative assets on preview URLs).
  // `partial-static`: pages pre-rendered to static HTML + client hydration +
  // a small serverless RSC function. On Vercel the Vocs adapter emits
  // `.vercel/output` (Build Output API); `vercel.json` must NOT override
  // `outputDirectory` or it bypasses the adapter.
  renderStrategy: "partial-static",
  iconUrl: "/favicon.ico",
  // Vocs swaps automatically based on prefers-color-scheme + theme toggle.
  logoUrl: {
    light: "/logo-b.png", // black wordmark on light backgrounds
    dark: "/logo-w.png", // white wordmark on dark backgrounds
  },
  // Static OG image — each protocol's official landing-page OpenGraph
  // image (1200x630). Absolute SITE_URL so og:image is absolute for crawlers.
  ogImageUrl: `${SITE_URL}/og-image.png`,
  // v2: `theme.accentColor` is replaced by a top-level `accentColor` string
  // using the CSS `light-dark()` function. Parallel brand: purple.
  accentColor: "light-dark(#5a42b8, #7d72e4)",
  // Native v2 footer area (edit-link + prev/next pagination) — no custom
  // footer band. Resource links live in the top-nav; socials render as
  // top-nav icons; the CTAs stay in the top nav.
  editLink: {
    link: "https://github.com/parallel-protocol/parallel-docs/edit/main/src/pages/:path",
    text: "Edit this page",
  },
  socials: [
    { icon: "x", link: "https://x.com/ParallelMoney" },
    { icon: "telegram", link: "https://t.me/parallel_money" },
    { icon: "github", link: "https://github.com/parallel-protocol" },
    { icon: "discord", link: "https://discord.gg/vuuAVAxpcF" },
  ],
  topNav: [
    { text: "Get USDp", link: "https://app.parallel.best/mint/" },
    { text: "Stake USDp", link: "https://app.parallel.best/earn/" },
    { text: "Build", link: "/agents/overview" },
    {
      text: "Resources",
      items: [
        { text: "Landing Page", link: "https://parallel.best/", external: true },
        { text: "App", link: "https://app.parallel.best/", external: true },
        { text: "Brand Assets", link: "https://brand.parallel.best/", external: true },
        { text: "Blog", link: "https://blog.parallel.best/", external: true },
      ],
    },
  ],
  sidebar,
});
