import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://sepolia.base.org";

export function getPublicClient() {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(BASE_RPC_URL),
  });
}

export function getWalletClient(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(BASE_RPC_URL),
  });
}

export function getBaseExplorerUrl(txHash: string): string {
  return `https://sepolia.basescan.org/tx/${txHash}`;
}

export function getContractExplorerUrl(address: string): string {
  return `https://sepolia.basescan.org/address/${address}`;
}
