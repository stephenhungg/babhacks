import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { disconnect } from "../src/client.js"
import { fundWallet, generateWallet } from "../src/wallet.js"
import {
  issueEquityToken,
  authorizeHolder,
  holderOptIn,
  transferEquityShares,
  getMptHoldings,
} from "../src/mpt.js"

describe("MPT equity tokens (testnet)", () => {
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

  it("issues equity MPT with required flags", async () => {
    const token = await issueEquityToken(founder, {
      founderAddress: founder.address,
      companyName: "TestStartup",
      valuationCapXRP: "8000000",
      totalEquityShares: "1000000",
      transferable: false,
      royaltyBps: 500,
    })

    expect(token.mptIssuanceId).toBeTruthy()
    expect(token.companyName).toBe("TestStartup")
    expect(token.royaltyBps).toBe(500)
    expect(token.transferable).toBe(false)
  }, 30_000)

  it("authorizes holder and transfers shares", async () => {
    const token = await issueEquityToken(founder, {
      founderAddress: founder.address,
      companyName: "TestStartup2",
      valuationCapXRP: "5000000",
      totalEquityShares: "500000",
      transferable: false,
      royaltyBps: 0,
    })

    await authorizeHolder(founder, token.mptIssuanceId, investor.address)
    await holderOptIn(investor, token.mptIssuanceId)
    await transferEquityShares(founder, token.mptIssuanceId, investor.address, "10000")

    const holdings = await getMptHoldings(investor.address, token.mptIssuanceId)
    expect(holdings.length).toBeGreaterThan(0)
  }, 60_000)
})
