Check the health of all Lapis services and print a dashboard.

## Steps

1. **Server health**: Hit `GET http://localhost:3001/health`. Report if server is up or down. If down, note that user should run `npm run dev:agent`.

2. **XRPL status**: Hit `GET http://localhost:3001/xrpl/status`. Display:
   - Network (testnet/devnet/mainnet)
   - Founder wallet address and XRP balance
   - Agent wallet address and XRP balance
   - RLUSD balances (both wallets)
   - Number of settlements

3. **Active monitors**: Hit `GET http://localhost:3001/monitor`. If any repos are being monitored, list them with their intervals and last scores.

4. **Environment check**: Read `packages/ai-agent/.env` and check which vars are set:
   - ANTHROPIC_API_KEY
   - GITHUB_TOKEN
   - FOUNDER_SEED
   - AGENT_SEED
   Don't print the actual values -- just whether they're set or missing.

5. **Print dashboard**: Format everything as a clean summary. Example:
   ```
   Lapis Status
   ==================
   Server:     UP (localhost:3001)
   XRPL:       testnet | founder: rXXX (85.2 XRP) | agent: rYYY (99.9 XRP)
   RLUSD:      founder: 0 | agent: 0
   Settlements: 2
   Monitors:   1 active (github.com/fastify/fastify every 30s, last score: 82)

   Env Vars:
     ANTHROPIC_API_KEY  ✓
     GITHUB_TOKEN       ✓
     FOUNDER_SEED       ✓
     AGENT_SEED         ✓
   ```

If the server is down, still check the env vars and report what you can.
