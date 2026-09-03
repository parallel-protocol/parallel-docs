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
  "^/(favicon\\.(ico|png)|hero(-750|-1125)?\\.(jpg|webp)|logo(-b|-w)?\\.(png|webp)|og-image\\.png|images/.*)$";
const STATIC_IMAGE_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

/** Bare section roots that would otherwise 404. */
const REDIRECTS: { from: string; to: string }[] = [
  { from: "/developers-hub", to: "/developers-hub/developers-guide" },
];

/**
 * The user agents Vocs classifies as AI crawlers, mirrored from its
 * `aiUserAgents` list. Search engines are deliberately absent: upstream serves
 * them the HTML, and so do we.
 */
const AI_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "anthropic-ai",
  "ClaudeBot",
  "claude-web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "FacebookBot",
  "meta-externalagent",
  "Bytespider",
  "cohere-ai",
  "AI2Bot",
  "CCBot",
  "Diffbot",
  "omgili",
  "Timpibot",
  "MistralAI-User",
  "GoogleAgent-Mariner",
];

/**
 * Vocs answers AI crawlers with markdown on every page except the root, where
 * its condition checks the terminal and `Accept` cases but not the crawler one.
 * A patch fixes that, but a patch only applies when the dependency is actually
 * reinstalled — and Vercel restores `node_modules` from the build cache, so the
 * fix reached production as a no-op and nobody could tell.
 *
 * Doing it here instead makes the behaviour independent of how the dependency
 * was installed: the root is rewritten to `/llms.txt`, which is what the
 * patched middleware serves anyway.
 */
const AI_ROOT_REWRITE: VercelRoute = {
  src: "^/$",
  has: [{ type: "header", key: "user-agent", value: `(?i).*(${AI_USER_AGENTS.join("|")}).*` }],
  dest: "/llms.txt",
};

const ALL_RESPONSES = "^/(.*)$";

/**
 * Vercel validates every route against a fixed schema and rejects the whole
 * deployment (`invalid_routes`) if an object carries a field it does not know,
 * so our routes cannot be tagged with a marker of our own. They are recognised
 * on a re-run by their `src` instead, which is what makes the merge idempotent.
 */
function ourSources(): Set<string> {
  return new Set([
    ALL_RESPONSES,
    STATIC_IMAGES,
    AI_ROOT_REWRITE.src as string,
    ...REDIRECTS.map(({ from }) => `^${from}/?$`),
  ]);
}

export function withDeliveryRoutes(config: VercelConfig): VercelConfig {
  const mine = ourSources();
  const existing = (config.routes ?? []).filter(
    (route) => typeof route.src !== "string" || !mine.has(route.src),
  );

  const ours: VercelRoute[] = [
    // `continue: true` applies the headers and keeps matching, so the adapter's
    // own routes still decide what actually answers the request.
    { src: ALL_RESPONSES, headers: SECURITY_HEADERS, continue: true },
    { src: STATIC_IMAGES, headers: { "cache-control": STATIC_IMAGE_CACHE }, continue: true },
    ...REDIRECTS.map(({ from, to }) => ({
      src: `^${from}/?$`,
      status: 308,
      headers: { Location: to },
    })),
    AI_ROOT_REWRITE,
  ];

  return { ...config, routes: [...ours, ...existing] };
}
