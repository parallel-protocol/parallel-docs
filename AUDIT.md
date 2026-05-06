# Audit contenu Parallel — projet 4/4 (le gros)

**Date** : 2026-05-05
**Pages samplées** : 17 sur ~170 (~10 % de l'échantillon)
**Stablecoin** : USDP / sUSDP (+ legacy PAR / paUSD)
**Token gouvernance** : PRL (legacy MIMO)
**Chaînes** : 25+ (Ethereum, Base, Sonic, Hyperevm, Avalanche, Polygon, Arbitrum, Optimism, Sei, BSC, Berachain, Scroll, Gnosis, Unichain, Ink, TAC, Linea, X-Layer, Plume, Plasma, Katana, Fraxtal, World, Hemi)
**Modules** : Parallelizer, Savings, Flashloan, Bridging

---

## 1. TL;DR

Parallel est **5× plus volumineux** que les 3 autres docs réunis et **plus complexe en syntaxe**. C'est le seul projet qui justifie un effort spécifique sur :
- Le converter de hints (volumineux : ~170 hints estimés)
- Le versioning v2/v3 (legacy + current dans la même doc)
- Une section governance dense (token PRL, proposals, multisigs, treasury)
- Une logique de pages chains à factoriser (25+ pages d'addresses)

**Effort réaliste estimé : 10-12 jours** (vs 8-10 dans le planning initial). À ajuster.

---

## 2. Métriques de volume

| Métrique | Échantillon (17 pages) | Extrapolation 170 pages |
|---|---|---|
| Mots totaux | 9 806 | **~98 000** |
| Mots / page (médiane) | 576 | — |
| Images GitBook | 21 | **~210** |
| Hints `{% hint %}` | 17 | **~170** |
| dont `info` | 13 | ~130 |
| dont `warning` | 4 | ~40 |
| Tabs | 1 | ~10 |
| Code blocks | 0 | possible sur dev pages non samplées |
| Math KaTeX | 0 | aucun confirmé |
| Tables HTML | 0 | passent par `<ContractTable>` |
| Iframes / embeds | 0 | aucun |

> Échantillon volontairement biaisé sur les pages riches en contenu (governance, modules, integration) pour pas sous-estimer la complexité. La répartition réelle peut être un peu plus douce.

---

## 3. Détails par typologie de page

### Pages "module phare" (denses, avec diagrammes)

| Page | Mots | Images | Hints |
|---|---|---|---|
| `parallelizer-module` | 1 629 | 7 | 0 |
| `bridging-module` | 1 210 | 2 | 0 |
| `savings-module` | 377 | 1 | 0 |
| `usdp-and-susdp/implementation` | 1 673 | 0 | 1 |
| `super-vaults-sv/leveraging` (v2) | 381 | 0 | 0 |

Pattern : modules v3 plus riches que v2 (legacy), avec diagrammes pour expliquer les flows.

### Pages "developers integration" (très denses, beaucoup de hints)

| Page | Mots | Hints |
|---|---|---|
| `parallelizer-module-integration` | **2 025** | **6** (info + warning) |

Ces pages techniques mélangent prose + warnings sur les edge cases. Probable que les autres `*-module-integration` aient un profil similaire.

### Pages governance (denses sur tokenomics)

| Page | Mots | Images | Hints |
|---|---|---|---|
| `proposal-framework` | 635 | 3 | 3 (info × 3) |
| `tokenomics/staking-mechanisms` | 384 | 2 | 4 (info × 3, warning × 1) |
| `tokenomics/paraboost` | 229 | 2 | 1 |
| `tokenomics` (overview) | 113 | 1 | 0 |
| `parallel-governance-token-prl` | 194 | 0 | 2 |

### Pages courtes / navigationnelles

| Page | Mots | Images | Hints |
|---|---|---|---|
| `dao-multisigs-elections/election-1` | 85 | 0 | 0 |
| `parallel-v2` (overview) | 73 | 0 | 0 |
| `parallel-v3` (overview) | 100 | 1 | 0 |
| `bug-bounty-program` | 412 | 1 | 0 |
| `proof-of-solvency` | 165 | 1 | **1 tab** |

### Pages contracts addresses

| Page | Mots | Hints |
|---|---|---|
| `usdp/ethereum` | 121 | 0 |

Très courtes. Pures listes d'adresses à transformer en `<ContractTable>` ou en composant générique data-driven (voir section 5).

---

## 4. Comparaison Parallel vs les 3 autres

| Pattern | eUSD | Rocky | Monet | **Parallel** |
|---|---|---|---|---|
| Pages totales | 32 | 32 | 36 | **170** (5×) |
| Mots totaux estimés | ~14k | ~14k | ~16k | **~98k** (~6×) |
| Hints total estimés | 0 | ~5 | ~5 | **~170** (massif) |
| Tabs | 0 | 0 | 0 | **~10** |
| Sections spéciales | — | — | — | **Governance, v2/v3 split, 25 chaînes** |
| Versioning de doc | non | non | non | **v2 + v3** |
| Math | 0 | 0 | 0 | 0 (confirmé) |
| Niveau effort | 4 j | 3 j | 3 j | **10-12 j** |

---

## 5. Spécificités techniques de Parallel

### A. Versioning v2 / v3

Parallel a deux versions de docs **vivantes en parallèle** :
- **v2 (legacy)** : Classic Vaults, Super Vaults (SV), MIMO token, action contracts (mimoLeverage, mimoRebalance, etc.)
- **v3 (current)** : USDP/sUSDP, modules (Parallelizer, Savings, Flashloan, Bridging), PRL token

**Solution Vocs :** utiliser le sélecteur de version dans le top nav.

```ts
// vocs.config.ts
topNav: [
  { text: 'Guide & API', link: '/' },
  {
    text: 'v3',
    items: [
      { text: 'v3 (current)', link: '/products/parallel-v3' },
      { text: 'v2 (legacy)', link: '/products/parallel-v2' },
    ],
  },
],
```

Les pages v2 sont préfixées `/products/parallel-v2/...` et `/developers-hub/parallel-v2/...` (déjà comme ça dans GitBook).

### B. Section governance (à structurer)

Branche complète absente des 3 autres :

```
governance/
├── parallel-governance-token-prl/
│   ├── issuance
│   ├── tokenomics/
│   │   ├── epoch-concept
│   │   ├── staking-mechanisms
│   │   ├── paraboost
│   │   └── fee-distribution
│   ├── governance
│   ├── bridging-module/
│   │   ├── specifications
│   │   └── implementation
│   └── mimo-to-prl-migration
├── sprl
├── governance-process
├── proposal-framework/
│   ├── parallel-integration-request-pir
│   ├── parallel-governance-proposal-pgp
│   └── parallel-improvement-protocol-pip
├── dao-multisigs/
│   └── dao-multisigs-elections/
│       └── election-1 à election-8
└── dao-treasury/
    └── dao-treasury-reports
```

Sidebar profonde (jusqu'à 4 niveaux). À tester côté UX Vocs (le sidebar accepte le nesting mais peut devenir lourd visuellement au-delà de 3 niveaux).

### C. Contracts addresses : 25+ chaînes pour USDP

Au lieu de coder une page MDX par chaîne (déjà fait dans GitBook = ~25 pages quasi identiques avec juste les adresses qui changent), on peut **factoriser** :

**Option 1 — page générique data-driven** (recommandée) :

```mdx
// pages/developers-hub/contract-addresses/parallel-v3/usdp/[chain].mdx
import { ContractAddressesPage } from '@cooperlabs/docs-shared'
import { USDP_ADDRESSES } from '../../../../data/addresses'

<ContractAddressesPage
  stablecoin="USDP"
  chains={USDP_ADDRESSES}
/>
```

→ Une seule page, un fichier de data (`addresses.ts`), un composant qui gère la nav par chaîne. Réduit ~25 pages MDX à 1 page + 1 fichier data.

**Option 2 — garder une page par chaîne** : conforme à la structure GitBook actuelle, plus de pages MDX mais simple à éditer pour Cooper Labs. À choisir avec eux.

### D. Pages élections multisigs (8 pages très courtes)

Chaque `election-N.mdx` fait ~85 mots et liste les candidats / résultats. Pareil que les addresses : factorisable en 1 composant `<ElectionResults>` + 8 fichiers data, ou laissées en MDX brut. À voir avec Cooper Labs.

### E. Page `proof-of-solvency` avec un tab

Le seul tab détecté sur l'échantillon est sur cette page. C'est un GitBook `{% tabs %}{% tab %}...` qui groupe probablement les preuves par chaîne ou par stablecoin. **Le converter doit aussi gérer les tabs**, pas juste les hints.

```mdx
<!-- Vocs -->
import { Tabs, Tab } from '@cooperlabs/docs-shared'

<Tabs>
  <Tab label="USDP">…</Tab>
  <Tab label="PAR (legacy)">…</Tab>
</Tabs>
```

---

## 6. Plan de conversion Parallel (adapté)

### Étape A — Source
- Export ZIP Markdown du space GitBook Parallel.
- **Gel des éditions strict** sur ~10 jours, ou prévoir export "delta" final. À cadrer avec Cooper Labs.

### Étape B — Pipeline de conversion

Le script développé pour Rocky/Monet doit être **étendu** :

1. **Hints** : déjà géré (info, warning, danger, success).
2. **Tabs** : nouveau converter `{% tabs %}{% tab %}` → composant `<Tabs><Tab>`.
3. **Versioning** : routing par dossier `parallel-v2/` vs `parallel-v3/` (déjà fait dans GitBook), maintenir la séparation.
4. **Pages addresses** : extraire les adresses de chaque page en JSON, créer le data file `data/addresses.ts`, supprimer les ~25 pages individuelles, ajouter une route dynamique `[chain].mdx`.

### Étape C — Composants additionnels

À ajouter dans `_shared/` :

- **`<Tabs>` + `<Tab>`** — wrapper Vocs natif ou Radix UI.
- **`<ContractAddressesPage>`** — composant page complète qui prend un `stablecoin` + un mapping `{ chain: contracts[] }` et génère la nav + les `<ContractTable>` par chaîne.
- **`<ElectionResults>`** (optionnel) — si on factorise les 8 élections.
- **`<TokenomicsCard>`** (optionnel) — pour les blocs ParaBoost / Staking / Fee Distribution.

### Étape D — Sidebar Vocs (énorme, à externaliser)

Trop volumineuse pour copier ici. À générer en partie automatiquement depuis l'arbo MDX. Vocs supporte une sidebar dynamique mais elle gagne à être ordonnée manuellement pour un site de cette taille.

### Étape E — Top nav avec sélecteur de version

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
],
```

---

## 7. Estimation effort Parallel (révisée)

| Phase | Effort | Détail |
|---|---|---|
| Setup repo + Vocs base (template dérivé) | 0.5 j | Réutilisation acquise des 3 autres |
| Adaptation sidebar volumineuse | 1 j | 170 entrées à ordonner manuellement |
| Theming + top nav avec versioning | 0.5 j | |
| Extension converter (tabs + addresses factoring) | 1 j | |
| Composants additionnels (`Tabs`, `ContractAddressesPage`, etc.) | 1 j | |
| Import contenu via script | 0.5 j | Exécution rapide |
| Relecture + correction page par page | **3 j** | 170 pages à QA, le plus chronophage |
| Polish governance (proposals, elections) | 0.5 j | |
| Polish v2 legacy | 0.5 j | |
| Audit liens internes (linkinator) + fixes | 0.5 j | |
| Deploy Vercel + redirects 25+ chaînes + DNS | 0.5 j | |
| Buffer | 1 j | Toujours nécessaire sur un projet 5× |
| **Total** | **~10 j** | |

Si on veut être confortable plutôt que serré : **12 j**. À aligner avec Cooper Labs.

---

## 8. Action items immédiats

**Côté Cooper Labs :**
- [ ] Export ZIP Markdown du space GitBook Parallel
- [ ] Engagement gel des éditions sur **toute la durée** (10-12 j)
- [ ] Récupérer les brand assets Parallel (logo SVG, palette principale)
- [ ] Contact DNS pour `docs.parallel.best`
- [ ] Décision : **factoriser les 25 pages d'addresses ou les laisser une par chaîne ?**
- [ ] Décision : **garder ou cacher la doc v2 (legacy) ?** Si certaines features v2 sont totalement obsolètes, peut-être archiver discrètement.

**Côté Claude Code :**
- [ ] Étendre le script de conversion : ajout converter `{% tabs %}` (en plus des hints)
- [ ] Coder `<Tabs>` / `<Tab>` dans `_shared/`
- [ ] Coder `<ContractAddressesPage>` dans `_shared/`
- [ ] Init repo `cooperlabs/docs-parallel` après les 3 autres en prod
- [ ] Ajouter les 25+ chains dans `_shared/lib/chains.ts` (mapping name + explorer URL)

**Côté Cowork (ici) :**
- [x] Audit Parallel (ce doc)
- [ ] Aider à arbitrer factorisation addresses vs pages individuelles (je peux faire un comparatif visuel/UX)
- [ ] Quand Parallel en staging : critique visuelle + suggestion polish

---

## 9. Risques identifiés

| Risque | Sévérité | Mitigation |
|---|---|---|
| Plus de hints que les 17 sample (ratio non linéaire) | Moyen | Crawl complet juste avant conversion. Si > 250 hints, ajouter 1 j au planning |
| Pages dev integration ont du code (non vu sur sample) | Moyen | Sampler 2-3 pages dev avant le démarrage. Ajouter syntax highlighting si besoin |
| Sidebar 170 entrées peu lisible | Élevé | UX critique. Tester avec un utilisateur réel. Considérer une sidebar collapsée par défaut |
| Cooper Labs édite pendant les 10 j | **Élevé** | Sur un projet aussi long, le gel est dur à tenir. Prévoir un canal Slack dédié + export delta avant bascule |
| 25+ chaînes = 25+ redirects 301 spécifiques | Moyen | Script qui génère le `vercel.json` automatiquement à partir du sitemap GitBook |
| SEO ranking à risque sur les pages haute traffic | **Élevé** | Audit Search Console avec Cooper Labs avant bascule. Prévoir un go/no-go sur les redirects |
| Versioning v2/v3 mal expliqué = confusion lecteur | Moyen | Banner clair "you are reading v2 (legacy)" sur les pages v2 |

---

## 10. Recommandation stratégique

**Demande à Cooper Labs un budget de 12 jours pour Parallel** dans le planning, pas 10. Justification :
- 5× plus de pages que les 3 autres
- Versioning v2/v3 = effort sup
- Governance complexe
- 170 hints à valider visuellement
- Qualité finale critique (c'est le plus traffiqué des 4 sites)

Si Cooper Labs veut tenir 10 jours, négocie **soit** la suppression du v2 legacy (économie ~2 j), **soit** la factorisation auto des addresses (économie ~1 j), **soit** un buffer plus court avec acceptation de polish post-mise-en-prod.

**Verdict :** Parallel est faisable mais c'est un vrai projet. À traiter avec respect, pas comme une déclinaison.
