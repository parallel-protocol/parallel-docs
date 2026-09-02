/**
 * Response headers and redirects for the Vercel deployment.
 *
 * These cannot live in `vercel.json`: the Vocs adapter writes
 * `.vercel/output/config.json` itself (Build Output API), and Vercel ignores
 * `vercel.json`'s `headers`, `redirects` and `routes` when that file exists.
 * So the post-build step merges ours into the config the adapter produced.
 *
 * A pure function over the parsed config, so the merge is unit tested without
 * a deployment.
 */

export type VercelRoute = Record<string, unknown>;
export type VercelConfig = { version: number; routes?: VercelRoute[] };

/**
 * `content-security-policy` is deliberately limited to `frame-ancestors`: it is
 * the one directive that cannot break a page by blocking a resource, and it
 * covers the same ground as `x-frame-options` for modern browsers. A full CSP
 * needs an inventory of every script, font and image origin the site loads —
 * worth doing, but not blind.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  "content-security-policy": "frame-ancestors 'self'",
  "strict-transport-security": "max-age=63072000; includeSubDomains",
};

/**
 * Static images served straight from `public/`. They are not fingerprinted, so
 * they cannot be `immutable`: a day of caching removes a revalidation request
 * per page view while keeping a bounded staleness if the logo ever changes.
 * Hashed assets under `/assets/` keep the adapter's own immutable rule.
 */
const STATIC_IMAGES =
  "^/(favicon\\.ico|favicon\\.png|hero\\.jpg|logo\\.png|logo-b\\.png|logo-w\\.png|og-image\\.png|images/.*)$";
const STATIC_IMAGE_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

/** Bare section roots that would otherwise 404. */
const REDIRECTS: { from: string; to: string }[] = [
  { from: "/developers-hub", to: "/developers-hub/developers-guide" },
];

/** Marks our routes so a re-run replaces them instead of stacking duplicates. */
const MARKER = "x-vocs-seo";

export function withDeliveryRoutes(config: VercelConfig): VercelConfig {
  const existing = (config.routes ?? []).filter((route) => !(MARKER in route));

  const ours: VercelRoute[] = [
    // `continue: true` applies the headers and keeps matching, so the adapter's
    // own routes still decide what actually answers the request.
    { [MARKER]: 1, src: "/(.*)", headers: SECURITY_HEADERS, continue: true },
    { [MARKER]: 1, src: STATIC_IMAGES, headers: { "cache-control": STATIC_IMAGE_CACHE }, continue: true },
    ...REDIRECTS.map(({ from, to }) => ({
      [MARKER]: 1,
      src: `^${from}/?$`,
      status: 308,
      headers: { Location: to },
    })),
  ];

  return { ...config, routes: [...ours, ...existing] };
}
