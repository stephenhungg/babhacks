import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { getClient, disconnect } from "../src/client.js"
import { fundWallet, generateWallet, getBalance } from "../src/wallet.js"
import { sendPayment, verifyPayment } from "../src/payments.js"

describe("payments (testnet)", () => {
  let sender: Awaited<ReturnType<typeof fundWallet>>["wallet"]
  let receiver: Awaited<ReturnType<typeof fundWallet>>["wallet"]

  beforeAll(async () => {
    const s = generateWallet()
    const r = generateWallet()
    const [sf, rf] = await Promise.all([fundWallet(s), fundWallet(r)])
    sender = sf.wallet
    receiver = rf.wallet
  }, 60_000)

  afterAll(async () => {
    await disconnect()
  })

  it("sends XRP and verifies delivered_amount", async () => {
    const hash = await sendPayment(sender, {
      destination: receiver.address,
      amountXRP: "1",
      destinationTag: 42,
    })

    const v = await verifyPayment(hash, receiver.address, "1", 42)
    expect(v.valid).toBe(true)
    expect(v.validated).toBe(true)
    expect(Number(v.deliveredXRP)).toBeGreaterThanOrEqual(1)
    expect(v.destinationTag).toBe(42)
  }, 30_000)

  it("rejects payment with wrong destination", async () => {
    const hash = await sendPayment(sender, {
      destination: receiver.address,
      amountXRP: "1",
    })

    const v = await verifyPayment(hash, sender.address, "1")
    expect(v.valid).toBe(false)
  }, 30_000)

  it("rejects payment below minimum amount", async () => {
    const hash = await sendPayment(sender, {
      destination: receiver.address,
      amountXRP: "0.05",
    })

    const v = await verifyPayment(hash, receiver.address, "1")
    expect(v.valid).toBe(false)
  }, 30_000)
})
