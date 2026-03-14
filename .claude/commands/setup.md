Walk through the first-time setup for Lapis. Check each step and fix what you can automatically.

## Steps

1. **Check node_modules**: If `node_modules/` doesn't exist at repo root, run `npm install`.

2. **Check .env files**:
   - If `packages/ai-agent/.env` doesn't exist, copy from `packages/ai-agent/.env.example`
   - If `packages/xrpl-contracts/.env` doesn't exist, copy from `packages/xrpl-contracts/.env.example`

3. **Check API keys** in `packages/ai-agent/.env`:
   - `ANTHROPIC_API_KEY` -- must be set and not contain "your_key_here". If missing, ask the user to provide it.
   - `GITHUB_TOKEN` -- must be set and not contain "your_token_here". If missing, ask the user to provide it.

4. **Build**: Run `npm run build` from the repo root. This compiles shared types that ai-agent depends on.

5. **Check XRPL wallets** in `packages/ai-agent/.env`:
   - Check if `FOUNDER_SEED` and `AGENT_SEED` are set (not placeholder values)
   - If missing, tell the user: "XRPL wallets not configured. Run `cd packages/xrpl-contracts && npm run setup` to generate testnet wallets, then copy FOUNDER_SEED and AGENT_SEED to packages/ai-agent/.env"

6. **Print summary**: Show a table of what's configured and what's missing. Example:
   ```
   ANTHROPIC_API_KEY  ✓ set
   GITHUB_TOKEN       ✓ set
   FOUNDER_SEED       ✗ missing (XRPL settlement won't work)
   AGENT_SEED         ✗ missing (XRPL settlement won't work)
   Build              ✓ clean
   ```

7. If everything is set, tell the user: "You're good to go. Run `npm run dev:agent` to start the server."
