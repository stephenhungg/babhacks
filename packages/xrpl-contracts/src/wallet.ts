import { Wallet } from "xrpl"
import { getClient } from "./client.js"
import type { Network } from "./types.js"

export function generateWallet(): Wallet {
  return Wallet.generate()
}

export function walletFromSeed(seed: string): Wallet {
  return Wallet.fromSeed(seed)
}

export function walletFromEnv(prefix: string): Wallet {
  const seed = process.env[`${prefix}_SEED`]
  if (!seed) throw new Error(`${prefix}_SEED not set in environment`)
  return Wallet.fromSeed(seed)
}

export async function fundWallet(
  wallet: Wallet,
  network: Network = "testnet"
): Promise<{ wallet: Wallet; balance: number }> {
  if (network === "mainnet") {
    throw new Error("Cannot fund mainnet wallets via faucet")
  }
  const client = await getClient(network)
  const result = await client.fundWallet(wallet)
  return { wallet: result.wallet, balance: result.balance }
}

export async function getBalance(
  address: string,
  network: Network = "testnet"
): Promise<string> {
  const client = await getClient(network)
  const response = await client.request({
    command: "account_info",
    account: address,
    ledger_index: "validated",
  })
  const drops = response.result.account_data.Balance
  return (Number(drops) / 1_000_000).toFixed(6)
}

export async function getAvailableBalance(
  address: string,
  network: Network = "testnet"
): Promise<string> {
  const client = await getClient(network)
  const [infoResp, objResp] = await Promise.all([
    client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated",
    }),
    client.request({
      command: "account_objects",
      account: address,
      ledger_index: "validated",
    }),
  ])

  const totalDrops = Number(infoResp.result.account_data.Balance)
  const ownedObjects = (objResp.result.account_objects as unknown[]).length
  const baseReserveDrops = 1_000_000
  const ownerReserveDrops = 200_000
  const reservedDrops = baseReserveDrops + ownedObjects * ownerReserveDrops
  const availableDrops = Math.max(0, totalDrops - reservedDrops)

  return (availableDrops / 1_000_000).toFixed(6)
}
