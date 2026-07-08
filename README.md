# Parallel Documentation

Public documentation of the [Parallel](https://parallel.best) stablecoin protocol — USDp, sUSDp, PRL, multi-chain.

Live site: **[docs.parallel.best](https://docs.parallel.best)**

## Stack

- **[Vocs](https://vocs.dev)** v2 — React + Vite documentation framework, MDX-based
- **TypeScript**, **pnpm**, **Biome**
- Deployed on **Vercel**

## Quick start

```bash
pnpm install
pnpm dev          # local dev server on http://localhost:5173
pnpm build        # static build into dist/
pnpm preview      # preview the production build locally
```

Other useful commands:

```bash
pnpm typecheck            # tsc --noEmit
pnpm lint                 # biome check .
pnpm format               # biome format --write .
pnpm test                 # vitest run
pnpm generate:redirects   # regenerate vercel.json redirects from sitemap
pnpm check:images         # verify all referenced images exist
```

## Repository layout

```
src/
├── pages/          # MDX content (mirrors the public URL structure)
├── components/     # UI components (<Tabs>, <ContractAddressesPage>, etc.)
├── data/           # contract addresses data (USDP, PRL, legacy tokens)
├── lib/            # helpers (chains, utils)
└── sidebar.generated.ts   # sidebar definition (hand-maintained)

public/             # static assets (images, treasury reports, favicon, logos)

scripts/
├── crawl-and-convert.ts   # one-shot GitBook → Vocs MDX migration tool
├── generate-redirects.ts
└── check-image-refs.ts

patches/            # pnpm patch for vocs (sidebar toggle, tsconfig paths in dev)
vocs.config.ts      # Vocs config (title, sidebar, topNav, theming, OG image)
vercel.json         # build command + 301 redirects from legacy GitBook URLs
```

## Editing content

- Each MDX file under `src/pages/` corresponds to one URL.
- Internal links use absolute paths (e.g. `/security/audits`).
- Images go in `public/images/` and are referenced as `/images/file.png`.
- Hints use Vocs admonitions: `:::info`, `:::warning`, `:::danger`, `:::tip`.
- The sidebar is maintained by hand in `src/sidebar.generated.ts` — update it when adding or removing pages, then restart the dev server.

## Versioning (v2 / v3)

The protocol has two live versions. Pages are organized under separate folders:

- **v3 (current)** — `/products/parallel-v3/...`, `/developers-hub/parallel-v3/...`
- **v2 (legacy)** — `/products/parallel-v2/...`, `/developers-hub/parallel-v2/...`

## Deployment

The `main` branch auto-deploys to Vercel. The production URL is set via the `SITE_URL` environment variable (resolution order documented at the top of `vocs.config.ts`).
