export type Network = "testnet" | "devnet" | "mainnet"

export interface NetworkConfig {
  ws: string
  faucet: string | null
  explorer: string
}

export const NETWORKS: Record<Network, NetworkConfig> = {
  testnet: {
    ws: "wss://s.altnet.rippletest.net:51233",
    faucet: "https://faucet.altnet.rippletest.net/accounts",
    explorer: "https://testnet.xrpl.org",
  },
  devnet: {
    ws: "wss://s.devnet.rippletest.net:51233",
    faucet: "https://faucet.devnet.rippletest.net/accounts",
    explorer: "https://devnet.xrpl.org",
  },
  mainnet: {
    ws: "wss://xrplcluster.com",
    faucet: null,
    explorer: "https://livenet.xrpl.org",
  },
}

export interface StartupRound {
  founderAddress: string
  companyName: string
  valuationCapXRP: string
  totalEquityShares: string
  transferable: boolean
  royaltyBps: number
  /** Optional extra fields merged into MPT metadata (e.g. SAFE contract address) */
  extraMetadata?: Record<string, string>
}

export interface EquityToken {
  mptIssuanceId: string
  founderAddress: string
  companyName: string
  totalShares: string
  royaltyBps: number
  transferable: boolean
  createdAt: number
}

export interface VestingEscrow {
  escrowSequence: number
  ownerAddress: string
  beneficiaryAddress: string
  mptIssuanceId: string
  sharesAmount: string
  finishAfter: number | null
  cancelAfter: number | null
  condition: string | null
}

export interface PaymentVerification {
  valid: boolean
  deliveredDrops: string
  deliveredXRP: string
  sender: string
  destinationTag: number | undefined
  txHash: string
  validated: boolean
}
