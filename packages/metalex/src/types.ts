export interface SAFEDeployParams {
  founderEvmAddress: `0x${string}`;
  documentHash: `0x${string}`;
  companyName: string;
  valuationCapUSD: number;
  discountRateBps: number;
  investmentAmountUSD: number;
  governingLaw: string;
  disputeResolution: string;
  investorAddresses: `0x${string}`[];
  xrplNetwork: string;
  founderXrplAddress: string;
}

export interface SAFEDeployResult {
  contractAddress: `0x${string}`;
  transactionHash: `0x${string}`;
  blockNumber: number;
  documentHash: `0x${string}`;
  explorerUrl: string;
}

export interface SAFELinkResult {
  transactionHash: `0x${string}`;
  mptIssuanceId: string;
  explorerUrl: string;
}

export interface SAFEDocument {
  text: string;
  hash: `0x${string}`;
}

export interface SAFERecord {
  contractAddress: string;
  documentHash: string;
  companyName: string;
  valuationCapUSD: number;
  mptIssuanceId: string | null;
  deployTxHash: string;
  linkTxHash: string | null;
  settleTxHash: string | null;
  baseSepoliaExplorerUrl: string;
}

export interface SAFEOnChainStatus {
  status: number;
  createdAt: string;
  confirmedAt: string;
  documentHash: `0x${string}`;
  mptIssuanceId: string;
}
