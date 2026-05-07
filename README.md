# Parallel Documentation

Public documentation of the [Parallel](https://parallel.best) stablecoin protocol — USDP, sUSDP, PRL, multi-chain.

Live site: **[docs.parallel.best](https://docs.parallel.best)**

## Stack

- **[Vocs](https://vocs.dev)** — React + Vite documentation framework, MDX-based
- **TypeScript**, **pnpm**, **Biome**
- Deployed on **Vercel**

## Quick start

```bash
pnpm install
pnpm dev          # local dev server on http://localhost:5173
pnpm build        # static build into docs/dist
pnpm preview      # preview the production build locally
```

Other useful commands:

```bash
pnpm typecheck            # tsc --noEmit
pnpm lint                 # biome check .
pnpm format               # biome format --write .
pnpm test                 # vitest run
pnpm generate:sidebar     # regenerate src/sidebar.generated.ts from docs/pages/
pnpm generate:redirects   # regenerate vercel.json redirects from sitemap
pnpm check:images         # verify all referenced images exist
```

## Repository layout

```
docs/
├── pages/          # MDX content (mirrors the public URL structure)
├── public/         # static assets (images, audits PDFs, favicon, logos)
└── components/     # MDX-facing components

src/
├── components/     # shared UI components (<Tabs>, <ContractAddressesPage>, etc.)
├── lib/            # helpers (chains, contracts)
├── sidebar.generated.ts   # auto-generated from docs/pages/
└── tokens.css      # design tokens

scripts/
├── crawl-and-convert.ts   # one-shot GitBook → Vocs MDX migration tool
├── generate-sidebar.ts
├── generate-redirects.ts
└── check-image-refs.ts

vocs.config.tsx     # Vocs config (title, sidebar, topNav, theming, OG image)
vercel.json         # 301 redirects from legacy GitBook URLs
```

## Editing content

- Each MDX file under `docs/pages/` corresponds to one URL.
- Internal links use absolute paths (e.g. `/security/audits`).
- Images go in `docs/public/images/<topic>/` and are referenced as `/images/<topic>/file.png`.
- Hints use Vocs admonitions: `:::info`, `:::warning`, `:::danger`, `:::tip`.
- After adding/removing pages, run `pnpm generate:sidebar` to refresh the sidebar.

## Versioning (v2 / v3)

The protocol has two live versions. Pages are organized under separate folders:

- **v3 (current)** — `/products/parallel-v3/...`, `/developers-hub/parallel-v3/...`
- **v2 (legacy)** — `/products/parallel-v2/...`, `/developers-hub/parallel-v2/...`

Legacy v2 pages display a "v2 (legacy)" banner pointing readers to v3.

## Deployment

The `main` branch auto-deploys to Vercel. The production URL is set via the `SITE_URL` environment variable (resolution order documented at the top of `vocs.config.tsx`).

## Migration context

This site replaces the previous GitBook documentation. See [`AUDIT.md`](./AUDIT.md) for the complete content audit and migration plan, and [`BRIEF-CRAWLER.md`](./BRIEF-CRAWLER.md) for the crawler workflow that imports content from GitBook.

Project conventions and Claude Code workflow guidelines are in [`CLAUDE.md`](./CLAUDE.md).
