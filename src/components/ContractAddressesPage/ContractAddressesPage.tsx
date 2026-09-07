import { type Contract, ContractTable, IconSprite } from "@/components/ContractTable";
import { CHAIN_LABELS, type ChainSlug } from "@/lib/chains";
import { ChainDeepLink } from "./ChainDeepLink";
import "./ContractAddressesPage.css";

export type ContractEntry = {
  name: string;
  /** Checksummed contract address (0x-prefixed). */
  address: string;
  description?: string;
};

export interface ContractAddressesPageProps {
  /** Token name shown in the section aria-label (e.g. "USDp", "PRL"). */
  stablecoin: string;
  /** Map of chain slug → contracts deployed on that chain. */
  chains: Record<string, ContractEntry[]>;
}

function getChainLabel(slug: string): string {
  return (CHAIN_LABELS as Record<string, string>)[slug] ?? slug;
}

/** Anchor id for a chain's section. Prefixed to avoid colliding with MDX heading ids. */
export function chainAnchorId(slug: string): string {
  return `chain-${slug}`;
}

interface ModuleGroup {
  module: string | null;
  contracts: ContractEntry[];
}

/** Groups contracts by module (the `description` field), preserving first-appearance order. */
function groupByModule(contracts: ContractEntry[]): ModuleGroup[] {
  const groups: ModuleGroup[] = [];
  const byModule = new Map<string | null, ModuleGroup>();
  for (const contract of contracts) {
    const module = contract.description ?? null;
    let group = byModule.get(module);
    if (!group) {
      group = { module, contracts: [] };
      byModule.set(module, group);
      groups.push(group);
    }
    group.contracts.push(contract);
  }
  return groups;
}

/**
 * Contract addresses for one token, across every chain it is deployed on.
 *
 * Renders entirely on the server. It previously held the selected chain in
 * client state and rendered only that one chain, which meant the prerendered
 * HTML carried a single chain's addresses and the other two dozen existed only
 * after hydration — invisible to search engines and to anything reading the
 * page without running JavaScript. "What is the USDp contract on Base" is
 * exactly what these pages are asked, so every address now ships in the HTML.
 *
 * The chain picker is therefore a list of same-page anchors rather than
 * buttons: no JavaScript, and each chain gets a linkable `#chain-<slug>` URL.
 */
export function ContractAddressesPage({ stablecoin, chains }: ContractAddressesPageProps) {
  const slugs = Object.keys(chains);

  return (
    <div className="cooper-contract-addresses-page" aria-label={`${stablecoin} Contracts`}>
      {/* Defines the copy / check / external-link geometry once for every table below. */}
      <IconSprite />

      <ChainDeepLink chains={slugs} />

      <nav className="cooper-contract-addresses-chain-picker" aria-label="Jump to chain">
        {slugs.map((slug) => (
          <a
            key={slug}
            className="cooper-contract-addresses-chain-button"
            href={`#${chainAnchorId(slug)}`}
          >
            {getChainLabel(slug)}
          </a>
        ))}
      </nav>

      {slugs.map((slug) => {
        const contracts = chains[slug] ?? [];
        const headingId = `${chainAnchorId(slug)}-heading`;
        return (
          <section
            key={slug}
            id={chainAnchorId(slug)}
            className="cooper-contract-addresses-chain"
            aria-labelledby={headingId}
          >
            <h2 id={headingId} className="cooper-contract-addresses-chain-title">
              {getChainLabel(slug)}
            </h2>

            {contracts.length === 0 ? (
              <p className="cooper-contract-addresses-empty">
                No contracts deployed yet on {getChainLabel(slug)}.
              </p>
            ) : (
              groupByModule(contracts).map((group) => (
                <section
                  key={group.module ?? "ungrouped"}
                  className="cooper-contract-addresses-module"
                  aria-label={group.module ?? undefined}
                >
                  {group.module ? (
                    <h3 className="cooper-contract-addresses-module-title">{group.module}</h3>
                  ) : null}
                  <ContractTable
                    chain={slug as ChainSlug}
                    contracts={
                      // The module name is now the section heading — drop it from
                      // the rows so it isn't repeated under every contract name.
                      group.contracts.map(({ name, address }) => ({ name, address })) as Contract[]
                    }
                  />
                </section>
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
