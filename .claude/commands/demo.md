Run the full Lapis demo end-to-end: analyze a GitHub repo, open a prediction market, place bets, and optionally settle on XRPL.

Use this GitHub URL: $ARGUMENTS (if empty, default to https://github.com/expressjs/express)

## Steps

1. **Check server**: Hit `GET http://localhost:3001/health`. If it's not running, tell the user to run `npm run dev:agent` in another terminal and wait for them to confirm.

2. **Submit analysis**: `POST http://localhost:3001/analyze` with the GitHub URL. Print the report ID.

3. **Poll for completion**: Hit `GET http://localhost:3001/report/:id/score` every 5 seconds. Print status updates. Wait until status is "complete" or "error". If error, show it and stop.

4. **Show scores**: Print the scores (codeQuality, teamStrength, traction, socialPresence, overall) and summary.

5. **Open prediction market**: `POST http://localhost:3001/market/:reportId`. Print the agent's seed valuation.

6. **Place sample bets**: Place 3 bets to simulate crowd pricing:
   - Alice: $100 at a valuation 20% above agent's estimate
   - Bob: $200 at a valuation 30% below agent's estimate
   - Charlie: $50 at a valuation 50% above agent's estimate
   Print the consensus valuation after each bet.

7. **Check XRPL**: Hit `GET http://localhost:3001/xrpl/status`. If wallets are configured (`configured: true`), ask the user if they want to settle on XRPL. If wallets are not configured, skip settlement and tell the user to run `/setup` first.

8. **Settle on XRPL** (if confirmed): `POST http://localhost:3001/market/:marketId/settle`. This takes 30-60 seconds. Print:
   - MPT issuance ID
   - Number of escrows created
   - RLUSD trust line hash
   - Explorer links
   - Final consensus valuation

9. **Summary**: Print a recap of the full flow showing how the data moved from GitHub -> AI -> market -> XRPL.
