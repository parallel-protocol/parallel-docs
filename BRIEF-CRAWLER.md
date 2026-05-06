# Brief Claude Code — Migration Parallel (le gros)

> À donner à Claude Code dans `repos/docs-parallel/` **après** que docs-eusd soit en prod (ou au moins en staging validé visuellement). Hérite des leçons apprises sur eUSD.

## Contexte

**Parallel** est le 4e (et plus gros) site Cooper Labs à migrer. Spécificités vs eUSD :
- ~170 pages (vs 32 pour eUSD)
- Versioning v2 (legacy PAR/paUSD/MIMO) + v3 (current USDP/sUSDP/PRL)
- Governance complète (DAO multisigs, treasury, proposal framework, 8 élections)
- 25+ chaînes addresses pour USDP, ~7 chaînes pour PRL
- ~170 hints `{% hint %}` (info ~130, warning ~40)
- ~10 tabs `{% tabs %}`
- Embeds `{% embed url="..." %}` (gov forum, vote)

**Prio business** : Parallel est la priorité absolue côté Cooper Labs.

## Orchestration via Dorothy (MCP)

Comme pour eUSD, utilise les agents Dorothy pour paralléliser le travail :
- Phase 1 (scaffold) : 3 agents parallèles
- Phase 2 (crawler) : 5+ agents parallèles (un par transformer NEW + ports des existants)
- Phase 3 (exécution) : séquentiel
- Fallback Task tool si Dorothy indispo.

## Architecture : héritage eUSD + extensions Parallel

Tu **portes** le crawler de docs-eusd (déjà battle-tested) et tu **ajoutes** les transformers Parallel-spécifiques. Pas de code from scratch.

### Ce qui se copie tel quel depuis `../docs-eusd/scripts/crawler/`

```
scripts/crawler/
├── pipeline.ts                       # runner de la chaîne
├── sitemap.ts                        # parse sitemap-pages.xml + hasChildren
├── types.ts                          # TransformContext, Transformer
└── transformers/
    ├── stripFooter.ts                # strippe le footer Agent Instructions
    ├── frontmatter.ts                # H1 → title, 1er para → description
    ├── internalLinks.ts              # .md → routes Vocs
    ├── images.ts                     # fetch HTML + match par ordre (cf. leçons eUSD)
    ├── hashtagHeadings.ts            # nettoie pictos en début H2
    ├── hints.ts                      # STUB côté eUSD — à activer (cf. ci-dessous)
    └── tabs.ts                       # STUB côté eUSD — à activer (cf. ci-dessous)
```

Plus :
- `scripts/crawl-and-convert.ts` (CLI)
- `tests/fixtures/*.md` + tests vitest

### Transformers à ACTIVER (étaient stubs dans eUSD)

#### 1. `hints.ts` — Convertir `{% hint %}` GitBook → directive Vocs `:::`

Pattern source (GitBook) :
```
{% hint style="info" %}
content paragraph 1

content paragraph 2
{% endhint %}
```

Pattern cible (Vocs) :
```
:::info
content paragraph 1

content paragraph 2
:::
```

Mapping styles :
- `info` → `:::info`
- `warning` → `:::warning`
- `danger` → `:::danger`
- `success` → `:::tip` (Vocs n'a pas `success`, on map sur tip)

Implémentation (sketch) :
```ts
export const hintsTransformer: Transformer = {
  name: 'hints',
  apply: (source) => {
    const styleMap = { info: 'info', warning: 'warning', danger: 'danger', success: 'tip' };
    return source.replace(
      /\{%\s*hint\s+style="(\w+)"\s*%\}([\s\S]*?)\{%\s*endhint\s*%\}/g,
      (_, style, content) => {
        const directive = styleMap[style] ?? 'info';
        return `:::${directive}\n${content.trim()}\n:::`;
      }
    );
  }
};
```

Tests à écrire :
- 4 fixtures : 1 hint info, 1 warning, 1 danger, 1 success
- Edge cases : hint imbriqué (peu probable, log warn si trouvé), hint multi-paragraphe, hint avec markdown inline

#### 2. `tabs.ts` — Convertir `{% tabs %}{% tab %}` → composant `<Tabs>`

Pattern source :
```
{% tabs %}
{% tab title="USDP" %}
content for USDP
{% endtab %}
{% tab title="PAR (legacy)" %}
content for PAR
{% endtab %}
{% endtabs %}
```

Pattern cible :
```mdx
<Tabs>
  <Tab label="USDP">
    content for USDP
  </Tab>
  <Tab label="PAR (legacy)">
    content for PAR
  </Tab>
</Tabs>
```

Implémentation (sketch) :
```ts
export const tabsTransformer: Transformer = {
  name: 'tabs',
  apply: (source) => {
    return source.replace(
      /\{%\s*tabs\s*%\}([\s\S]*?)\{%\s*endtabs\s*%\}/g,
      (_, inner) => {
        const tabs = [...inner.matchAll(/\{%\s*tab\s+title="([^"]+)"\s*%\}([\s\S]*?)\{%\s*endtab\s*%\}/g)];
        const tabsJsx = tabs.map(([, title, content]) =>
          `  <Tab label=${JSON.stringify(title)}>\n${content.trim()}\n  </Tab>`
        ).join('\n');
        return `<Tabs>\n${tabsJsx}\n</Tabs>`;
      }
    );
  }
};
```

⚠️ **Le composant `<Tabs>` doit exister dans `src/components/Tabs/`** (à coder en Phase 1, voir ci-dessous).

#### 3. `embeds.ts` (NEW, pas dans eUSD) — Convertir `{% embed %}` → lien standard

Pattern source :
```
{% embed url="https://gov.parallel.best/" %}
Governance Forum
{% endembed %}
```

Pattern cible (markdown) :
```markdown
[Governance Forum](https://gov.parallel.best/)
```

Pour la première itération, on simplifie en lien markdown classique. Si Cooper Labs veut une preview riche (carte avec image og), on créera un composant `<Embed>` plus tard.

Implémentation :
```ts
export const embedsTransformer: Transformer = {
  name: 'embeds',
  apply: (source) =>
    source.replace(
      /\{%\s*embed\s+url="([^"]+)"\s*%\}\s*([^\n]*?)\s*\{%\s*endembed\s*%\}/g,
      (_, url, label) => `[${label.trim() || url}](${url})`
    )
};
```

#### 4. `contractAddressesFactorizer.ts` (NEW, optionnel selon décision Cooper Labs)

**Objectif** : transformer les ~25 pages chain individuelles en 1 route dynamique + 1 data file.

Source GitBook actuelle :
```
contract-addresses/parallel-v3/usdp/ethereum.md
contract-addresses/parallel-v3/usdp/base.md
contract-addresses/parallel-v3/usdp/sonic.md
... (×22 autres)
```

Cible (factorisée) :
```
docs/pages/developers-hub/contract-addresses/parallel-v3/usdp/[chain].mdx  (1 page)
data/usdp-addresses.ts                                                     (data structuré)
```

Le composant `<ContractAddressesPage>` (à coder en Phase 1) consomme le data + génère la nav par chaîne.

Implémentation : ce transformer ne s'applique pas à une page individuelle, mais en post-traitement après le crawl complet :
1. Détecte les pages sous `developers-hub/contract-addresses/.../[chain].md`
2. Pour chaque page, extrait les adresses (parsing markdown : tables ou listes)
3. Aggrège dans `data/usdp-addresses.ts` et `data/prl-addresses.ts`
4. Supprime les pages individuelles, crée la route `[chain].mdx` consommant le composant

⚠️ **À activer SEULEMENT si décision Cooper Labs = factoriser**. Sinon les pages restent une par chaîne (plus simple, plus de pages mais pas de logique custom). Tu me demandes la décision avant d'implémenter.

## Pipeline ordre (mis à jour pour Parallel)

```
markdown source 
  → stripFooter 
  → hashtagHeadings 
  → internalLinks 
  → hints (ACTIF, plus stub)
  → tabs (ACTIF, plus stub)
  → embeds (NEW, ACTIF)
  → images (async, port eUSD, fetch HTML + match par ordre)
  → frontmatter
→ MDX final
```

Post-pipeline (one-shot avant écriture) :
- `contractAddressesFactorizer` (si décision factoriser) : remplace les pages chain individuelles par data file + route dynamique

## Phase 1 — Scaffold + composants Parallel-spécifiques

### Étape 1.1 — Init Vocs

```bash
pnpm create vocs@latest .
```

### Étape 1.2 — Copy composants depuis le template

```bash
cp -r ../docs-shared/src/components ./src/
cp -r ../docs-shared/src/lib ./src/
cp ../docs-shared/src/tokens.css ./src/
cp -r ../docs-shared/src/test ./src/
```

Setup TS path alias `@/*` dans `tsconfig.json`.

### Étape 1.3 — Composants NEW Parallel-spécifiques

Crée dans `src/components/` :

#### `<Tabs>` + `<Tab>`

Wrapper accessible. Soit Radix UI Tabs (peer dep `@radix-ui/react-tabs`), soit composant maison avec `role="tablist"`. Recommandation : Radix pour la11y gratuite (clavier, ARIA).

API :
```tsx
<Tabs defaultValue="USDP">
  <Tab label="USDP">content</Tab>
  <Tab label="PAR (legacy)">content</Tab>
</Tabs>
```

CSS scoped `cooper-tabs-*`.

#### `<ContractAddressesPage>`

API :
```tsx
<ContractAddressesPage
  stablecoin="USDP"
  chains={USDP_ADDRESSES}  // imported from @/data/usdp-addresses
/>
```

Comportement :
- Affiche un picker de chaîne (peut être une dropdown ou des tabs en haut)
- Selon la chaîne sélectionnée, affiche le `<ContractTable>` correspondant
- État synchro avec le query param `?chain=ethereum` pour deep-linking
- Si `[chain]` dynamic route, lit le param de l'URL pour afficher la bonne chaîne par défaut

À implémenter en local dans Parallel (pas dans docs-shared, chaque repo indépendant).

### Étape 1.4 — Configure `vocs.config.ts`

- **Sidebar massive** (~170 entrées) — voir `AUDIT.md` section 5. Sections legacy (`parallel-v2/`, `dao-multisigs-elections/`) `collapsed: true` par défaut.
- **Top nav avec sélecteur de version v2/v3** :
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
- **Theme placeholder** (palette Parallel à finaliser quand brand reçue, j'ai déjà PNG du logo dans `../_brand-assets/Parallel/`)
- **Search natif Vocs**
- **Importe styles.css + tokens.css**

### Étape 1.5 — Banner "v2 (legacy)" sur les pages legacy

Crée un composant `<LegacyBanner>` ou un partial MDX qui injecte un `:::warning` en haut de toutes les pages sous `/products/parallel-v2/` et `/developers-hub/parallel-v2/` :

```mdx
:::warning
You're reading the legacy v2 documentation. For current Parallel features, see [v3](/products/parallel-v3).
:::
```

Tu peux soit :
- Ajouter manuellement le banner via le crawler (transformer post-pipeline pour les chemins v2)
- Ou via un layout MDX Vocs si la fonctionnalité existe (à vérifier dans la doc Vocs)

### Étape 1.6 — Pages MDX placeholder

Crée 5 pages stub MDX pour valider l'intégration :
- `index.mdx`
- `products/parallel-v3/index.mdx`
- `products/parallel-v2/index.mdx` (avec banner legacy)
- `governance/parallel-governance-token-prl/index.mdx`
- `developers-hub/contract-addresses/parallel-v3/usdp/[chain].mdx` (avec `<ContractAddressesPage>` consommant 2-3 chaînes factices)

### Étape 1.7 — Validation

`pnpm dev` sans erreur, sidebar 170 entrées rendue (collapse-OK), banner legacy visible sur pages v2, sélecteur v2/v3 dans top nav fonctionne.

## Phase 2 — Port crawler eUSD + activer transformers Parallel

### Étape 2.1 — Copy crawler depuis docs-eusd

```bash
cp -r ../docs-eusd/scripts ./scripts
cp -r ../docs-eusd/tests ./tests
```

Adapte les chemins / configs si nécessaire dans `scripts/crawl-and-convert.ts` (ex. URL sitemap : `https://docs.parallel.best/sitemap-pages.xml`).

### Étape 2.2 — Activer hints + tabs + embeds

Remplace les stubs `hints.ts` et `tabs.ts` par les implémentations ci-dessus. Crée `embeds.ts` NEW.

Tests vitest pour chacun (fixtures par variante).

### Étape 2.3 — Wiring pipeline

Update `pipeline.ts` ou `crawl-and-convert.ts` pour activer les nouveaux transformers dans l'ordre acté ci-dessus.

### Étape 2.4 — `contractAddressesFactorizer` (conditionnel)

À implémenter SI Cooper Labs valide la factorisation. Sinon skip.

## Phase 3 — Exécution + import contenu

1. `pnpm crawl https://docs.parallel.best/sitemap-pages.xml`
2. `pnpm convert`
3. Vérifier que `docs/pages/` contient ~170 fichiers MDX
4. `pnpm dev` + revue visuelle (avec orchestrator Dorothy + agent-browser pour screenshot matrix)
5. Fixes des bugs visuels
6. Ajustement sidebar si pages découvertes manquent
7. Brand intégré (logo + OG + couleurs depuis `../_brand-assets/Parallel/`)
8. Génération `vercel.json` avec redirects 301 (170+ entrées)
9. Audit Search Console avec Cooper Labs avant bascule (Parallel = le plus traffiqué)
10. Bascule DNS `docs.parallel.best` quand Cooper Labs valide

## Décisions à valider AVEC le user (avant Phase 2 idéalement)

1. **Factoriser les 25 pages d'addresses USDP en data + route dynamique ?**
   - Pour : économie ~1 j, plus maintenable
   - Contre : déstructure l'arbo source GitBook, plus complexe à éditer pour Cooper Labs post-migration
   - Reco : oui factoriser

2. **Garder ou archiver la doc v2 (legacy PAR/paUSD/MIMO) ?**
   - Garder : banner "legacy" + 100 % du contenu v2 importé. Économie ~0 j vs travail sup.
   - Archiver : skip toutes les pages sous `parallel-v2/`. Économie ~2 j.
   - Reco : à demander à Cooper Labs. Par défaut on garde, ils peuvent retirer après si voulu.

3. **`<Tabs>` : Radix UI ou maison ?**
   - Radix : a11y gratuite (clavier, ARIA), 1 dep sup
   - Maison : 0 dep, mais a11y à coder (~30 min)
   - Reco : Radix

## Leçons héritées d'eUSD à intégrer dès le départ

1. **Image fetching via HTML** : les `/files/[hash]` du markdown source ne sont pas fetchables direct. Le transformer `images.ts` d'eUSD fetch le HTML rendu de chaque page, parse les `<img data-testid="zoom-image">` et match par ordre les hashes markdown ↔ URLs CDN signées. Stratégie validée sur 32 pages eUSD, à réutiliser tel quel.

2. **`gitbookMdUrlFor` empirique** : pour la root, l'URL `.md` peut être `/index.md` ou `/`. À tester avant le crawl complet sur Parallel (`curl https://docs.parallel.best/index.md`).

3. **Validation Content-Type** : check que le fetch d'image retourne bien `image/*` et pas `text/html` (404 silencieux).

4. **Sanity check post-conversion** : script qui vérifie que toutes les images référencées dans les MDX existent bien sur disque. Critique vu le volume Parallel (~210 images).

5. **`hasChildren` strict avec `/` suffix** : pas de prefix matching, sinon faux-positifs.

6. **Pipeline ordre** : frontmatter en dernier, images après internalLinks, hashtagHeadings avant frontmatter. Validé sur eUSD.

7. **Logo / couleurs déjà dans `_brand-assets/Parallel/`** : logo PNG (20 KB) + og PNG (118 KB). Pas de SVG vectoriel pour Parallel (proxy GitBook a converti). À utiliser tel quel pour le scaffold, on peut demander un SVG plus tard si Cooper Labs en a un.

8. **Quirk Dorothy** : `delegate_task` retourne "completed" même quand l'agent n'a rien produit. Workaround : croiser avec vérif filesystem. Lesson notée dans le repo eUSD `tasks/lessons.md`.

## Estimation effort Parallel

| Phase | Effort | Note |
|---|---|---|
| Phase 1 — scaffold + composants Tabs/ContractAddressesPage | 2 j | Plus long que eUSD à cause des 2 nouveaux composants |
| Phase 2 — port crawler + activer hints/tabs/embeds | 1.5 j | Le port est rapide, les nouveaux transformers ~30 min chacun |
| Phase 2.5 — factorisation addresses (si validée) | 1 j | Optionnel |
| Phase 3 — exécution + import 170 pages | 1 j | Crawl + convert rapides, le travail c'est la revue visuelle |
| Polish + relecture page par page | 3 j | Le plus chronophage, ~170 pages à QA |
| Banner legacy v2 | 0.5 j | |
| Audit liens internes (linkinator) | 0.5 j | |
| Génération redirects 301 (170+ entrées) | 0.5 j | |
| Audit SEO + bascule DNS | 1 j | |
| Buffer | 1 j | |
| **TOTAL** | **~10-12 j** | |

## Avant de coder, dis-moi :

- Tu as les réponses Cooper Labs sur les 2 décisions (factorisation addresses + v2 legacy) ?
- Le crawler d'eUSD est bien stable / en prod ? (sinon attendre)
- Dorothy bien accessible côté MCP ? Sinon Task tool natif.
- Tu veux que j'ajoute autre chose avant que je démarre Phase 1 ?
