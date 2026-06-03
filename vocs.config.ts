import { defineConfig } from "vocs/config";
import { sidebar } from "./src/sidebar.generated";

// Absolute site origin — used ONLY for the absolute `og:image` URL.
// IMPORTANT: do NOT feed this into `baseUrl`. Vocs turns `baseUrl` into a
// `<base href>`, which makes ALL relative assets (client JS, search index,
// logo) resolve against that fixed domain — so on any preview URL (or
// localhost) the hashed assets 404 against production → no hydration →
// search / sidebar / theme all dead. Leaving `baseUrl` unset lets assets
// resolve relative to the actual serving host (works on prod + previews).
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
  // Auto-generated per-page OG image (title + description composed on the
  // Vocs `/api/og` template, served by the partial-static RSC function).
  // Prefixed with the absolute SITE_URL because og:image must be absolute for
  // social crawlers. `%title`/`%description` are substituted per page.
  ogImageUrl: `${SITE_URL}/api/og?title=%title&description=%description`,
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
    { text: "Landing Page", link: "https://parallel.best/", external: true },
    { text: "App", link: "https://app.parallel.best/", external: true },
    { text: "Brand Assets", link: "https://brand.parallel.best/", external: true },
    { text: "Blog", link: "https://blog.parallel.best/", external: true },
  ],
  sidebar,
});
