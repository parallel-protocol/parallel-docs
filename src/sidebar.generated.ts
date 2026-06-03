/**
 * AUTO-GENERATED via `pnpm generate:sidebar` — DO NOT EDIT MANUALLY.
 * Source : arbo `docs/pages/` post-conversion. Regénérer après chaque
 * `pnpm convert`.
 *
 * Manual override : éditer scripts/generate-sidebar.ts (TOP_LEVEL_ORDER,
 * COLLAPSED_BY_DEFAULT_PATTERNS) ou tweaker dans vocs.config.tsx après import.
 */

import type { Config } from "vocs/config";

type Sidebar = Config["sidebar"];

export const sidebar: Sidebar = [
  {
    "text": "INTRODUCTION",
    "items": [
      {
        "text": "Overview",
        "link": "/"
      },
      {
        "text": "Products",
        "link": "/introduction/products"
      },
      {
        "text": "Use Cases",
        "link": "/introduction/use-cases"
      }
    ],
    "collapsed": false
  },
  {
    "text": "PRODUCTS",
    "items": [
      {
        "text": "Parallel V3",
        "items": [
          {
            "text": "How It Works",
            "items": [
              {
                "text": "Parallelizer Module",
                "link": "/products/parallel-v3/how-it-works/parallelizer-module"
              },
              {
                "text": "Savings Module",
                "link": "/products/parallel-v3/how-it-works/savings-module"
              },
              {
                "text": "Bridging Module",
                "link": "/products/parallel-v3/how-it-works/bridging-module"
              },
              {
                "text": "Flashloan Module",
                "link": "/products/parallel-v3/how-it-works/flashloan-module"
              }
            ],
            "link": "/products/parallel-v3/how-it-works",
            "collapsed": true
          },
          {
            "text": "Stablecoins & Savings",
            "items": [
              {
                "text": "USDp & sUSDp",
                "items": [
                  {
                    "text": "Implementation",
                    "link": "/products/parallel-v3/stablecoins-and-savings/usdp-and-susdp/implementation"
                  },
                  {
                    "text": "Fee Distribution",
                    "link": "/products/parallel-v3/stablecoins-and-savings/usdp-and-susdp/fee-distribution"
                  }
                ],
                "link": "/products/parallel-v3/stablecoins-and-savings/usdp-and-susdp",
                "collapsed": true
              }
            ],
            "link": "/products/parallel-v3/stablecoins-and-savings",
            "collapsed": true
          },
          {
            "text": "Governance",
            "link": "/products/parallel-v3/governance"
          },
          {
            "text": "Licensing",
            "link": "/products/parallel-v3/licensing"
          }
        ],
        "link": "/products/parallel-v3",
        "collapsed": true
      },
      {
        "text": "Parallel V2",
        "items": [
          {
            "text": "Stablecoins",
            "items": [
              {
                "text": "PAR",
                "items": [
                  {
                    "text": "How does PAR work?",
                    "link": "/products/parallel-v2/stablecoins/par/how-does-par-work"
                  },
                  {
                    "text": "Where can I get PAR ?",
                    "link": "/products/parallel-v2/stablecoins/par/where-can-i-get-par"
                  }
                ],
                "link": "/products/parallel-v2/stablecoins/par",
                "collapsed": true
              },
              {
                "text": "paUSD",
                "items": [
                  {
                    "text": "How does paUSD work?",
                    "link": "/products/parallel-v2/stablecoins/par-1/how-does-pausd-work"
                  },
                  {
                    "text": "Where can I get paUSD ?",
                    "link": "/products/parallel-v2/stablecoins/par-1/where-can-i-get-pausd"
                  }
                ],
                "link": "/products/parallel-v2/stablecoins/par-1",
                "collapsed": true
              }
            ],
            "link": "/products/parallel-v2/stablecoins",
            "collapsed": true
          },
          {
            "text": "How It Works",
            "items": [
              {
                "text": "Classic Vaults",
                "items": [
                  {
                    "text": "Depositing",
                    "link": "/products/parallel-v2/how-it-works/vaults/depositing"
                  },
                  {
                    "text": "Borrowing",
                    "link": "/products/parallel-v2/how-it-works/vaults/borrowing"
                  },
                  {
                    "text": "Fees",
                    "items": [
                      {
                        "text": "Fees Generation",
                        "link": "/products/parallel-v2/how-it-works/vaults/fees/fees-generation"
                      }
                    ],
                    "link": "/products/parallel-v2/how-it-works/vaults/fees",
                    "collapsed": true
                  },
                  {
                    "text": "Withdrawing",
                    "link": "/products/parallel-v2/how-it-works/vaults/withdrawing"
                  },
                  {
                    "text": "Repaying",
                    "link": "/products/parallel-v2/how-it-works/vaults/repaying"
                  },
                  {
                    "text": "Liquidating",
                    "link": "/products/parallel-v2/how-it-works/vaults/liquidating"
                  }
                ],
                "link": "/products/parallel-v2/how-it-works/vaults",
                "collapsed": true
              },
              {
                "text": "Bridging Module",
                "items": [
                  {
                    "text": "LayerZero Infrastructure",
                    "link": "/products/parallel-v2/how-it-works/bridging-module/layerzero-infrastructure"
                  },
                  {
                    "text": "Specifications",
                    "link": "/products/parallel-v2/how-it-works/bridging-module/specifications"
                  },
                  {
                    "text": "Implementation",
                    "items": [
                      {
                        "text": "PAR",
                        "link": "/products/parallel-v2/how-it-works/bridging-module/implementation/par"
                      },
                      {
                        "text": "paUSD",
                        "link": "/products/parallel-v2/how-it-works/bridging-module/implementation/pausd"
                      }
                    ],
                    "link": "/products/parallel-v2/how-it-works/bridging-module/implementation",
                    "collapsed": true
                  }
                ],
                "link": "/products/parallel-v2/how-it-works/bridging-module",
                "collapsed": true
              },
              {
                "text": "Super Vaults (SV)",
                "items": [
                  {
                    "text": "Leveraging",
                    "link": "/products/parallel-v2/how-it-works/super-vaults-sv/leveraging"
                  },
                  {
                    "text": "Rebalancing",
                    "link": "/products/parallel-v2/how-it-works/super-vaults-sv/rebalancing"
                  },
                  {
                    "text": "EmptyVault",
                    "link": "/products/parallel-v2/how-it-works/super-vaults-sv/emptyvault"
                  },
                  {
                    "text": "Automated Rebalance",
                    "link": "/products/parallel-v2/how-it-works/super-vaults-sv/automated-rebalance"
                  },
                  {
                    "text": "Managed Rebalance",
                    "link": "/products/parallel-v2/how-it-works/super-vaults-sv/managed-rebalance"
                  }
                ],
                "link": "/products/parallel-v2/how-it-works/super-vaults-sv",
                "collapsed": true
              }
            ],
            "link": "/products/parallel-v2/how-it-works",
            "collapsed": true
          },
          {
            "text": "Licensing",
            "link": "/products/parallel-v2/licensing"
          }
        ],
        "link": "/products/parallel-v2",
        "collapsed": true
      }
    ],
    "collapsed": false
  },
  {
    "text": "SECURITY",
    "items": [
      {
        "text": "Proof of Solvency",
        "link": "/security/proof-of-solvency"
      },
      {
        "text": "Parallel Emergency Guardians",
        "link": "/security/parallel-emergency-guardians"
      },
      {
        "text": "Hypernative",
        "link": "/security/hypernative"
      },
      {
        "text": "Keepers",
        "link": "/security/keepers"
      },
      {
        "text": "Bug Bounty Program",
        "link": "/security/bug-bounty-program"
      },
      {
        "text": "Insurance Fund",
        "link": "/security/insurance-fund"
      },
      {
        "text": "Audits",
        "link": "/security/audits"
      }
    ],
    "collapsed": false
  },
  {
    "text": "DAO & GOVERNANCE",
    "items": [
      {
        "text": "Parallel Governance Token (PRL)",
        "items": [
          {
            "text": "Issuance",
            "link": "/governance/parallel-governance-token-prl/issuance"
          },
          {
            "text": "Bridging Module",
            "items": [
              {
                "text": "Specifications",
                "link": "/governance/parallel-governance-token-prl/bridging-module/specifications"
              },
              {
                "text": "Implementation",
                "link": "/governance/parallel-governance-token-prl/bridging-module/implementation"
              }
            ],
            "link": "/governance/parallel-governance-token-prl/bridging-module",
            "collapsed": true
          },
          {
            "text": "Tokenomics",
            "items": [
              {
                "text": "Epoch Concept",
                "link": "/governance/parallel-governance-token-prl/tokenomics/epoch-concept"
              },
              {
                "text": "Staking Mechanisms",
                "link": "/governance/parallel-governance-token-prl/tokenomics/staking-mechanisms"
              },
              {
                "text": "ParaBoost",
                "link": "/governance/parallel-governance-token-prl/tokenomics/paraboost"
              },
              {
                "text": "Fee Distribution",
                "link": "/governance/parallel-governance-token-prl/tokenomics/fee-distribution"
              }
            ],
            "link": "/governance/parallel-governance-token-prl/tokenomics",
            "collapsed": true
          },
          {
            "text": "Governance",
            "link": "/governance/parallel-governance-token-prl/governance"
          },
          {
            "text": "MIMO to PRL Migration",
            "link": "/governance/parallel-governance-token-prl/mimo-to-prl-migration"
          }
        ],
        "link": "/governance/parallel-governance-token-prl",
        "collapsed": true
      },
      {
        "text": "sPRL and Voting Power",
        "link": "/governance/sprl"
      },
      {
        "text": "Governance Process",
        "link": "/governance/governance-process"
      },
      {
        "text": "Proposal Framework",
        "items": [
          {
            "text": "Parallel Integration Request (PIR)",
            "link": "/governance/proposal-framework/parallel-integration-request-pir"
          },
          {
            "text": "Parallel Governance Proposal (PGP)",
            "link": "/governance/proposal-framework/parallel-governance-proposal-pgp"
          },
          {
            "text": "Parallel Improvement Protocol (PIP)",
            "link": "/governance/proposal-framework/parallel-improvement-protocol-pip"
          }
        ],
        "link": "/governance/proposal-framework",
        "collapsed": true
      },
      {
        "text": "DAO Multisigs",
        "items": [
          {
            "text": "DAO Multisigs Elections",
            "items": [
              {
                "text": "Election 1",
                "link": "/governance/dao-multisigs/dao-multisigs-elections/election-1"
              },
              {
                "text": "Election 2",
                "link": "/governance/dao-multisigs/dao-multisigs-elections/election-2"
              },
              {
                "text": "Election 3",
                "link": "/governance/dao-multisigs/dao-multisigs-elections/election-3"
              },
              {
                "text": "Election 4",
                "link": "/governance/dao-multisigs/dao-multisigs-elections/election-4"
              },
              {
                "text": "Election 5",
                "link": "/governance/dao-multisigs/dao-multisigs-elections/election-5"
              },
              {
                "text": "Election 6",
                "link": "/governance/dao-multisigs/dao-multisigs-elections/election-6"
              },
              {
                "text": "Election 7",
                "link": "/governance/dao-multisigs/dao-multisigs-elections/election-7"
              },
              {
                "text": "Election 8",
                "link": "/governance/dao-multisigs/dao-multisigs-elections/election-8"
              }
            ],
            "link": "/governance/dao-multisigs/dao-multisigs-elections",
            "collapsed": true
          }
        ],
        "link": "/governance/dao-multisigs",
        "collapsed": true
      },
      {
        "text": "DAO Treasury",
        "items": [
          {
            "text": "DAO Treasury Reports",
            "link": "/governance/dao-treasury/dao-treasury-reports"
          }
        ],
        "link": "/governance/dao-treasury",
        "collapsed": true
      }
    ],
    "collapsed": false
  },
  {
    "text": "DEVELOPERS HUB",
    "items": [
      {
        "text": "Introduction",
        "link": "/developers-hub/developers-guide"
      },
      {
        "text": "Parallel Governance Token (PRL)",
        "items": [
          {
            "text": "Tokenomics",
            "items": [
              {
                "text": "Key Operations Flows",
                "link": "/developers-hub/parallel-governance-token-prl/tokenomics/key-operations-flows"
              },
              {
                "text": "Contracts",
                "link": "/developers-hub/parallel-governance-token-prl/tokenomics/contracts"
              }
            ],
            "link": "/developers-hub/parallel-governance-token-prl/tokenomics",
            "collapsed": true
          }
        ],
        "link": "/developers-hub/parallel-governance-token-prl",
        "collapsed": true
      },
      {
        "text": "Parallel V3",
        "items": [
          {
            "text": "Parallelizer Module",
            "link": "/developers-hub/parallel-v3/parallelizer-module"
          },
          {
            "text": "Savings Module",
            "link": "/developers-hub/parallel-v3/savings-module"
          },
          {
            "text": "Flashloan Module",
            "link": "/developers-hub/parallel-v3/flashloan-module"
          },
          {
            "text": "Bridging Module",
            "link": "/developers-hub/parallel-v3/bridging-module"
          },
          {
            "text": "Onchain Tools",
            "items": [
              {
                "text": "Oracles",
                "items": [
                  {
                    "text": "DIA",
                    "items": [
                      {
                        "text": "Fundamental",
                        "link": "/developers-hub/parallel-v3/onchain-tools/oracles/dia/fundamental"
                      },
                      {
                        "text": "Market",
                        "link": "/developers-hub/parallel-v3/onchain-tools/oracles/dia/market"
                      }
                    ],
                    "link": "/developers-hub/parallel-v3/onchain-tools/oracles/dia",
                    "collapsed": true
                  },
                  {
                    "text": "RedStone",
                    "items": [
                      {
                        "text": "Fundamental",
                        "link": "/developers-hub/parallel-v3/onchain-tools/oracles/redstone/fundamental"
                      }
                    ],
                    "link": "/developers-hub/parallel-v3/onchain-tools/oracles/redstone",
                    "collapsed": true
                  }
                ],
                "link": "/developers-hub/parallel-v3/onchain-tools/oracles",
                "collapsed": true
              }
            ],
            "link": "/developers-hub/parallel-v3/onchain-tools",
            "collapsed": true
          },
          {
            "text": "Offchain Tools",
            "items": [
              {
                "text": "Subgraphs",
                "link": "/developers-hub/parallel-v3/offchain-tools/subgraphs"
              },
              {
                "text": "Dune",
                "link": "/developers-hub/parallel-v3/offchain-tools/dune"
              }
            ],
            "link": "/developers-hub/parallel-v3/offchain-tools",
            "collapsed": true
          },
          {
            "text": "Build on Parallel",
            "items": [
              {
                "text": "Parallelizer Module Integration",
                "link": "/developers-hub/parallel-v3/build-on-parallel/parallelizer-module-integration"
              },
              {
                "text": "Savings Module Integration",
                "link": "/developers-hub/parallel-v3/build-on-parallel/savings-module-integration"
              },
              {
                "text": "Flashloan Module Integration",
                "link": "/developers-hub/parallel-v3/build-on-parallel/flashloan-module-integration"
              }
            ],
            "link": "/developers-hub/parallel-v3/build-on-parallel",
            "collapsed": true
          }
        ],
        "link": "/developers-hub/parallel-v3",
        "collapsed": true
      },
      {
        "text": "Parallel V2",
        "items": [
          {
            "text": "Classic Vaults",
            "items": [
              {
                "text": "Architecture",
                "link": "/developers-hub/parallel-v2/classic-vaults/architecture"
              },
              {
                "text": "VaultsCore",
                "link": "/developers-hub/parallel-v2/classic-vaults/vaultscore"
              },
              {
                "text": "Opening a vault",
                "link": "/developers-hub/parallel-v2/classic-vaults/opening-a-vault"
              },
              {
                "text": "Borrowing and minting PAR/paUSD",
                "link": "/developers-hub/parallel-v2/classic-vaults/borrowing-and-minting-par-pausd"
              }
            ],
            "link": "/developers-hub/parallel-v2/classic-vaults",
            "collapsed": true
          },
          {
            "text": "Bridging Module",
            "items": [
              {
                "text": "Architecture",
                "link": "/developers-hub/parallel-v2/bridging-module/architecture"
              },
              {
                "text": "Sample Use Cases",
                "link": "/developers-hub/parallel-v2/bridging-module/sample-use-cases"
              }
            ],
            "link": "/developers-hub/parallel-v2/bridging-module",
            "collapsed": true
          },
          {
            "text": "Super Vault (SV)",
            "items": [
              {
                "text": "Proxy Design",
                "items": [
                  {
                    "text": "MIMOProxy",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/proxy-design/mimoproxy"
                  },
                  {
                    "text": "MIMOProxyGuard",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/proxy-design/mimoproxyguard"
                  },
                  {
                    "text": "MIMOProxyFactory",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/proxy-design/mimoproxyfactory"
                  }
                ],
                "link": "/developers-hub/parallel-v2/super-vault-sv/proxy-design",
                "collapsed": true
              },
              {
                "text": "Action Contracts",
                "items": [
                  {
                    "text": "MIMOEmptyVault",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimoemptyvault"
                  },
                  {
                    "text": "MIMOLeverage",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimoleverage"
                  },
                  {
                    "text": "MIMORebalance",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimorebalance"
                  },
                  {
                    "text": "MIMOAutoRebalance",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimoautorebalance"
                  },
                  {
                    "text": "MIMOManagedRebalance",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimomanagedrebalance"
                  },
                  {
                    "text": "MIMOProxyActions",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimoproxyactions"
                  },
                  {
                    "text": "MIMOVaultActions",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimovaultactions"
                  }
                ],
                "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts",
                "collapsed": true
              },
              {
                "text": "Leverage Max Amount Derivation",
                "link": "/developers-hub/parallel-v2/super-vault-sv/leverage-max-amount-derivation"
              }
            ],
            "link": "/developers-hub/parallel-v2/super-vault-sv",
            "collapsed": true
          }
        ],
        "link": "/developers-hub/parallel-v2",
        "collapsed": true
      },
      {
        "text": "Contract Addresses",
        "items": [
          {
            "text": "Parallel V3",
            "items": [
              {
                "text": "USDP Contract Addresses",
                "link": "/developers-hub/contract-addresses/parallel-v3/usdp"
              },
              {
                "text": "PRL Contract Addresses",
                "link": "/developers-hub/contract-addresses/parallel-v3/prl"
              }
            ],
            "link": "/developers-hub/contract-addresses/parallel-v3",
            "collapsed": true
          },
          {
            "text": "Parallel V2",
            "items": [
              {
                "text": "PAR Contract Addresses",
                "link": "/developers-hub/contract-addresses/parallel-v2/par"
              },
              {
                "text": "PAUSD-DEPRECATED Contract Addresses",
                "link": "/developers-hub/contract-addresses/parallel-v2/pausd-deprecated"
              },
              {
                "text": "MIMO-DEPRECATED Contract Addresses",
                "link": "/developers-hub/contract-addresses/parallel-v2/mimo-deprecated"
              }
            ],
            "link": "/developers-hub/contract-addresses/parallel-v2",
            "collapsed": true
          }
        ],
        "link": "/developers-hub/contract-addresses",
        "collapsed": true
      }
    ],
    "collapsed": false
  },
  {
    "text": "RESOURCES",
    "items": [
      {
        "text": "User Guides",
        "link": "/resources/user-guides"
      }
    ],
    "collapsed": false
  }
];
