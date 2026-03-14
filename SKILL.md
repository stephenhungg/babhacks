# Lapis — Agent Skill

> 4 verbs to analyze startups, price them via prediction markets, monitor changes, and settle equity on XRPL.

**Base URL**: `http://localhost:3001` (override with `LAPIS_API` env var)

## Quick Start

```bash
# make sure the server is running
npm run dev:agent

# analyze a github repo
npm run lapis -- analyze https://github.com/expressjs/express

# or use curl
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"githubUrl": "https://github.com/expressjs/express"}'
```

## Capabilities

### 1. analyze — AI Startup Analysis

Submit a GitHub repo for AI-powered analysis. Returns scores for code quality, team strength, traction, social presence, and an overall score (0-10).

**Submit analysis** (fire-and-forget, returns immediately):
```bash
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"githubUrl": "https://github.com/owner/repo", "twitterHandle": "optional_handle"}'
# -> {"success": true, "data": {"id": "<report-id>", "status": "pending"}}
```

**Poll for scores** (check until status = "complete"):
```bash
curl http://localhost:3001/report/<report-id>/score
# -> {"success": true, "data": {"id": "...", "status": "complete", "scores": {...}}}
```

**Get full report**:
```bash
curl http://localhost:3001/report/<report-id>
# -> {"success": true, "data": {full ReportCard object}}
```

Status transitions: `pending` -> `scraping` -> `analyzing` -> `complete` (or `error`)

### 2. price — Prediction Markets

Open a market, place valuation bets, close to finalize consensus.

**Open market** (seeds with AI agent's valuation estimate):
```bash
curl -X POST http://localhost:3001/market/<report-id>
# -> {"success": true, "data": {ValuationMarket with agentValuation}}
```

**Place a bet**:
```bash
curl -X POST http://localhost:3001/market/<market-id>/bet \
  -H "Content-Type: application/json" \
  -d '{"userId": "alice", "valuation": 25, "amount": 100}'
# valuation = millions USD, amount = bet size in USD
# -> consensus updates as volume-weighted average
```

**Close market**:
```bash
curl -X POST http://localhost:3001/market/<market-id>/close
# -> {"success": true, "data": {ValuationMarket with final consensusValuation}}
```

**Check market**:
```bash
curl http://localhost:3001/market/<market-id>
```

### 3. monitor — Repo Monitoring

Watch a repo for changes and auto-reanalyze.

**Start monitoring**:
```bash
curl -X POST http://localhost:3001/monitor/<report-id> \
  -H "Content-Type: application/json" \
  -d '{"intervalMs": 60000}'
# default interval: 30000ms
```

**Stop monitoring**:
```bash
curl -X DELETE http://localhost:3001/monitor/<report-id>
```

**List all monitored repos**:
```bash
curl http://localhost:3001/monitor
```

**Check if monitored**:
```bash
curl http://localhost:3001/monitor/<report-id>
# -> {"success": true, "data": {"monitoring": true}}
```

### 4. issue — XRPL Equity Settlement

Settle a market on XRPL: issue MPT equity tokens, create vesting escrows, pay platform fees in RLUSD.

**Settle** (takes 30-60s on testnet):
```bash
curl -X POST http://localhost:3001/market/<market-id>/settle
# Requires FOUNDER_SEED and AGENT_SEED env vars on server
# -> SettlementResult with MPT issuance, escrows, explorer links
```

**Release vesting escrow**:
```bash
curl -X POST http://localhost:3001/xrpl/escrow/<market-id>/release \
  -H "Authorization: Bearer <AGENT_SEED>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "alice"}'
# -> {"success": true, "data": {"txHash": "...", "sharesReleased": "..."}}
```

**XRPL status** (wallets, balances, past settlements):
```bash
curl http://localhost:3001/xrpl/status
```

## Full Workflow Example

```bash
# 1. analyze
REPORT=$(curl -s -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"githubUrl": "https://github.com/expressjs/express"}' | jq -r '.data.id')

# 2. wait for completion
while true; do
  STATUS=$(curl -s http://localhost:3001/report/$REPORT/score | jq -r '.data.status')
  echo "status: $STATUS"
  [ "$STATUS" = "complete" ] && break
  sleep 3
done

# 3. open market
MARKET=$(curl -s -X POST http://localhost:3001/market/$REPORT | jq -r '.data.id')

# 4. place bets
curl -s -X POST http://localhost:3001/market/$MARKET/bet \
  -H "Content-Type: application/json" \
  -d '{"userId": "alice", "valuation": 20, "amount": 100}'

curl -s -X POST http://localhost:3001/market/$MARKET/bet \
  -H "Content-Type: application/json" \
  -d '{"userId": "bob", "valuation": 30, "amount": 200}'

# 5. settle on XRPL
curl -s -X POST http://localhost:3001/market/$MARKET/settle | jq .
```

## Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... }
}
```

On error:
```json
{
  "success": false,
  "error": "description of what went wrong"
}
```

## Data Types

### ReportScores
```json
{
  "codeQuality": 7.5,
  "teamStrength": 8.0,
  "traction": 6.5,
  "socialPresence": 5.0,
  "overall": 7.2
}
```

### ValuationMarket
```json
{
  "id": "market-uuid",
  "reportId": "report-uuid",
  "githubUrl": "https://github.com/...",
  "status": "open|closed",
  "bets": [{"userId": "alice", "valuation": 20, "amount": 100, "timestamp": "..."}],
  "consensusValuation": 25.0,
  "agentValuation": 22.5,
  "agentConfidence": 0.75,
  "openedAt": "ISO date",
  "closedAt": "ISO date|null"
}
```

### SettlementResult
```json
{
  "marketId": "...",
  "companyName": "express",
  "consensusValuationM": 25.0,
  "valuationCapXRP": "50000000",
  "equityToken": {"mptIssuanceId": "...", "totalShares": "10000000"},
  "escrows": [{"userId": "alice", "xrplAddress": "r...", "sharesAllocated": "...", "explorerLink": "..."}],
  "explorerLinks": ["https://testnet.xrpl.org/..."],
  "settledAt": "ISO date"
}
```

## Error Handling

| Error | Meaning |
|-------|---------|
| `ECONNREFUSED` | Server not running — `npm run dev:agent` |
| `"report not found"` | Invalid report ID |
| `"market not found"` | Invalid market ID |
| `"report not complete"` | Analysis still running — poll `/report/:id/score` |
| `"market already closed"` | Can't bet on closed market |
| `"FOUNDER_SEED or AGENT_SEED not configured"` | Set env vars for XRPL settlement |
| `tecPATH_DRY` | RLUSD payment failed (expected on testnet — no RLUSD balance) |

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `LAPIS_API` | `http://localhost:3001` | API base URL |
| `AGENT_SEED` | — | Required for escrow release auth |
