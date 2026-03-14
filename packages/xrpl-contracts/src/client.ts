import { Client } from "xrpl"
import { type Network, NETWORKS } from "./types.js"

let _client: Client | null = null
let _network: Network = "testnet"

export function getNetwork(): Network {
  return _network
}

export function getExplorerUrl(txHash: string): string {
  return `${NETWORKS[_network].explorer}/transactions/${txHash}`
}

export async function getClient(network: Network = "testnet"): Promise<Client> {
  if (_client && _client.isConnected() && _network === network) {
    return _client
  }

  if (_client && _client.isConnected()) {
    await _client.disconnect()
  }

  _network = network
  _client = new Client(NETWORKS[network].ws)
  await _client.connect()
  return _client
}

export async function disconnect(): Promise<void> {
  if (_client && _client.isConnected()) {
    await _client.disconnect()
    _client = null
  }
}

export async function withClient<T>(
  fn: (client: Client) => Promise<T>,
  network: Network = "testnet"
): Promise<T> {
  const client = await getClient(network)
  return fn(client)
}
