# Parallel Vocs v1.4.1 → v2 migration (branch v2-clean)

## Plan
- [ ] 1. package.json: align deps on eUSD/Rocky v2 + keep katex/radix-tabs/lucide; remove Inter (n/a)
- [ ] 2. Structure: docs/pages→src/pages, docs/public→public, vocs.config.tsx→vocs.config.ts, remove docs/
- [ ] 3. vocs.config.ts: mirror eUSD/Rocky, Parallel values, NO baseUrl, partial-static, OG auto, markdown katex
- [ ] 4. _slots.tsx (export {}); vercel.json {buildCommand}; tsconfig include src/pages; _root.css (katex import)
- [ ] 5. Components: keep+clean ContractAddressesPage/ContractTable/Tabs (v2 vars + "use client"); copy clean PageCardGrid/LinkCard from eUSD; delete PageHeader/AuditCard/DiagramFigure/LegacyBanner/Footer; tokens.css cleanup
- [ ] 6. Content: PageHeader → # H1 on 133 pages (drop import+tag+subtitle, keep hero img)
- [ ] 7. sidebar.generated.ts: fix Sidebar type import
- [ ] 8. pnpm install --ignore-workspace
- [ ] 9. Verify: greps, VERCEL build (RSC.func), node build, tsc, vitest, /api/og, 5 addr pages, 7 tabs, sections
- [ ] 10. Commit on v2-clean

## Review (done)
- v2 deps aligned (vocs 2.0.11, react 19, waku 1.0.0-beta.1, vite 8, plugin-react 6). Math handled by build-time prerender (katex devDep); rehype-katex/remark-math removed.
- Structure: docs/pages→src/pages, docs/public→public, vocs.config.ts, docs/ removed.
- Config: NO baseUrl, partial-static, OG auto, accent violet, editLink, socials+discord, topNav. _slots export {}; _root.css (katex CSS); vercel.json {buildCommand pnpm build}.
- Components kept+cleaned to v2 vars + "use client": ContractAddressesPage, ContractTable, Tabs. PageCardGrid/LinkCard from eUSD. Math added for prerendered KaTeX. Deleted: PageHeader, AuditCard, DiagramFigure, LegacyBanner, Footer, tokens.css, 4 dead css.
- 133 PageHeader → # H1 (138/138 pages have H1). 3 KaTeX formulas prerendered.
- VERIF: VERCEL build OK + RSC.func; node build OK; no <base href>; tsc 0 err; vitest 40/40 components (2 pre-existing hero crawler tests fail, non-blocking); 5 ContractAddressesPage + 7 Tabs render in HTML; /api/og → 200 image/webp; callouts native.
