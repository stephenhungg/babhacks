import { type Wallet, xrpToDrops } from "xrpl"
import { getClient, getExplorerUrl } from "./client.js"
import type { EquityToken, StartupRound } from "./types.js"

const MPT_FLAGS = {
  tfMPTCanLock: 0x0002,
  tfMPTRequireAuth: 0x0004,
  tfMPTCanEscrow: 0x0008,
  tfMPTCanTrade: 0x0010,
  tfMPTCanTransfer: 0x0020,
  tfMPTCanClawback: 0x0040,
}

export async function issueEquityToken(
  founderWallet: Wallet,
  round: StartupRound
): Promise<EquityToken> {
  const client = await getClient()

  let flags =
    MPT_FLAGS.tfMPTRequireAuth |
    MPT_FLAGS.tfMPTCanEscrow |
    MPT_FLAGS.tfMPTCanLock

  if (round.transferable || round.royaltyBps > 0) {
    flags |= MPT_FLAGS.tfMPTCanTransfer | MPT_FLAGS.tfMPTCanTrade
  }

  const tx: Record<string, unknown> = {
    TransactionType: "MPTokenIssuanceCreate",
    Account: founderWallet.address,
    MaximumAmount: round.totalEquityShares,
    AssetScale: 0,
    Flags: flags,
    Metadata: Buffer.from(
      JSON.stringify({
        company: round.companyName,
        valuationCapXRP: round.valuationCapXRP,
        type: "equity_safe",
        platform: "Lapis",
        ...(round.extraMetadata ?? {}),
      })
    ).toString("hex"),
  }

  if (round.royaltyBps > 0) {
    tx.TransferFee = round.royaltyBps
  }

  const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0])
  const signed = founderWallet.sign(prepared)
  const result = await client.submitAndWait(signed.tx_blob)

  if ((result.result.meta as { TransactionResult?: string })?.TransactionResult !== "tesSUCCESS") {
    throw new Error(
      `MPT issuance failed: ${(result.result.meta as { TransactionResult?: string })?.TransactionResult}`
    )
  }

  const meta = result.result.meta as { TransactionResult?: string; mpt_issuance_id?: string }
  const mptIssuanceId = meta.mpt_issuance_id ?? ""
  if (!mptIssuanceId) throw new Error("Could not find mpt_issuance_id in tx metadata")

  console.log(`✅ Equity token issued`)
  console.log(`   MPT Issuance ID: ${mptIssuanceId}`)
  console.log(`   ${getExplorerUrl(result.result.hash)}`)

  return {
    mptIssuanceId,
    founderAddress: founderWallet.address,
    companyName: round.companyName,
    totalShares: round.totalEquityShares,
    royaltyBps: round.royaltyBps,
    transferable: round.transferable,
    createdAt: Date.now(),
  }
}

export async function authorizeHolder(
  founderWallet: Wallet,
  mptIssuanceId: string,
  holderAddress: string
): Promise<void> {
  const client = await getClient()

  const tx = {
    TransactionType: "MPTokenAuthorize",
    Account: founderWallet.address,
    MPTokenIssuanceID: mptIssuanceId,
    Holder: holderAddress,
  }

  const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0])
  const signed = founderWallet.sign(prepared)
  const result = await client.submitAndWait(signed.tx_blob)

  if ((result.result.meta as { TransactionResult?: string })?.TransactionResult !== "tesSUCCESS") {
    throw new Error(
      `Holder authorization failed: ${(result.result.meta as { TransactionResult?: string })?.TransactionResult}`
    )
  }

  console.log(`✅ Authorized holder: ${holderAddress}`)
}

export async function holderOptIn(
  holderWallet: Wallet,
  mptIssuanceId: string
): Promise<void> {
  const client = await getClient()

  const tx = {
    TransactionType: "MPTokenAuthorize",
    Account: holderWallet.address,
    MPTokenIssuanceID: mptIssuanceId,
  }

  const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0])
  const signed = holderWallet.sign(prepared)
  await client.submitAndWait(signed.tx_blob)

  console.log(`✅ Holder opted in: ${holderWallet.address}`)
}

export async function transferEquityShares(
  founderWallet: Wallet,
  mptIssuanceId: string,
  recipientAddress: string,
  shares: string
): Promise<string> {
  const client = await getClient()

  const tx = {
    TransactionType: "Payment",
    Account: founderWallet.address,
    Destination: recipientAddress,
    Amount: {
      mpt_issuance_id: mptIssuanceId,
      value: shares,
    },
  }

  const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0])
  const signed = founderWallet.sign(prepared)
  const result = await client.submitAndWait(signed.tx_blob)

  if ((result.result.meta as { TransactionResult?: string })?.TransactionResult !== "tesSUCCESS") {
    throw new Error(
      `Share transfer failed: ${(result.result.meta as { TransactionResult?: string })?.TransactionResult}`
    )
  }

  console.log(`✅ Transferred ${shares} shares to ${recipientAddress}`)
  console.log(`   ${getExplorerUrl(result.result.hash)}`)
  return result.result.hash
}

export async function getMptHoldings(
  address: string,
  mptIssuanceId?: string
): Promise<Array<{ mptIssuanceId: string; value: string }>> {
  const client = await getClient()

  const response = await client.request({
    command: "account_objects",
    account: address,
    ledger_index: "validated",
  })

  const objects = (response as unknown as { result: { account_objects: Array<{
    LedgerEntryType: string
    MPTokenIssuanceID: string
    MPTAmount: string
  }> } }).result.account_objects

  const holdings = objects.filter(
    (obj) =>
      obj.LedgerEntryType === "MPToken" &&
      (!mptIssuanceId || obj.MPTokenIssuanceID === mptIssuanceId)
  )

  return holdings.map((h) => ({
    mptIssuanceId: h.MPTokenIssuanceID,
    value: h.MPTAmount,
  }))
}

