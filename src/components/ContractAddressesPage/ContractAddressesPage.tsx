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
  /** Token name shown in the section aria-label (e.g. "USDP", "PRL"). */
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
        <ContractTable chain={selected as ChainSlug} contracts={contracts as Contract[]} />
      )}
    </div>
  );
}
