import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { disconnect } from "../src/client.js"
import { fundWallet, generateWallet } from "../src/wallet.js"
import { issueEquityToken, authorizeHolder, holderOptIn, transferEquityShares } from "../src/mpt.js"
import { createVestingEscrow, releaseEscrow, getActiveEscrows, rippleTimeFromUnix } from "../src/escrow.js"
import { sendPayment } from "../src/payments.js"

describe("vesting escrow (testnet)", () => {
  let founder: Awaited<ReturnType<typeof fundWallet>>["wallet"]
  let investor: Awaited<ReturnType<typeof fundWallet>>["wallet"]

  beforeAll(async () => {
    const f = generateWallet()
    const i = generateWallet()
    const [ff, fi] = await Promise.all([fundWallet(f), fundWallet(i)])
    founder = ff.wallet
    investor = fi.wallet
  }, 60_000)

  afterAll(async () => {
    await disconnect()
  })

  it("creates XRP escrow and releases after cliff", async () => {
    const cliffDate = new Date(Date.now() + 5 * 1000)
    const cancelDate = new Date(Date.now() + 60 * 1000)

    const escrow = await createVestingEscrow(founder, {
      beneficiaryAddress: investor.address,
      mptIssuanceId: "",
      sharesAmount: "10",
      vestingCliffDate: cliffDate,
      cancelAfterDate: cancelDate,
    })

    expect(escrow.escrowSequence).toBeGreaterThan(0)
    expect(escrow.finishAfter).toBe(rippleTimeFromUnix(cliffDate.getTime() / 1000))

    const active = await getActiveEscrows(founder.address)
    expect(active.find((e) => e.sequence === escrow.escrowSequence)).toBeTruthy()

    await new Promise((r) => setTimeout(r, 8_000))

    const releaseTx = await releaseEscrow(investor, escrow)
    expect(releaseTx).toBeTruthy()
  }, 60_000)
})
