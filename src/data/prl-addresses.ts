import type { ContractEntry } from '@/components/ContractAddressesPage';

export const PRL_ADDRESSES: Record<string, ContractEntry[]> = {
  "arbitrum": [
    { name: "ParallelAccessManager", address: "0x0e4e7Ca9D7b1e6293D0713EFEfB4BCA010DeBF46", description: "Core Protocol" },
    { name: "PeripheralPRL", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Parallel Governance Token l PRL Bridging Module" },
  ],
  "avalanche": [
    { name: "ParallelAccessManager", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Core Protocol" },
    { name: "SideChainFeeDistributor (USDp)", address: "0x7d2C6c944907Ead0BE1B6c84C9CFe3dB4D4907c5", description: "PRL Tokenomics" },
  ],
  "base": [
    { name: "ParallelAccessManager", address: "0x0e4e7Ca9D7b1e6293D0713EFEfB4BCA010DeBF46", description: "Core Protocol" },
    { name: "PeripheralPRL", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Parallel Governance Token l PRL Bridging Module" },
    { name: "sPRL1", address: "0x01fA35fDE0E813e2D6687660a74A313d8D922E48", description: "PRL Tokenomics" },
    { name: "sPRL2", address: "0xB22f5eDbc62adCC093307025B8fdf75a0aa00e24", description: "PRL Tokenomics" },
    { name: "MainFeeDistributor (USDp)", address: "0x5D49C8b8cc691533742602d6aB3127904959B7e3", description: "PRL Tokenomics" },
    { name: "RewardMerkleDistributor (USDp)", address: "0x13E867f55043302925971e88aB8faB704241A96B", description: "PRL Tokenomics" },
  ],
  "ethereum": [
    { name: "ParallelAccessManager", address: "0x94Ea8800444017695345156319e96bdB1E355F7a", description: "Core Protocol" },
    { name: "PRL", address: "0x6c0aeceeDc55c9d55d8B99216a670D85330941c3", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
    { name: "LockBox", address: "0xdE91eb8206c228f4208c34510cf0C61C9302a434", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
    { name: "PrincipalMigrationContract (deprecated)", address: "0x0EC5ab257aDf6968A3D3C187BE1Ee0fe74487Eb3", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
    { name: "sPRL1", address: "0xeAd729472f82E5eC2FF4e691d67633077C1B5901", description: "PRL Tokenomics" },
    { name: "sPRL2 (v1, deprecated)", address: "0xE8A2d848fE656E34A6caA35f375B42979e322135", description: "PRL Tokenomics" },
    { name: "sPRL2 (v2)", address: "0xa13BFA24b189271Ac00b148BE565D609AC847A4B", description: "PRL Tokenomics" },
    { name: "sPRL2Migrator", address: "0x2fe66473d35a98131e1d08ff519378ad62dbbbef", description: "PRL Tokenomics" },
    { name: "SideChainFeeDistributor (PAR, deprecated)", address: "0x2A4ABC8dcBE2f68E48dFc0db5784C71dB8d5B89c", description: "PRL Tokenomics" },
    { name: "SideChainFeeDistributor (USDp)", address: "0xbEf8dD3E729a081855Ae7A5FcC5b6373f75d1ba9", description: "PRL Tokenomics" },
  ],
  "fantom": [
    { name: "ParallelAccessManager", address: "0x1FF33CF1607Ca109F23A3Fb9Ec5193037eB26306", description: "Core Protocol" },
    { name: "PeripheralMigrationContract (deprecated)", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
  ],
  "hyperevm": [
    { name: "ParallelAccessManager", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Core Protocol" },
    { name: "SideChainFeeDistributor (USDp)", address: "0x2f77c2Fe829ECC1CC4FE891Ca05D121971908574", description: "PRL Tokenomics" },
  ],
  "optimism": [
    { name: "ParallelAccessManager", address: "0x0e4e7Ca9D7b1e6293D0713EFEfB4BCA010DeBF46", description: "Core Protocol" },
    { name: "PeripheralPRL", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Parallel Governance Token l PRL Bridging Module" },
  ],
  "polygon": [
    { name: "ParallelAccessManager", address: "0x7Df74BBB6F82eC1BCB1562a30ef5Bf5c326e2811", description: "Core Protocol" },
    { name: "PeripheralPRL", address: "0x7790dd69aa10eD3f1271E41CD7222D2a7d2D5948", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
    { name: "PeripheralMigrationContract (deprecated)", address: "0x9C68850E18EACD4ea7ca2998b6BBeD9cf55316cb", description: "Parallel Governance Token l PRL Bridging Module l PRL Migration Contract" },
    { name: "sPRL1 (deprecated)", address: "0xDB7Be3a50bdf5641757EBEa38e8014E1F0AA9475", description: "PRL Tokenomics" },
    { name: "MainfeeDistributor (PAR, deprecated)", address: "0x90337e484B1Cb02132fc150d3Afa262147348545", description: "PRL Tokenomics" },
    { name: "RewardMerkleDistributor (PAR, deprecated)", address: "0x7b54f3D993d3bcA077946034Ea710F9c07420C72", description: "PRL Tokenomics" },
  ],
  "sonic": [
    { name: "ParallelAccessManager", address: "0x8eFb3DED78FbaEF2a4eFe01E01BBD911E4094b78", description: "Core Protocol" },
    { name: "PeripheralPRL", address: "0xfD28f108e95f4D41daAE9dbfFf707D677985998E", description: "Parallel Governance Token l PRL Bridging Module" },
    { name: "sPRL1 (deprecated)", address: "0x7Df74BBB6F82eC1BCB1562a30ef5Bf5c326e2811", description: "PRL Tokenomics" },
  ],
};
