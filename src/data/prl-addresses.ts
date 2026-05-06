import type { ContractEntry } from '@/components/ContractAddressesPage';

export const PRL_ADDRESSES: Record<string, ContractEntry[]> = {
  "arbitrum": [
    { name: "ParallelAccessManager", address: "0x0e4e7Ca9D7b1e6293D0713EFEfB4BCA010DeBF46", description: "Core Protocol" },
    { name: "PeripheralPRL", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Parallel Governance Token l PRL Bridging Module" },
  ],
  "base": [
    { name: "ParallelAccessManager", address: "0x0e4e7Ca9D7b1e6293D0713EFEfB4BCA010DeBF46", description: "Core Protocol" },
    { name: "PeripheralPRL", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Parallel Governance Token l PRL Bridging Module" },
    { name: "sPRL1", address: "0x01fA35fDE0E813e2D6687660a74A313d8D922E48", description: "PRL Tokenomics" },
  ],
  "ethereum": [
    { name: "ParallelAccessManager", address: "0x94Ea8800444017695345156319e96bdB1E355F7a", description: "Core Protocol" },
    { name: "PRL", address: "0x6c0aeceeDc55c9d55d8B99216a670D85330941c3", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
    { name: "LockBox", address: "0xdE91eb8206c228f4208c34510cf0C61C9302a434", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
    { name: "PrincipalMigrationContract", address: "0x0EC5ab257aDf6968A3D3C187BE1Ee0fe74487Eb3", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
    { name: "sPRL1", address: "0xeAd729472f82E5eC2FF4e691d67633077C1B5901", description: "PRL Tokenomics" },
    { name: "sPRL2", address: "0xE8A2d848fE656E34A6caA35f375B42979e322135", description: "PRL Tokenomics" },
    { name: "SideChainFeeDistributor", address: "0x2A4ABC8dcBE2f68E48dFc0db5784C71dB8d5B89c", description: "PRL Tokenomics" },
  ],
  "fantom": [
    { name: "ParallelAccessManager", address: "0x1FF33CF1607Ca109F23A3Fb9Ec5193037eB26306", description: "Core Protocol" },
    { name: "PeripheralMigrationContract", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
  ],
  "optimism": [
    { name: "ParallelAccessManager", address: "0x0e4e7Ca9D7b1e6293D0713EFEfB4BCA010DeBF46", description: "Core Protocol" },
    { name: "PeripheralPRL", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Parallel Governance Token l PRL Bridging Module" },
  ],
  "polygon": [
    { name: "ParallelAccessManager", address: "0x7Df74BBB6F82eC1BCB1562a30ef5Bf5c326e2811", description: "Core Protocol" },
    { name: "PRL", address: "0x7790dd69aa10eD3f1271E41CD7222D2a7d2D5948", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
    { name: "PeripheralMigrationContract", address: "0x9C68850E18EACD4ea7ca2998b6BBeD9cf55316cb", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
    { name: "sPRL1", address: "0xDB7Be3a50bdf5641757EBEa38e8014E1F0AA9475", description: "PRL Tokenomics" },
    { name: "MainfeeDistributor", address: "0x90337e484B1Cb02132fc150d3Afa262147348545", description: "PRL Tokenomics" },
    { name: "RewardMerkleDistributor", address: "0x7b54f3D993d3bcA077946034Ea710F9c07420C72", description: "PRL Tokenomics" },
  ],
  "sonic": [
    { name: "ParallelAccessManager", address: "0x8eFb3DED78FbaEF2a4eFe01E01BBD911E4094b78", description: "Core Protocol" },
    { name: "PeripheralPRL", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Parallel Governance Token l PRL Bridging Module" },
    { name: "sPRL1", address: "0x7Df74BBB6F82eC1BCB1562a30ef5Bf5c326e2811", description: "PRL Tokenomics" },
  ],
};
