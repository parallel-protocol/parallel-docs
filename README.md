# Parallel Documentation

The public documentation of the [Parallel](https://parallel.best) protocol, served at https://docs.parallel.best. It is a [Vocs](https://vocs.dev) site built from MDX pages.

## Stack

Versions from `package.json`:

- Vocs `^2.0.11`, patched by `patches/vocs@2.0.11.patch`
- React `^19.2.0`
- Vite `^8.0.11`
- TypeScript `^5.7.2`
- Biome `^1.9.4`, for lint and format
- Vitest `^3.0.0`
- Node `22.x` (`engines`) and pnpm (`pnpm-lock.yaml`)

## Run locally

With Node 22:

```sh
pnpm install --frozen-lockfile
pnpm dev          # http://localhost:5173
pnpm build        # the site, in dist/public
pnpm preview      # serves the build on http://localhost:4173
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest
pnpm lint         # biome check .
```

`pnpm build` runs four steps: `scripts/check-vocs-patch.ts`, which stops the build when the installed Vocs lacks the patch, then `vocs build`, `scripts/postbuild-seo.ts` and `scripts/og-images.ts`.

The root path answers terminals and AI agents, but not search engines, with `llms.txt` instead of HTML. A plain `curl` of `/` returns Markdown, locally as in production. Open it in a browser to see the site.

## Pages

- Each MDX file under `src/pages/` is one URL: `src/pages/security/audits.mdx` is `/security/audits`, and a folder's `index.mdx` is the folder's URL.
- Parallel V3 and the legacy V2 have separate folders: `products/parallel-v3` and `products/parallel-v2`, `developers-hub/parallel-v3` and `developers-hub/parallel-v2`.
- The frontmatter's `title` and `description` become the page's meta tags and the text of its share card.
- Images go in `public/images/` and are linked as `/images/<file>`.
- Callouts use Vocs' `:::info`, `:::tip`, `:::warning` and `:::danger`.
- The "Edit this page" link on the site opens the page's file on `main`.

### The sidebar

The navigation is `src/sidebar.generated.ts`, which `vocs.config.ts` imports. Despite its name and its banner, the file is edited by hand: to add a page, add its entry there, next to its siblings.

Do not run `pnpm generate:sidebar`. The script wrote the file during the migration from GitBook, ordering the entries by `tmp/gitbook-source/_sitemap.json`, a route list that is not in the repository. Without that list, the script stops without writing. With it, the script would replace the file's short labels with the pages' full titles, and drop the entries added by hand since.

### Search engines and share cards

`vocs.config.ts` leaves `baseUrl` unset on purpose: Vocs turns it into a `<base href>`, which breaks assets, search and the sidebar on preview URLs. Without it, Vocs writes no canonical tag, so `scripts/postbuild-seo.ts` completes each page after `vocs build`:

- `sitemap.xml`, one entry per page, with the `article:modified_time` Vocs writes as `lastmod`. A page with `robots: noindex, ...` in its frontmatter is left out, and the same field gives it Vocs' `robots` meta tag.
- A canonical link and `og:url` on every page, built from the page's output path.
- JSON-LD and `llms.txt`. The components left in Vocs' Markdown exports (`assets/md/`, `llms-full.txt`) are expanded to their content.
- The PostHog snippet.
- On Vercel, the response headers and redirects from `scripts/delivery-routes.ts`.

`scripts/og-images.ts` then renders a 1200×630 share card per page into `og/` and points `og:image` and `twitter:image` at it. It fetches the title font, PP Editorial New, from brand.parallel.best at build time. The font is commercial: never commit it to this public repository. If the fetch fails, the build still passes and pages keep `public/og-image.png`.

The production origin, `https://docs.parallel.best`, is set once, in `site.config.ts`.

## Environment variables

Nothing needs to be set to build or run the site. `site.config.ts` reads three variables, for the default `og:image`, the one a page without its own card keeps:

- `SITE_URL`: overrides that image's origin.
- `VERCEL_ENV` and `VERCEL_URL`: set by Vercel. On a preview build, that image points at the preview.

## Deployment

The Vercel project `parallel-docs`, in the `cooperlabs` team, serves https://docs.parallel.best. `vercel.json` sets its build command, `pnpm build`. The Vocs adapter writes the Build Output API format in `.vercel/output`, so `vercel.json` must not set `outputDirectory`, and Vercel ignores headers and redirects set there: they are in `scripts/delivery-routes.ts`.

A push to `main` deploys to production. Other branches and pull requests get preview deployments, behind Vercel Authentication.
