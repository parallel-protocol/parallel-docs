/**
 * The canonical production origin, shared by everything that has to emit an
 * absolute URL: the `og:image` / `twitter:image` in `vocs.config.ts`, and the
 * sitemap + canonical + `og:url` written by `scripts/postbuild-seo.ts`.
 *
 * It lives here so those cannot drift apart — a page whose canonical says one
 * host while its social card says another is worse than either alone.
 */
export const PRODUCTION_ORIGIN = "https://docs.parallel.best";

/**
 * Origin to use for absolute asset URLs in the current build.
 *
 * Production (and any local build) must speak as `docs.parallel.best`: that is
 * where the pages are served and what the canonical tags claim, so a social
 * card pointing anywhere else cites the wrong property.
 *
 * A preview deployment instead points at *itself*, so a preview's card shows
 * that preview's own image rather than production's. `SITE_URL` overrides
 * everything, as an escape hatch.
 *
 * Note this is only ever used to build absolute URLs for metadata. It must
 * never be fed to Vocs' `baseUrl` — see the comment in `vocs.config.ts`.
 */
export function resolveSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.SITE_URL) return env.SITE_URL;
  if (env.VERCEL_ENV === "preview" && env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return PRODUCTION_ORIGIN;
}
