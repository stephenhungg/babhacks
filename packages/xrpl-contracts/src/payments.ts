import { type Wallet, xrpToDrops, dropsToXrp } from "xrpl"
import { getClient, getExplorerUrl } from "./client.js"
import type { PaymentVerification } from "./types.js"

export async function sendPayment(
  senderWallet: Wallet,
  params: {
    destination: string
    amountXRP: string
    destinationTag?: number
    memo?: string
  }
): Promise<string> {
  const client = await getClient()

  const tx: Record<string, unknown> = {
    TransactionType: "Payment",
    Account: senderWallet.address,
    Destination: params.destination,
    Amount: xrpToDrops(params.amountXRP),
  }

  if (params.destinationTag !== undefined) {
    tx.DestinationTag = params.destinationTag
  }

  if (params.memo) {
    tx.Memos = [
      {
        Memo: {
          MemoData: Buffer.from(params.memo, "utf8").toString("hex").toUpperCase(),
        },
      },
    ]
  }

  const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0])
  const signed = senderWallet.sign(prepared)
  const result = await client.submitAndWait(signed.tx_blob)

  if ((result.result.meta as { TransactionResult?: string })?.TransactionResult !== "tesSUCCESS") {
    throw new Error(
      `Payment failed: ${(result.result.meta as { TransactionResult?: string })?.TransactionResult}`
    )
  }

  console.log(`✅ Payment sent: ${params.amountXRP} XRP → ${params.destination}`)
  console.log(`   ${getExplorerUrl(result.result.hash)}`)
  return result.result.hash
}

export async function verifyPayment(
  txHash: string,
  expectedDestination: string,
  expectedMinXRP: string,
  expectedDestinationTag?: number
): Promise<PaymentVerification> {
  const client = await getClient()

  const response = await client.request({
    command: "tx",
    transaction: txHash,
  })

  const tx = response.result
  const meta = tx.meta as {
    TransactionResult?: string
    delivered_amount?: string
  }

  if (!tx.validated) {
    return {
      valid: false,
      deliveredDrops: "0",
      deliveredXRP: "0",
      sender: "",
      destinationTag: undefined,
      txHash,
      validated: false,
    }
  }

  const txJson = tx.tx_json as {
    TransactionType?: string
    Destination?: string
    DestinationTag?: number
    Account?: string
  }

  if (txJson.TransactionType !== "Payment") {
    return buildInvalid(txHash)
  }

  if (txJson.Destination !== expectedDestination) {
    return buildInvalid(txHash)
  }

  if (
    expectedDestinationTag !== undefined &&
    txJson.DestinationTag !== expectedDestinationTag
  ) {
    return buildInvalid(txHash)
  }

  if (meta.TransactionResult !== "tesSUCCESS") {
    return buildInvalid(txHash)
  }

  const deliveredDrops = String(meta.delivered_amount ?? "0")
  const deliveredXRP = String(dropsToXrp(deliveredDrops))

  if (Number(deliveredXRP) < Number(expectedMinXRP)) {
    return buildInvalid(txHash)
  }

  return {
    valid: true,
    deliveredDrops,
    deliveredXRP,
    sender: txJson.Account ?? "",
    destinationTag: txJson.DestinationTag,
    txHash,
    validated: true,
  }
}

function buildInvalid(txHash: string): PaymentVerification {
  return {
    valid: false,
    deliveredDrops: "0",
    deliveredXRP: "0",
    sender: "",
    destinationTag: undefined,
    txHash,
    validated: false,
  }
}

export async function createPaymentChannel(
  senderWallet: Wallet,
  params: {
    destination: string
    amountXRP: string
    settleDelaySeconds: number
  }
): Promise<string> {
  const client = await getClient()

  const tx = {
    TransactionType: "PaymentChannelCreate",
    Account: senderWallet.address,
    Destination: params.destination,
    Amount: xrpToDrops(params.amountXRP),
    SettleDelay: params.settleDelaySeconds,
    PublicKey: senderWallet.publicKey,
  }

  const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0])
  const signed = senderWallet.sign(prepared)
  const result = await client.submitAndWait(signed.tx_blob)

  if ((result.result.meta as { TransactionResult?: string })?.TransactionResult !== "tesSUCCESS") {
    throw new Error(
      `Channel creation failed: ${(result.result.meta as { TransactionResult?: string })?.TransactionResult}`
    )
  }

  const channelId = (result.result.meta as { offer_id?: string })?.offer_id ?? result.result.hash
  console.log(`✅ Payment channel created: ${channelId}`)
  console.log(`   ${getExplorerUrl(result.result.hash)}`)
  return channelId
}
