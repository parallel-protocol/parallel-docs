/**
 * AUTO-GENERATED via `pnpm generate:sidebar` — DO NOT EDIT MANUALLY.
 * Source : arbo `docs/pages/` post-conversion. Regénérer après chaque
 * `pnpm convert`.
 *
 * Manual override : éditer scripts/generate-sidebar.ts (TOP_LEVEL_ORDER,
 * COLLAPSED_BY_DEFAULT_PATTERNS) ou tweaker dans vocs.config.tsx après import.
 */

import type { Sidebar } from "vocs";

export const sidebar: Sidebar = [
  {
    "text": "Introduction",
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
    ]
  },
  {
    "text": "Products",
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
                "text": "Flashloan Module",
                "link": "/products/parallel-v3/how-it-works/flashloan-module"
              },
              {
                "text": "Bridging Module",
                "link": "/products/parallel-v3/how-it-works/bridging-module"
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
                    "text": "Fee Distribution",
                    "link": "/products/parallel-v3/stablecoins-and-savings/usdp-and-susdp/fee-distribution"
                  },
                  {
                    "text": "Implementation",
                    "link": "/products/parallel-v3/stablecoins-and-savings/usdp-and-susdp/implementation"
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
        "link": "/products/parallel-v3"
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
                    "text": "Borrowing",
                    "link": "/products/parallel-v2/how-it-works/vaults/borrowing"
                  },
                  {
                    "text": "Depositing",
                    "link": "/products/parallel-v2/how-it-works/vaults/depositing"
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
                    "text": "Liquidating",
                    "link": "/products/parallel-v2/how-it-works/vaults/liquidating"
                  },
                  {
                    "text": "Repaying",
                    "link": "/products/parallel-v2/how-it-works/vaults/repaying"
                  },
                  {
                    "text": "Withdrawing",
                    "link": "/products/parallel-v2/how-it-works/vaults/withdrawing"
                  }
                ],
                "link": "/products/parallel-v2/how-it-works/vaults",
                "collapsed": true
              },
              {
                "text": "Super Vaults (SV)",
                "items": [
                  {
                    "text": "Automated Rebalance",
                    "link": "/products/parallel-v2/how-it-works/super-vaults-sv/automated-rebalance"
                  },
                  {
                    "text": "EmptyVault",
                    "link": "/products/parallel-v2/how-it-works/super-vaults-sv/emptyvault"
                  },
                  {
                    "text": "Leveraging",
                    "link": "/products/parallel-v2/how-it-works/super-vaults-sv/leveraging"
                  },
                  {
                    "text": "Managed Rebalance",
                    "link": "/products/parallel-v2/how-it-works/super-vaults-sv/managed-rebalance"
                  },
                  {
                    "text": "Rebalancing",
                    "link": "/products/parallel-v2/how-it-works/super-vaults-sv/rebalancing"
                  }
                ],
                "link": "/products/parallel-v2/how-it-works/super-vaults-sv",
                "collapsed": true
              },
              {
                "text": "Bridging Module",
                "items": [
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
                  },
                  {
                    "text": "LayerZero Infrastructure",
                    "link": "/products/parallel-v2/how-it-works/bridging-module/layerzero-infrastructure"
                  },
                  {
                    "text": "Specifications",
                    "link": "/products/parallel-v2/how-it-works/bridging-module/specifications"
                  }
                ],
                "link": "/products/parallel-v2/how-it-works/bridging-module",
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
    ]
  },
  {
    "text": "Security",
    "items": [
      {
        "text": "Audits",
        "link": "/security/audits"
      },
      {
        "text": "Bug Bounty Program",
        "link": "/security/bug-bounty-program"
      },
      {
        "text": "Hypernative",
        "link": "/security/hypernative"
      },
      {
        "text": "Insurance Fund",
        "link": "/security/insurance-fund"
      },
      {
        "text": "Keepers",
        "link": "/security/keepers"
      },
      {
        "text": "Parallel Emergency Guardians",
        "link": "/security/parallel-emergency-guardians"
      },
      {
        "text": "Proof of Solvency",
        "link": "/security/proof-of-solvency"
      }
    ]
  },
  {
    "text": "DAO & Governance",
    "items": [
      {
        "text": "Parallel Governance Token (PRL)",
        "items": [
          {
            "text": "Bridging Module",
            "items": [
              {
                "text": "Implementation",
                "link": "/governance/parallel-governance-token-prl/bridging-module/implementation"
              },
              {
                "text": "Specifications",
                "link": "/governance/parallel-governance-token-prl/bridging-module/specifications"
              }
            ],
            "link": "/governance/parallel-governance-token-prl/bridging-module",
            "collapsed": true
          },
          {
            "text": "Governance",
            "link": "/governance/parallel-governance-token-prl/governance"
          },
          {
            "text": "Issuance",
            "link": "/governance/parallel-governance-token-prl/issuance"
          },
          {
            "text": "MIMO to PRL Migration",
            "link": "/governance/parallel-governance-token-prl/mimo-to-prl-migration"
          },
          {
            "text": "Tokenomics",
            "items": [
              {
                "text": "Epoch Concept",
                "link": "/governance/parallel-governance-token-prl/tokenomics/epoch-concept"
              },
              {
                "text": "Fee Distribution",
                "link": "/governance/parallel-governance-token-prl/tokenomics/fee-distribution"
              },
              {
                "text": "ParaBoost",
                "link": "/governance/parallel-governance-token-prl/tokenomics/paraboost"
              },
              {
                "text": "Staking Mechanisms",
                "link": "/governance/parallel-governance-token-prl/tokenomics/staking-mechanisms"
              }
            ],
            "link": "/governance/parallel-governance-token-prl/tokenomics",
            "collapsed": true
          }
        ],
        "link": "/governance/parallel-governance-token-prl"
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
            "text": "Parallel Governance Proposal (PGP)",
            "link": "/governance/proposal-framework/parallel-governance-proposal-pgp"
          },
          {
            "text": "Parallel Improvement Protocol (PIP)",
            "link": "/governance/proposal-framework/parallel-improvement-protocol-pip"
          },
          {
            "text": "Parallel Integration Request (PIR)",
            "link": "/governance/proposal-framework/parallel-integration-request-pir"
          }
        ],
        "link": "/governance/proposal-framework"
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
    ]
  },
  {
    "text": "Developers Hub",
    "items": [
      {
        "text": "Introduction",
        "link": "/developers-hub/developers-guide"
      },
      {
        "text": "Parallel V3",
        "items": [
          {
            "text": "Bridging Module",
            "link": "/developers-hub/parallel-v3/bridging-module"
          },
          {
            "text": "Build on Parallel",
            "items": [
              {
                "text": "Flashloan Module Integration",
                "link": "/developers-hub/parallel-v3/build-on-parallel/flashloan-module-integration"
              },
              {
                "text": "Parallelizer Module Integration",
                "link": "/developers-hub/parallel-v3/build-on-parallel/parallelizer-module-integration"
              },
              {
                "text": "Savings Module Integration",
                "link": "/developers-hub/parallel-v3/build-on-parallel/savings-module-integration"
              }
            ],
            "link": "/developers-hub/parallel-v3/build-on-parallel",
            "collapsed": true
          },
          {
            "text": "Flashloan Module",
            "link": "/developers-hub/parallel-v3/flashloan-module"
          },
          {
            "text": "Offchain Tools",
            "items": [
              {
                "text": "Dune",
                "link": "/developers-hub/parallel-v3/offchain-tools/dune"
              },
              {
                "text": "Subgraphs",
                "link": "/developers-hub/parallel-v3/offchain-tools/subgraphs"
              }
            ],
            "link": "/developers-hub/parallel-v3/offchain-tools",
            "collapsed": true
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
            "text": "Parallelizer Module",
            "link": "/developers-hub/parallel-v3/parallelizer-module"
          },
          {
            "text": "Savings Module",
            "link": "/developers-hub/parallel-v3/savings-module"
          }
        ],
        "link": "/developers-hub/parallel-v3"
      },
      {
        "text": "Parallel V2",
        "items": [
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
            "text": "Classic Vaults",
            "items": [
              {
                "text": "Architecture",
                "link": "/developers-hub/parallel-v2/classic-vaults/architecture"
              },
              {
                "text": "Borrowing and minting PAR/paUSD",
                "link": "/developers-hub/parallel-v2/classic-vaults/borrowing-and-minting-par-pausd"
              },
              {
                "text": "Opening a vault",
                "link": "/developers-hub/parallel-v2/classic-vaults/opening-a-vault"
              },
              {
                "text": "VaultsCore",
                "link": "/developers-hub/parallel-v2/classic-vaults/vaultscore"
              }
            ],
            "link": "/developers-hub/parallel-v2/classic-vaults",
            "collapsed": true
          },
          {
            "text": "Super Vault (SV)",
            "items": [
              {
                "text": "Action Contracts",
                "items": [
                  {
                    "text": "MIMOAutoRebalance",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimoautorebalance"
                  },
                  {
                    "text": "MIMOEmptyVault",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimoemptyvault"
                  },
                  {
                    "text": "MIMOLeverage",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimoleverage"
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
                    "text": "MIMORebalance",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/action-contracts/mimorebalance"
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
              },
              {
                "text": "Proxy Design",
                "items": [
                  {
                    "text": "MIMOProxy",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/proxy-design/mimoproxy"
                  },
                  {
                    "text": "MIMOProxyFactory",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/proxy-design/mimoproxyfactory"
                  },
                  {
                    "text": "MIMOProxyGuard",
                    "link": "/developers-hub/parallel-v2/super-vault-sv/proxy-design/mimoproxyguard"
                  }
                ],
                "link": "/developers-hub/parallel-v2/super-vault-sv/proxy-design",
                "collapsed": true
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
        "text": "Parallel Governance Token (PRL)",
        "items": [
          {
            "text": "Tokenomics",
            "items": [
              {
                "text": "Contracts",
                "link": "/developers-hub/parallel-governance-token-prl/tokenomics/contracts"
              },
              {
                "text": "Key Operations Flows",
                "link": "/developers-hub/parallel-governance-token-prl/tokenomics/key-operations-flows"
              }
            ],
            "link": "/developers-hub/parallel-governance-token-prl/tokenomics",
            "collapsed": true
          }
        ],
        "link": "/developers-hub/parallel-governance-token-prl"
      },
      {
        "text": "Addresses",
        "items": [
          {
            "text": "Parallel V2",
            "items": [
              {
                "text": "MIMO-DEPRECATED Contract Addresses",
                "link": "/developers-hub/contract-addresses/parallel-v2/mimo-deprecated"
              },
              {
                "text": "PAR Contract Addresses",
                "link": "/developers-hub/contract-addresses/parallel-v2/par"
              },
              {
                "text": "PAUSD-DEPRECATED Contract Addresses",
                "link": "/developers-hub/contract-addresses/parallel-v2/pausd-deprecated"
              }
            ],
            "link": "/developers-hub/contract-addresses/parallel-v2",
            "collapsed": true
          },
          {
            "text": "Parallel V3",
            "items": [
              {
                "text": "PRL Contract Addresses",
                "link": "/developers-hub/contract-addresses/parallel-v3/prl"
              },
              {
                "text": "USDP Contract Addresses",
                "link": "/developers-hub/contract-addresses/parallel-v3/usdp"
              }
            ],
            "link": "/developers-hub/contract-addresses/parallel-v3",
            "collapsed": true
          }
        ],
        "link": "/developers-hub/contract-addresses",
        "collapsed": true
      }
    ]
  },
  {
    "text": "Resources",
    "items": [
      {
        "text": "User Guides",
        "link": "/resources/user-guides"
      }
    ]
  }
];
