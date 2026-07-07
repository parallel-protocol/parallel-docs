"use client";

import { useState } from "react";
import { ContractTable, type Contract } from "@/components/ContractTable";
import { CHAIN_LABELS, type ChainSlug } from "@/lib/chains";
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

function getInitialChain(chains: Record<string, ContractEntry[]>): string {
  if (typeof window === "undefined") return Object.keys(chains)[0] ?? "";
  const fromUrl = new URLSearchParams(window.location.search).get("chain");
  if (fromUrl && fromUrl in chains) return fromUrl;
  return Object.keys(chains)[0] ?? "";
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

export function ContractAddressesPage({ stablecoin, chains }: ContractAddressesPageProps) {
  const [selected, setSelected] = useState<string>(() => getInitialChain(chains));

  function selectChain(slug: string) {
    setSelected(slug);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `?chain=${slug}`);
    }
  }

  const contracts = selected ? (chains[selected] ?? []) : [];

  return (
    <div className="cooper-contract-addresses-page" aria-label={`${stablecoin} Contracts`}>
      <div
        className="cooper-contract-addresses-chain-picker"
        role="group"
        aria-label="Select chain"
      >
        {Object.keys(chains).map((slug) => (
          <button
            key={slug}
            type="button"
            className="cooper-contract-addresses-chain-button"
            data-active={slug === selected}
            aria-pressed={slug === selected}
            onClick={() => selectChain(slug)}
          >
            {getChainLabel(slug)}
          </button>
        ))}
      </div>

      {contracts.length === 0 ? (
        <p className="cooper-contract-addresses-empty">
          No contracts deployed yet on {getChainLabel(selected) || "this chain"}.
        </p>
      ) : (
        groupByModule(contracts).map((group) => (
          <section
            key={group.module ?? "ungrouped"}
            className="cooper-contract-addresses-module"
            aria-label={group.module ?? undefined}
          >
            {group.module ? (
              <h2 className="cooper-contract-addresses-module-title">{group.module}</h2>
            ) : null}
            <ContractTable
              chain={selected as ChainSlug}
              contracts={
                // The module name is now the section heading — drop it from
                // the rows so it isn't repeated under every contract name.
                group.contracts.map(({ name, address }) => ({ name, address })) as Contract[]
              }
            />
          </section>
        ))
      )}
    </div>
  );
}
