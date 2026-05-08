import type { Transformer, TransformContext } from "../types";

const MD_LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;
// GitBook utilise `broken://...` quand un lien interne pointe vers une page
// supprimée/déplacée. On retire complètement le lien (texte seul) pour ne pas
// laisser un anchor cliquable avec href invalide.
const BROKEN_LINK_PROTOCOL = "broken://";
// Matches both 40-char lowercase-hex hashes (some GitBook versions) and GitBook's
// standard 20-char alphanumeric page IDs (uppercase, digits, hyphens, underscores).
const PAGES_ALIAS_REGEX = /\/pages\/([a-zA-Z0-9_-]{16,})\b/g;
const GITBOOK_HOST = "https://docs.parallel.best";
const SITE_INDEX_URL = `${GITBOOK_HOST}/~gitbook/site-index`;
const aliasCache = new Map<string, string>();
let siteIndexPromise: Promise<Map<string, string>> | null = null;

/**
 * Mapping connu hash → URL Vocs résolue. Vérifié manuellement Phase 3.5
 * pour les aliases rencontrés sur chaque doc.
 *
 * Note : `/pages/[hash]` ne renvoie PAS de redirect HTTP côté GitBook
 * (vérifié 2026-05-06 : HEAD = 404). L'alias est résolu côté Next.js
 * server-side quand on rend la page complète. Le HEAD-redirect strategy
 * initialement prévue ne marche donc pas — on garde le fallback HEAD au
 * cas où certains docs aient un comportement différent, mais le map
 * KNOWN_ALIASES est la source primaire.
 *
 * Parallel aliases — découverts 2026-05-06.
 * Stratégie : grep des MDX convertis, fetch de chaque URL GitBook pour
 * récupérer la balise <link rel="canonical"> ou lire le contexte du lien
 * dans le MDX source pour identifier la cible. GitBook page IDs Parallel
 * sont de 20 chars alphanumériques (pas les 40-char hex de certains autres
 * setups GitBook). Re-découvrir après restructuration majeure des docs en
 * relançant le process Phase 3.5.
 */
const KNOWN_ALIASES: Record<string, string> = {
  // ── RESOLVED ─────────────────────────────────────────────────────────────
  // introduction/products.mdx — boutons "Discover USDp" et "Discover sUSDp"
  vmL3haFUBR6HbqbS6PLs: "/products/parallel-v3/stablecoins-and-savings/usdp-and-susdp",

  // ── UNRESOLVED — broken://pages/... dans la source GitBook ───────────────
  // Ces pages sont déjà marquées "broken" côté GitBook (lien supprimé/déplacé).
  // Les résoudre partiellement produirait "broken://chemin" — inutile.
  // Conservées ici pour documentation ; ne pas les activer sans vérification.
  //
  // "-Mdojpqd4z_Gn5a5Ule_" → "Bridging Module codebase" (v2)
  //   Probablement lien externe GitHub supprimé du site GitBook.
  //
  // "KIb6APPWXmb7qF2VmyL4" → "Origination/Borrowing Fee parameters" (v2 vaults)
  //   Page fee-parameters supprimée de GitBook.
  //
  // "Yce5DNOrL2FgcyQkFXtg" → "Providing Liquidity" (PAR / paUSD)
  //   Page liquidity supprimée de GitBook.
  //
  // "rQX6kqEYm5JRDmwD0mj2" → "paUSD Risk Parameters"
  //   Page supprimée de GitBook.
  //
  // "F7e5wIT0VrJeVABByKPh" → "how to mint PAR"
  //   Page supprimée de GitBook.
  //
  // "ysvT5XpJysnrX9sbkbVw" → "PAR Risk Parameters"
  //   Page supprimée de GitBook.
  //
  // "bFpWvJAK9hBZyk8qiM2o" → Super Vault SV "Contract Initialization"
  // "Td3ofX83Y1x4xrVPUMak" → Super Vault SV "User Interaction"
  // "HRi43d9greWduWodkfDW" → Super Vault SV "External Interactions"
  // "jDUZZwMlkW2rG482ScV2" → Super Vault SV "Methods"
  //   Ces 4 sous-pages SV n'apparaissent pas dans le sitemap GitBook — supprimées.
  //
  // "HEpJDmdHCKHqmJ8ffPQ5" → "DAO Multisig" (governance/dao-treasury)
  //   Cible existe : /governance/dao-multisigs — mais source broken://pages/...
  //   Résolution partielle produirait "broken://governance/dao-multisigs".
};

export function __clearAliasCache(): void {
  aliasCache.clear();
  siteIndexPromise = null;
}

/**
 * Build a `lowercased pageId → pathname` lookup from GitBook's site-index
 * endpoint. GitBook resolves `/pages/<id>` URLs at HTML render time using this
 * same data — the markdown source still contains the raw `/pages/<id>`
 * reference, so we replicate that resolution at convert time.
 *
 * Avoids hand-maintaining KNOWN_ALIASES for every doc migration : on Monet
 * the site-index resolved 100% of `/pages/<id>` references that the HEAD
 * redirect couldn't.
 */
async function loadSiteIndex(): Promise<Map<string, string>> {
  if (!siteIndexPromise) {
    siteIndexPromise = (async () => {
      const map = new Map<string, string>();
      try {
        const res = await fetch(SITE_INDEX_URL);
        if (!res.ok) return map;
        const data = (await res.json()) as { pages?: Array<{ id?: string; pathname?: string }> };
        for (const p of data.pages ?? []) {
          if (typeof p.id === "string" && typeof p.pathname === "string") {
            map.set(p.id.toLowerCase(), p.pathname);
          }
        }
      } catch {
        // Network or JSON failure — fall back to HEAD redirect resolution.
      }
      return map;
    })();
  }
  return siteIndexPromise;
}

async function resolvePagesAlias(hash: string): Promise<string | null> {
  if (aliasCache.has(hash)) return aliasCache.get(hash) ?? null;

  // Priority 1 : mapping manuel — exceptions (page archivée/draft absente du
  // site-index) ou overrides où la résolution canonique GitBook pointe vers
  // une URL différente de celle qu'on veut servir.
  if (hash in KNOWN_ALIASES) {
    const path = KNOWN_ALIASES[hash];
    aliasCache.set(hash, path);
    return path;
  }

  // Priority 2 : `/~gitbook/site-index` — résolution canonique GitBook,
  // même JSON que celui consommé par le runtime côté navigateur.
  const siteIndex = await loadSiteIndex();
  const fromIndex = siteIndex.get(hash.toLowerCase());
  if (fromIndex) {
    aliasCache.set(hash, fromIndex);
    return fromIndex;
  }

  // Priority 3 : fallback HEAD redirect (peut marcher sur certains setups
  // GitBook où l'alias est résolu côté serveur — pas le cas sur Parallel/Monet).
  try {
    const res = await fetch(`${GITBOOK_HOST}/pages/${hash}`, {
      method: "HEAD",
      redirect: "manual",
    });
    const location = res.headers.get("location");
    if (!location) return null;
    const pathname = new URL(location, GITBOOK_HOST).pathname;
    aliasCache.set(hash, pathname);
    return pathname;
  } catch {
    return null;
  }
}

function transformLink(linkUrl: string, sourcePageUrl: string): string {
  if (linkUrl.startsWith(BROKEN_LINK_PROTOCOL)) return linkUrl;
  if (linkUrl.startsWith("/files/")) return linkUrl;
  if (/^(mailto:|tel:|#)/i.test(linkUrl)) return linkUrl;

  // Absolute URLs to GitBook host : strip and process IF the path ends in
  // `.md` (canonical GitBook markdown link). Other absolute URLs — including
  // same-host non-`.md` paths (in-narrative legacy page-id refs that lack a
  // Vocs equivalent) — stay intact so we don't surface broken routes to
  // Vocs's deadlink check.
  if (/^https?:\/\//i.test(linkUrl)) {
    if (!linkUrl.startsWith(GITBOOK_HOST)) return linkUrl;
    const stripped = linkUrl.slice(GITBOOK_HOST.length) || "/";
    const pathBare = stripped.split("#")[0].split("?")[0];
    if (!pathBare.endsWith(".md")) return linkUrl;
    linkUrl = stripped;
  }

  const hashIdx = linkUrl.indexOf("#");
  const pathPart = hashIdx === -1 ? linkUrl : linkUrl.slice(0, hashIdx);
  const anchor = hashIdx === -1 ? "" : linkUrl.slice(hashIdx);

  if (!pathPart.endsWith(".md")) return linkUrl;

  const stripped = pathPart.slice(0, -3);
  let resolved: string;
  if (stripped.startsWith("/")) {
    resolved = stripped;
  } else {
    const base = new URL(sourcePageUrl);
    resolved = new URL(stripped, base).pathname;
  }
  return resolved + anchor;
}

export const internalLinks: Transformer = {
  name: "internalLinks",
  apply: async (source: string, ctx: TransformContext) => {
    const aliasMatches = Array.from(source.matchAll(PAGES_ALIAS_REGEX), (m) => m[1]);
    const resolved = new Map<string, string>();
    await Promise.all(
      Array.from(new Set(aliasMatches)).map(async (hash) => {
        const path = await resolvePagesAlias(hash);
        if (path) resolved.set(hash, path);
      }),
    );
    let out = source.replace(PAGES_ALIAS_REGEX, (full, hash: string) =>
      resolved.get(hash) ?? full,
    );

    out = out.replace(MD_LINK_REGEX, (_match, text: string, url: string) => {
      // broken:// → drop the link, keep just the label text. Better than
      // leaving a ghost anchor with an invalid href that errors on click.
      if (url.startsWith(BROKEN_LINK_PROTOCOL)) return text;
      return `[${text}](${transformLink(url, ctx.url)})`;
    });

    return out;
  },
};
