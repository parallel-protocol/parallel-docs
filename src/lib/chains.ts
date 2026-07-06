export type ChainSlug =
  | "ethereum"
  | "base"
  | "sonic"
  | "hyperevm"
  | "avalanche"
  | "polygon"
  | "arbitrum"
  | "optimism"
  | "sei"
  | "bsc"
  | "berachain"
  | "scroll"
  | "gnosis"
  | "unichain"
  | "ink"
  | "tac"
  | "linea"
  | "x-layer"
  | "plume"
  | "plasma"
  | "katana"
  | "fraxtal"
  | "world"
  | "hemi"
  | "fantom"; // PRL only, not USDp

export const CHAIN_LABELS: Record<ChainSlug, string> = {
  ethereum: "Ethereum",
  base: "Base",
  sonic: "Sonic",
  hyperevm: "HyperEVM",
  avalanche: "Avalanche",
  polygon: "Polygon",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  sei: "Sei",
  bsc: "BNB Chain",
  berachain: "Berachain",
  scroll: "Scroll",
  gnosis: "Gnosis",
  unichain: "Unichain",
  ink: "Ink",
  tac: "TAC",
  linea: "Linea",
  "x-layer": "X Layer",
  plume: "Plume",
  plasma: "Plasma",
  katana: "Katana",
  fraxtal: "Fraxtal",
  world: "World Chain",
  hemi: "Hemi",
  fantom: "Fantom",
};

export const EXPLORERS: Record<ChainSlug, (addr: string) => string> = {
  ethereum: (a) => `https://etherscan.io/address/${a}`,
  base: (a) => `https://basescan.org/address/${a}`,
  sonic: (a) => `https://sonicscan.org/address/${a}`,
  hyperevm: (a) => `https://hyperevmscan.io/address/${a}`,
  avalanche: (a) => `https://snowscan.xyz/address/${a}`,
  polygon: (a) => `https://polygonscan.com/address/${a}`,
  arbitrum: (a) => `https://arbiscan.io/address/${a}`,
  optimism: (a) => `https://optimistic.etherscan.io/address/${a}`,
  sei: (a) => `https://seitrace.com/address/${a}`,
  bsc: (a) => `https://bscscan.com/address/${a}`,
  // TODO: confirm berachain explorer with Cooper Labs
  berachain: (a) => `https://berascan.com/address/${a}`,
  scroll: (a) => `https://scrollscan.com/address/${a}`,
  gnosis: (a) => `https://gnosisscan.io/address/${a}`,
  unichain: (a) => `https://uniscan.xyz/address/${a}`,
  // TODO: confirm ink/tac/plume/plasma/katana/world/hemi explorers with Cooper Labs
  ink: (a) => `https://explorer.inkonchain.com/address/${a}`,
  tac: (a) => `https://explorer.tac.build/address/${a}`,
  linea: (a) => `https://lineascan.build/address/${a}`,
  "x-layer": (a) => `https://www.oklink.com/xlayer/address/${a}`,
  plume: (a) => `https://explorer.plume.org/address/${a}`,
  plasma: (a) => `https://plasmascan.to/address/${a}`,
  katana: (a) => `https://katanascan.com/address/${a}`,
  fraxtal: (a) => `https://fraxscan.com/address/${a}`,
  world: (a) => `https://worldscan.org/address/${a}`,
  hemi: (a) => `https://explorer.hemi.xyz/address/${a}`,
  fantom: (a) => `https://ftmscan.com/address/${a}`,
};
