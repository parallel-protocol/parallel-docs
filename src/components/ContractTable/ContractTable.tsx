import { CHAIN_LABELS, type ChainSlug, EXPLORERS } from "../../lib/chains";
import { truncateAddress } from "../../lib/utils";
import { CopyButton } from "./CopyButton";
import { Icon } from "./IconSprite";
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
  /**
   * Optional network qualifier. `testnet` renders a `TESTNET` badge in the
   * `Contract` column header. `mainnet` (or omitted) renders no badge.
   * The badge is purely visual reinforcement; the chain label already conveys
   * mainnet vs testnet to assistive tech via the table caption.
   */
  network?: "mainnet" | "testnet";
}

/**
 * Responsive list of smart-contract addresses for a given chain.
 *
 * - Desktop (≥ 768 px): three-column table (Contract / Address / Actions) with an `sr-only` caption.
 * - Mobile (< 768 px): each row collapses into a stacked card via CSS only.
 * - Each row exposes a copy button and an explorer link.
 * - Contracts with a `description` render it inline beneath the contract name.
 */
export function ContractTable({
  chain,
  contracts,
  variant = "default",
  network,
}: ContractTableProps) {
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
              {network === "testnet" ? (
                <span className="cooper-ct-network-badge" aria-hidden="true">
                  TESTNET
                </span>
              ) : null}
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
            <Icon name="external-link" size={14} />
          </a>
        </span>
      </td>
    </tr>
  );
}

export default ContractTable;
