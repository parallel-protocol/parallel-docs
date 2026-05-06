# CLAUDE.md — `cooperlabs/docs-parallel`

> Documentation publique du protocole **Parallel** (stablecoin USDP/sUSDP, token PRL, multi-chain). Migration GitBook → Vocs. **Le plus gros des 4 sites Cooper Labs.**

## Contexte projet

- **Stablecoin actuel (v3)** : USDP / sUSDP
- **Stablecoin legacy (v2)** : PAR / paUSD (gardés en doc legacy)
- **Token gouvernance** : PRL (legacy MIMO)
- **Modules v3** : Parallelizer, Savings, Flashloan, Bridging
- **Modules v2 legacy** : Classic Vaults, Super Vaults (SV), action contracts
- **Chaînes USDP** : 25+ (Ethereum, Base, Sonic, Hyperevm, Avalanche, Polygon, Arbitrum, Optimism, Sei, BSC, Berachain, Scroll, Gnosis, Unichain, Ink, TAC, Linea, X-Layer, Plume, Plasma, Katana, Fraxtal, World, Hemi)
- **Chaînes PRL** : ~7 (Ethereum, Polygon, Fantom, Base, Sonic, Arbitrum, Optimism)
- **URL cible** : `docs.parallel.best`
- **Source** : crawler des URLs `.md` publiques de GitBook (one-shot, sans intervention Cooper Labs)
- **Volume** : ~170 pages, ~98 k mots, ~210 images
- **Hints estimés** : ~170 (info ~130, warning ~40)
- **Tabs** : ~10 (principalement sur `proof-of-solvency`)
- **Spécificités** : versioning v2/v3 vivants en parallèle, governance complète (PRL, proposals, DAO multisigs, treasury), 25+ chaînes addresses, ~8 pages élections multisigs

**Effort estimé : 10-12 jours.** Ce projet est ~5× plus gros et plus complexe que les autres docs Cooper Labs.

Audit complet du contenu source : voir `AUDIT.md` (à la racine du repo, le plus détaillé des 4 audits).

## Stack

- **Framework** : [Vocs](https://vocs.dev) (React + Vite, MDX)
- **Lang** : TypeScript
- **Styles** : CSS variables Vocs + Tailwind si besoin
- **Composants** : copiés une fois depuis le template `../docs-shared/src/` au scaffold, **étendus localement** pour Parallel avec `<Tabs>` et `<ContractAddressesPage>` (composants Phase 2 du brief crawler). Pas de dépendance runtime. Chaque repo 100% autonome.
- **Hosting** : Vercel
- **Package manager** : pnpm

## Structure attendue du repo

```
docs-parallel/
├── docs/
│   ├── pages/
│   │   ├── index.mdx
│   │   ├── introduction/
│   │   │   ├── products.mdx
│   │   │   └── use-cases.mdx
│   │   ├── products/
│   │   │   ├── parallel-v3/                     # current
│   │   │   │   ├── how-it-works/
│   │   │   │   │   ├── parallelizer-module.mdx
│   │   │   │   │   ├── savings-module.mdx
│   │   │   │   │   ├── flashloan-module.mdx
│   │   │   │   │   └── bridging-module.mdx
│   │   │   │   ├── stablecoins-and-savings/
│   │   │   │   │   └── usdp-and-susdp/
│   │   │   │   │       ├── implementation.mdx
│   │   │   │   │       └── fee-distribution.mdx
│   │   │   │   ├── governance.mdx
│   │   │   │   └── licensing.mdx
│   │   │   └── parallel-v2/                     # legacy (banner "v2 legacy" sur chaque page)
│   │   │       ├── stablecoins/
│   │   │       │   ├── par/
│   │   │       │   └── par-1/                   # paUSD
│   │   │       ├── how-it-works/
│   │   │       │   ├── vaults/
│   │   │       │   ├── bridging-module/
│   │   │       │   └── super-vaults-sv/
│   │   │       └── licensing.mdx
│   │   ├── security/
│   │   │   ├── proof-of-solvency.mdx            # contient au moins 1 tab
│   │   │   ├── parallel-emergency-guardians.mdx
│   │   │   ├── hypernative.mdx
│   │   │   ├── keepers.mdx
│   │   │   ├── bug-bounty-program.mdx
│   │   │   ├── insurance-fund.mdx
│   │   │   └── audits.mdx
│   │   ├── governance/                          # SECTION ABSENTE DES AUTRES DOCS
│   │   │   ├── parallel-governance-token-prl/
│   │   │   │   ├── issuance.mdx
│   │   │   │   ├── tokenomics/
│   │   │   │   │   ├── epoch-concept.mdx
│   │   │   │   │   ├── staking-mechanisms.mdx
│   │   │   │   │   ├── paraboost.mdx
│   │   │   │   │   └── fee-distribution.mdx
│   │   │   │   ├── governance.mdx
│   │   │   │   ├── bridging-module/
│   │   │   │   └── mimo-to-prl-migration.mdx
│   │   │   ├── sprl.mdx
│   │   │   ├── governance-process.mdx
│   │   │   ├── proposal-framework/
│   │   │   │   ├── parallel-integration-request-pir.mdx
│   │   │   │   ├── parallel-governance-proposal-pgp.mdx
│   │   │   │   └── parallel-improvement-protocol-pip.mdx
│   │   │   ├── dao-multisigs/
│   │   │   │   └── dao-multisigs-elections/
│   │   │   │       ├── election-1.mdx           # 8 élections, ~85 mots chacune
│   │   │   │       └── ... election-8.mdx
│   │   │   └── dao-treasury/
│   │   │       └── dao-treasury-reports.mdx
│   │   ├── developers-hub/
│   │   │   ├── developers-guide.mdx
│   │   │   ├── parallel-v3/
│   │   │   │   ├── parallelizer-module.mdx
│   │   │   │   ├── savings-module.mdx
│   │   │   │   ├── flashloan-module.mdx
│   │   │   │   ├── bridging-module.mdx
│   │   │   │   ├── onchain-tools/
│   │   │   │   │   └── oracles/
│   │   │   │   │       ├── dia/
│   │   │   │   │       └── redstone/
│   │   │   │   ├── offchain-tools/
│   │   │   │   │   ├── subgraphs.mdx
│   │   │   │   │   └── dune.mdx
│   │   │   │   └── build-on-parallel/
│   │   │   │       ├── parallelizer-module-integration.mdx     # ~2025 mots, 6 hints
│   │   │   │       ├── savings-module-integration.mdx
│   │   │   │       └── flashloan-module-integration.mdx
│   │   │   ├── parallel-v2/
│   │   │   │   ├── classic-vaults/
│   │   │   │   ├── bridging-module/
│   │   │   │   └── super-vault-sv/
│   │   │   ├── parallel-governance-token-prl/
│   │   │   └── contract-addresses/
│   │   │       ├── parallel-v3/
│   │   │       │   ├── usdp/
│   │   │       │   │   └── [chain].mdx          # route dynamique factorisée (25+ chaînes)
│   │   │       │   └── prl/
│   │   │       │       └── [chain].mdx          # route dynamique factorisée (~7 chaînes)
│   │   │       └── parallel-v2/                 # PAR + paUSD + MIMO legacy
│   │   └── resources/
│   │       └── user-guides.mdx
│   ├── public/
│   │   ├── images/                              # ~210 images à rapatrier
│   │   ├── audits/                              # PDFs audits
│   │   └── logo.svg
│   └── components/                              # composants spécifiques Parallel si besoin
├── scripts/
│   └── convert-gitbook.ts                       # version étendue (hints + tabs + factoring addresses)
├── data/
│   ├── usdp-addresses.ts                        # 25+ chaînes
│   ├── prl-addresses.ts                         # ~7 chaînes
│   └── elections.ts                             # 8 élections multisigs (si factorisées)
├── vocs.config.ts                               # sidebar massive (170 entrées) + sélecteur version v2/v3
├── vercel.json                                  # 170+ redirects 301
├── package.json
├── README.md
├── AUDIT.md
└── CLAUDE.md
```

## Workflow de migration (à exécuter par Claude Code)

### Étape 1 — Init scaffold

```bash
pnpm create vocs@latest .

# Copier les composants depuis le template
cp -r ../docs-shared/src/components ./src/
cp -r ../docs-shared/src/lib ./src/
cp ../docs-shared/src/tokens.css ./src/
cp -r ../docs-shared/src/test ./src/
```

Setup TS path alias dans `tsconfig.json` :

```json
"paths": {
  "@/*": ["./src/*"]
}
```

### Étape 2 — Étendre les composants locaux pour Parallel

Ajouter dans `src/components/` (en plus des 3 copiés du template) :

- **`<Tabs>` + `<Tab>`** — wrapper pour la conversion de `{% tabs %}{% tab %}` GitBook (utiliser Radix UI Tabs ou équivalent natif Vocs)
- **`<ContractAddressesPage>`** — composant page complète qui prend un `stablecoin` + un mapping `{ chain: contracts[] }` et génère la nav par chaîne + les `<ContractTable>`. Permet de factoriser les 25+ pages d'addresses USDP en une seule page MDX + un data file.
- **`<ElectionResults>`** (optionnel, si Cooper Labs valide) — pour factoriser les 8 pages élections multisigs en composant data-driven

### Étape 3 — Ajouter les 25+ chaînes dans `_shared/lib/chains.ts`

Mapping name + explorer URL pour chaque chaîne (Ethereum, Base, Sonic, Hyperevm, Avalanche, Polygon, Arbitrum, Optimism, Sei, BSC, Berachain, Scroll, Gnosis, Unichain, Ink, TAC, Linea, X-Layer, Plume, Plasma, Katana, Fraxtal, World, Hemi).

### Étape 4 — Crawl GitBook + Conversion en MDX (script étendu)

Écrire `scripts/crawl-and-convert.ts` qui :

1. **Crawl** : lit le sitemap `https://docs.parallel.best/sitemap-pages.xml` (170+ URLs), extrait toutes les pages.
2. Pour chaque URL : fetch `URL.md` → récupère le markdown source GitBook avec extensions propriétaires.
3. **Strip** le footer auto `# Agent Instructions: Querying This Documentation` à la fin de chaque page.
4. **Frontmatter** : génère `title` (H1) + `description` (1er paragraphe).
5. **Liens internes** : convertit `xxx.md` → `xxx` (route Vocs).
6. **Télécharge les ~210 images** depuis `https://docs.parallel.best/files/[hash]` → fichiers locaux dans `public/images/`. Réécrit les `<img>` / `<figure>` en chemins locaux.
7. **Convertit les hints `{% hint %}`** (~170 instances : info ~130, warning ~40) :
   ```
   {% hint style="info" %}        :::info
   content                    →   content
   {% endhint %}                  :::
   ```
   Variantes : `info` → `:::info`, `warning` → `:::warning`, `danger` → `:::danger`, `success` → `:::tip`.
8. **Convertit les tabs `{% tabs %}{% tab %}`** (~10 instances) :
   ```
   {% tabs %}                                    <Tabs>
   {% tab title="USDP" %}content{% endtab %}  →    <Tab label="USDP">content</Tab>
   {% endtabs %}                                 </Tabs>
   ```
9. **Convertit les embeds `{% embed url="..." %}`** : remplacer par lien standard ou iframe selon contexte.
10. **Factorise les pages d'addresses** :
    - Lit chaque page chain GitBook (ex. `contract-addresses/parallel-v3/usdp/ethereum.md`)
    - Extrait les contrats en JSON : `{ name, address, description }[]`
    - Aggrège dans `data/usdp-addresses.ts` : `{ ethereum: [...], base: [...], ... }`
    - Supprime les ~25 pages MDX individuelles
    - Crée une seule page `[chain].mdx` consommant `<ContractAddressesPage>`
11. **Nettoie les artefacts "hashtag"** en début de H2.
12. **Output** : écrit dans `docs/pages/` avec arbo miroir.

**Avantages du crawler :** pas de Cooper Labs (170 pages auto), pas de gel d'éditions sur 10-12 j (énorme gain sur Parallel), itératif.

### Étape 5 — Sidebar Vocs (massive, 170 entrées)

Configurer la sidebar dans `vocs.config.ts`. Trop volumineuse pour copier ici intégralement — soit générer auto depuis `docs/pages/`, soit construire manuellement par sections (Products, Security, Governance, Developers Hub, Resources).

Recommandations :
- Sections rarement consultées (`parallel-v2`, `dao-multisigs-elections`, `parallel-v2` dans dev hub) → `collapsed: true` par défaut
- Maximum 4 niveaux de profondeur (Vocs supporte mais devient lourd visuellement)
- Tester l'UX sidebar mobile avant validation

### Étape 6 — Top nav avec sélecteur de version v2/v3

```ts
topNav: [
  { text: 'Guide', link: '/' },
  { text: 'Developers', link: '/developers-hub/parallel-v3' },
  { text: 'Governance', link: '/governance/parallel-governance-token-prl' },
  {
    text: 'v3',
    items: [
      { text: 'v3 (current)', link: '/products/parallel-v3' },
      { text: 'v2 (legacy)', link: '/products/parallel-v2' },
    ],
  },
  { text: 'GitHub', link: 'https://github.com/parallelfi' },
  { text: 'App', link: 'https://app.parallel.best' },
]
```

### Étape 7 — Banner "v2 (legacy)" sur les pages legacy

Sur toutes les pages sous `/products/parallel-v2/...` et `/developers-hub/parallel-v2/...`, ajouter en haut :

```mdx
:::warning
You're reading the legacy v2 documentation. For current Parallel features, see [v3](/products/parallel-v3).
:::
```

À automatiser via un layout MDX ou un composant inséré par le script de conversion.

### Étape 8 — Theming

Palette Parallel à récupérer du brand existant (Cooper Labs ou app `app.parallel.best`). Logo SVG + 2-3 couleurs principales en CSS variables.

### Étape 9 — Redirects 301

Générer `vercel.json` à partir du sitemap GitBook (`docs.parallel.best/sitemap-pages.xml`) — script qui mappe automatiquement chaque URL GitBook vers sa nouvelle URL Vocs. **170+ redirects** à gérer. Si factorisation des pages addresses, prévoir des redirects spécifiques pour les anciennes URLs `usdp/ethereum`, `usdp/base`, etc. → nouvelle route dynamique `[chain]`.

### Étape 10 — Audit liens internes + SEO

- `pnpm linkinator dist` pour détecter les liens cassés (volume élevé, important).
- **Audit Search Console avec Cooper Labs** avant la bascule : Parallel est le site le plus traffiqué des 4. Identifier les pages haute traffic, vérifier que leurs redirects 301 fonctionnent.

### Étape 11 — Deploy

- Connecter le repo GitHub `cooperlabs/docs-parallel` à Vercel
- Build command : `pnpm build`
- Output : `docs/dist`
- Bascule DNS de `docs.parallel.best` après validation Cooper Labs et go/no-go SEO

## Commandes

```bash
pnpm dev                  # serveur local sur :5173
pnpm build                # build statique dans docs/dist
pnpm preview
pnpm convert              # exécute scripts/convert-gitbook.ts (étendu)
pnpm typecheck
pnpm lint
pnpm linkinator dist      # audit liens cassés (critique vu le volume)
```

## Orchestration via Dorothy (MCP)

Pour tout travail parallélisable (scaffold, transformeurs du crawler, factorisation des 25 pages d'addresses, validation visuelle multi-pages), délègue à des agents MCP **Dorothy** en parallèle. Sur Parallel (170 pages, ~170 hints à valider), l'orchestration parallèle apporte un gain considérable. Tu joues l'orchestrator principal, Dorothy gère la délégation. Tu valides chaque output avant de commit.

Fallback : si Dorothy n'est pas connectée dans la session, utilise le Task tool natif Claude Code.

## Conventions

- **MDX** : 1 fichier = 1 page, miroir de l'arbo GitBook source (sauf pour les pages addresses factorisées).
- **Liens internes** : toujours en chemins absolus (`/security/audits`).
- **Images** : dans `public/images/[topic]/`, format SVG si possible, sinon PNG/WebP optimisé. Volume élevé (~210 images) → bien organiser par sous-dossier.
- **Composants** : utiliser ceux copiés depuis le template + ceux ajoutés Parallel-spécifiques (`<Tabs>`, `<ContractAddressesPage>`). Tous dans `src/components/`.
- **Pas de couleurs en dur** : tout via CSS variables Vocs.
- **Versioning v2/v3** : pages clairement séparées par dossier. Liens entre v2 et v3 doivent être explicites (anchor texte).

## Gotchas spécifiques Parallel

- **Versioning v2/v3** : deux versions de doc vivantes en parallèle. Le top nav avec sélecteur est essentiel. Les liens entre versions doivent être explicites pour ne pas perdre le lecteur.
- **Sidebar profonde (4 niveaux)** : tester l'UX, `collapsed: true` par défaut sur les sections legacy / élections.
- **Pages addresses factorisées** : si la décision est prise de factoriser les 25 pages USDP en 1 route dynamique, attention aux redirects 301 spécifiques (ancien `usdp/ethereum.html` → nouveau `usdp/ethereum/`).
- **8 pages élections multisigs** (très courtes, ~85 mots chacune) : potentiellement factorisables en composant `<ElectionResults>`. À arbitrer avec Cooper Labs.
- **Hints `warning` plus fréquents** que sur les autres docs (~40 estimés) : page Parallelizer Integration en a 3, Staking Mechanisms en a 1. Valider visuellement le rendu (couleur, contraste).
- **Math KaTeX non détecté** sur l'échantillon mais à re-vérifier sur les pages tokenomics avant le démarrage. Si présent, activer le plugin KaTeX dans `vocs.config.ts`.
- **Cooper Labs peut continuer à éditer GitBook** pendant la migration (énorme avantage sur Parallel vu la durée 10-12 j). Le crawler `.md` est re-runnable à n'importe quel moment, on relance juste avant la bascule pour avoir la dernière version.
- **SEO ranking critique** : Parallel est le plus traffiqué. Ne pas négliger les redirects 301. Audit Search Console obligatoire.
- **Les images viennent du CDN GitBook** (UUID space Parallel à récupérer du ZIP source). **Toujours rapatrier**, ne pas dépendre du CDN GitBook après bascule.

## Risques élevés

| Risque | Mitigation |
|---|---|
| SEO ranking cassé sur les pages haute traffic | Audit Search Console avant bascule, redirects 301 testés un par un sur sample de 20 URLs |
| Cooper Labs édite pendant les 10 j de migration | Canal Slack dédié + export delta final |
| Sidebar 170 entrées peu lisible | Tester avec utilisateur réel, sections collapsed par défaut |
| Plus de hints/tabs que les ~170 estimés | Crawl complet + ajout 1 j de buffer si > 250 |

## Référence rapide

- Audit détaillé : `AUDIT.md` (le plus complet des 4 audits Cooper Labs)
- Specs composants (référence) : `_shared/COMPOSANTS-SPECS.md` du dossier de planif parent
- Template source des composants : `../docs-shared/src/`
- Vocs docs : https://vocs.dev/docs
- Vocs versioning : https://vocs.dev/docs/api/config (champ `topNav` avec items)
- Vocs llms.txt : https://vocs.dev/llms.txt
- Sitemap source GitBook : https://docs.parallel.best/sitemap-pages.xml
- App Parallel : https://app.parallel.best

## Validation avant bascule prod

- [ ] Tous les liens internes fonctionnent (`pnpm linkinator dist`) — **critique** vu le volume
- [ ] Toutes les images chargent (~210, sample manuel sur 30 random)
- [ ] Les ~170 hints rendus correctement (audit visuel sur 20 pages random : info + warning)
- [ ] Les ~10 tabs fonctionnels (clavier + lecteur d'écran)
- [ ] Sidebar lisible desktop + mobile (test avec utilisateur réel)
- [ ] Sélecteur v2/v3 fonctionne dans le top nav
- [ ] Banner "v2 (legacy)" présent sur toutes les pages v2 (sous `/products/parallel-v2/` et `/developers-hub/parallel-v2/`)
- [ ] Si pages addresses factorisées : route `[chain]` charge les bonnes données pour 5 chaînes random
- [ ] Si pages individuelles gardées : ~25 pages USDP + ~7 pages PRL chargent correctement
- [ ] Search indexe les 170 pages
- [ ] **Audit Search Console fait avec Cooper Labs** (go/no-go SEO)
- [ ] Redirects 301 testés sur **un sample de 20 URLs GitBook** (mix high-traffic et low-traffic)
- [ ] Si KaTeX activé : formules math rendues correctement
- [ ] Theme passe les contrastes WCAG AA
- [ ] Lien vers `app.parallel.best` dans le top nav fonctionne
- [ ] Screenshots envoyés à Cooper Labs pour sign-off final
