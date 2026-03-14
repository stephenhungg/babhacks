import "dotenv/config"
import { generateWallet, fundWallet, getBalance } from "../src/wallet.js"
import { disconnect } from "../src/client.js"
import fs from "fs"
import path from "path"

async function main() {
  console.log("🚀 Lapis — XRPL Testnet Setup\n")

  console.log("Generating wallets...")
  const founder = generateWallet()
  const investor1 = generateWallet()
  const investor2 = generateWallet()

  console.log("Funding via testnet faucet (this takes ~10s)...")
  const [f, i1, i2] = await Promise.all([
    fundWallet(founder),
    fundWallet(investor1),
    fundWallet(investor2),
  ])

  console.log("\n✅ Wallets funded on testnet:\n")

  console.log("FOUNDER")
  console.log(`  Address : ${f.wallet.address}`)
  console.log(`  Seed    : ${f.wallet.seed}`)
  console.log(`  Balance : ${f.balance} XRP`)

  console.log("\nINVESTOR 1")
  console.log(`  Address : ${i1.wallet.address}`)
  console.log(`  Seed    : ${i1.wallet.seed}`)
  console.log(`  Balance : ${i1.balance} XRP`)

  console.log("\nINVESTOR 2")
  console.log(`  Address : ${i2.wallet.address}`)
  console.log(`  Seed    : ${i2.wallet.seed}`)
  console.log(`  Balance : ${i2.balance} XRP`)

  const envPath = path.resolve(process.cwd(), ".env")
  const envContent = `# XRPL Network
XRPL_NETWORK=testnet
XRPL_WS_URL=wss://s.altnet.rippletest.net:51233

# Founder wallet
FOUNDER_SEED=${f.wallet.seed}
FOUNDER_ADDRESS=${f.wallet.address}

# Investor wallets
INVESTOR1_SEED=${i1.wallet.seed}
INVESTOR1_ADDRESS=${i1.wallet.address}

INVESTOR2_SEED=${i2.wallet.seed}
INVESTOR2_ADDRESS=${i2.wallet.address}

# Populated after demo run
MPT_ISSUANCE_ID=
ESCROW_SEQUENCE=
`

  fs.writeFileSync(envPath, envContent)
  console.log(`\n✅ Credentials written to .env`)
  console.log(`\n🔗 View on testnet explorer:`)
  console.log(`   https://testnet.xrpl.org/accounts/${f.wallet.address}`)
  console.log(`   https://testnet.xrpl.org/accounts/${i1.wallet.address}`)
  console.log(`   https://testnet.xrpl.org/accounts/${i2.wallet.address}`)

  await disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
