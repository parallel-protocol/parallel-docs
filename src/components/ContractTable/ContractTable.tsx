import { Check, Copy, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHAIN_LABELS, type ChainSlug, EXPLORERS } from "../../lib/chains";
import { truncateAddress } from "../../lib/utils";
import "./ContractTable.css";

/** A single smart-contract entry rendered by `<ContractTable>`. */
export interface Contract {
  /** Display name of the contract (e.g. `"Stabilizer"`, `"Treasury"`). */
  name: string;
  /** Checksummed contract address. */
  address: `0x${string}`;
  /** Optional long-form description, rendered inline below the contract name. */
  description?: string;
}

/** Props for `<ContractTable>`. */
export interface ContractTableProps {
  /** Chain on which the listed contracts are deployed; drives the explorer URL and table caption. */
  chain: ChainSlug;
  /** Contracts to display. An empty array renders the empty-state message. */
  contracts: Contract[];
  /** Visual density. `compact` reduces padding and font size. Defaults to `default`. */
  variant?: "default" | "compact";
}

/**
 * Responsive list of smart-contract addresses for a given chain.
 *
 * - Desktop (≥ 768 px): three-column table (Contract / Address / Actions) with an `sr-only` caption.
 * - Mobile (< 768 px): each row collapses into a stacked card via CSS only.
 * - Each row exposes a copy button and an explorer link.
 * - Contracts with a `description` render it inline beneath the contract name.
 */
export function ContractTable({ chain, contracts, variant = "default" }: ContractTableProps) {
  const rootClass = `cooper-ct-root cooper-ct-${variant}`;

  if (contracts.length === 0) {
    return (
      <div className={rootClass}>
        <p className="cooper-ct-empty">No contracts deployed on this chain yet.</p>
      </div>
    );
  }

  const chainLabel = CHAIN_LABELS[chain];
  const buildExplorerUrl = EXPLORERS[chain];

  return (
    <div className={rootClass}>
      <table className="cooper-ct-table">
        <caption className="cooper-sr-only">{chainLabel} contract addresses</caption>
        <thead className="cooper-ct-thead">
          <tr>
            <th scope="col" className="cooper-ct-th">
              Contract
            </th>
            <th scope="col" className="cooper-ct-th">
              Address
            </th>
            <th scope="col" className="cooper-ct-th cooper-ct-th-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <ContractRow
              key={`${contract.name}-${contract.address}`}
              contract={contract}
              chainLabel={chainLabel}
              explorerUrl={buildExplorerUrl(contract.address)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ContractRowProps {
  contract: Contract;
  chainLabel: string;
  explorerUrl: string;
}

function ContractRow({ contract, chainLabel, explorerUrl }: ContractRowProps) {
  const { name, address, description } = contract;

  return (
    <tr className="cooper-ct-row">
      <td className="cooper-ct-card-name">
        <span className="cooper-ct-name">{name}</span>
        {description ? <p className="cooper-ct-description">{description}</p> : null}
      </td>
      <td>
        <span className="cooper-ct-address">{truncateAddress(address)}</span>
      </td>
      <td className="cooper-ct-actions-cell">
        <span className="cooper-ct-actions">
          <CopyButton address={address} />
          <a
            className="cooper-ct-link"
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${name} on ${chainLabel} explorer`}
          >
            <ExternalLink size={14} aria-hidden="true" focusable="false" />
          </a>
        </span>
      </td>
    </tr>
  );
}

const COPIED_RESET_MS = 1500;

function CopyButton({ address }: { address: `0x${string}` }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, COPIED_RESET_MS);
    } catch {
      // Clipboard unavailable; leave UI unchanged.
    }
  }, [address]);

  return (
    <>
      <button
        type="button"
        className="cooper-ct-copy"
        data-copied={copied}
        onClick={handleCopy}
        aria-label={`Copy address ${address}`}
      >
        {copied ? (
          <Check size={14} aria-hidden="true" focusable="false" />
        ) : (
          <Copy size={14} aria-hidden="true" focusable="false" />
        )}
      </button>
      <span className="cooper-sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </>
  );
}

export default ContractTable;
