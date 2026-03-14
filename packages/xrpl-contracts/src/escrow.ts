import { type Wallet, xrpToDrops, isValidClassicAddress } from "xrpl"
import { getClient, getExplorerUrl } from "./client.js"
import type { VestingEscrow } from "./types.js"

export function rippleTimeFromUnix(unixSeconds: number): number {
  return Math.floor(unixSeconds) - 946684800
}

export function unixFromRippleTime(rippleTime: number): number {
  return rippleTime + 946684800
}

export async function createVestingEscrow(
  founderWallet: Wallet,
  params: {
    beneficiaryAddress: string
    mptIssuanceId: string
    sharesAmount: string
    vestingCliffDate?: Date
    cancelAfterDate?: Date
    condition?: string
  }
): Promise<VestingEscrow> {
  const client = await getClient()

  const amount = params.mptIssuanceId
    ? { mpt_issuance_id: params.mptIssuanceId, value: params.sharesAmount }
    : xrpToDrops(params.sharesAmount)

  const tx: Record<string, unknown> = {
    TransactionType: "EscrowCreate",
    Account: founderWallet.address,
    Destination: params.beneficiaryAddress,
    Amount: amount,
  }

  if (params.vestingCliffDate) {
    tx.FinishAfter = rippleTimeFromUnix(params.vestingCliffDate.getTime() / 1000)
  }

  if (params.cancelAfterDate) {
    tx.CancelAfter = rippleTimeFromUnix(params.cancelAfterDate.getTime() / 1000)
  }

  if (params.condition) {
    tx.Condition = params.condition
  }

  const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0])
  const signed = founderWallet.sign(prepared)
  const result = await client.submitAndWait(signed.tx_blob)

  if ((result.result.meta as { TransactionResult?: string })?.TransactionResult !== "tesSUCCESS") {
    throw new Error(
      `Escrow creation failed: ${(result.result.meta as { TransactionResult?: string })?.TransactionResult}`
    )
  }

  const escrowSequence = (result.result.tx_json as { Sequence?: number }).Sequence ?? 0

  console.log(`✅ Vesting escrow created`)
  console.log(`   Sequence: ${escrowSequence}`)
  console.log(`   Shares locked: ${params.sharesAmount}`)
  if (params.vestingCliffDate) {
    console.log(`   Vesting cliff: ${params.vestingCliffDate.toISOString()}`)
  }
  console.log(`   ${getExplorerUrl(result.result.hash)}`)

  return {
    escrowSequence,
    ownerAddress: founderWallet.address,
    beneficiaryAddress: params.beneficiaryAddress,
    mptIssuanceId: params.mptIssuanceId,
    sharesAmount: params.sharesAmount,
    finishAfter: params.vestingCliffDate
      ? rippleTimeFromUnix(params.vestingCliffDate.getTime() / 1000)
      : null,
    cancelAfter: params.cancelAfterDate
      ? rippleTimeFromUnix(params.cancelAfterDate.getTime() / 1000)
      : null,
    condition: params.condition ?? null,
  }
}

export async function releaseEscrow(
  releaserWallet: Wallet,
  escrow: VestingEscrow,
  fulfillment?: string
): Promise<string> {
  const client = await getClient()

  const tx: Record<string, unknown> = {
    TransactionType: "EscrowFinish",
    Account: releaserWallet.address,
    Owner: escrow.ownerAddress,
    OfferSequence: escrow.escrowSequence,
  }

  if (fulfillment && escrow.condition) {
    tx.Fulfillment = fulfillment
    tx.Condition = escrow.condition
  }

  const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0])
  const signed = releaserWallet.sign(prepared)
  const result = await client.submitAndWait(signed.tx_blob)

  if ((result.result.meta as { TransactionResult?: string })?.TransactionResult !== "tesSUCCESS") {
    throw new Error(
      `Escrow release failed: ${(result.result.meta as { TransactionResult?: string })?.TransactionResult}`
    )
  }

  console.log(`✅ Escrow released — equity unlocked for ${escrow.beneficiaryAddress}`)
  console.log(`   ${getExplorerUrl(result.result.hash)}`)
  return result.result.hash
}

export async function cancelEscrow(
  founderWallet: Wallet,
  escrow: VestingEscrow
): Promise<string> {
  const client = await getClient()

  const tx = {
    TransactionType: "EscrowCancel",
    Account: founderWallet.address,
    Owner: escrow.ownerAddress,
    OfferSequence: escrow.escrowSequence,
  }

  const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0])
  const signed = founderWallet.sign(prepared)
  const result = await client.submitAndWait(signed.tx_blob)

  if ((result.result.meta as { TransactionResult?: string })?.TransactionResult !== "tesSUCCESS") {
    throw new Error(
      `Escrow cancel failed: ${(result.result.meta as { TransactionResult?: string })?.TransactionResult}`
    )
  }

  console.log(`✅ Escrow cancelled — shares returned to founder`)
  console.log(`   ${getExplorerUrl(result.result.hash)}`)
  return result.result.hash
}

export async function getActiveEscrows(address: string): Promise<
  Array<{
    sequence: number
    destination: string
    amount: unknown
    finishAfter?: number
    cancelAfter?: number
    condition?: string
  }>
> {
  const client = await getClient()

  const response = await client.request({
    command: "account_objects",
    account: address,
    type: "escrow",
    ledger_index: "validated",
  })

  return (response.result.account_objects as unknown as Array<{
    Sequence: number
    Destination: string
    Amount: unknown
    FinishAfter?: number
    CancelAfter?: number
    Condition?: string
  }>).map((obj) => ({
    sequence: obj.Sequence,
    destination: obj.Destination,
    amount: obj.Amount,
    finishAfter: obj.FinishAfter,
    cancelAfter: obj.CancelAfter,
    condition: obj.Condition,
  }))
}

export function generateCryptoCondition(): { condition: string; fulfillment: string } {
  const preimage = crypto.getRandomValues(new Uint8Array(32))
  const preimageHex = Buffer.from(preimage).toString("hex").toUpperCase()

  const fulfillment = `A0228020${preimageHex}`
  const conditionHash = preimageHex
  const condition = `A0258020${conditionHash}0102${(32).toString(16).padStart(4, "0")}`

  return { condition, fulfillment }
}
