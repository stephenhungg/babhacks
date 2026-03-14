#!/usr/bin/env npx tsx

import { c, error } from "./format.js";
import { analyze, analyzeStatus, analyzeReport } from "./commands/analyze.js";
import { priceOpen, priceBet, priceClose, priceCheck } from "./commands/price.js";
import { monitorStart, monitorStop, monitorList, monitorCheck } from "./commands/monitor.js";
import { issueSettle, issueRelease, issueStatus } from "./commands/issue.js";
import { health } from "./commands/health.js";

const HELP = `
${c.bold("lapis")} — Lapis CLI

${c.cyan("usage:")} lapis <command> [subcommand] [args]

${c.bold("commands:")}

  ${c.green("analyze")} <github-url> [--twitter <handle>]   analyze a startup
  ${c.green("analyze")} status <report-id>                   check analysis status
  ${c.green("analyze")} report <report-id>                   full report card

  ${c.green("price")} open <report-id>                       open prediction market
  ${c.green("price")} bet <market-id> --user <id> --valuation <M> --amount <usd>
  ${c.green("price")} close <market-id>                      close + finalize consensus
  ${c.green("price")} check <market-id>                      get market data

  ${c.green("monitor")} start <report-id> [--interval <ms>]  start watching
  ${c.green("monitor")} stop <report-id>                     stop watching
  ${c.green("monitor")} list                                  list all monitored
  ${c.green("monitor")} check <report-id>                    check if monitored

  ${c.green("issue")} settle <market-id>                     settle on XRPL (30-60s)
  ${c.green("issue")} release <market-id> --user <id>        release vesting escrow
  ${c.green("issue")} status                                 XRPL wallets + settlements

  ${c.green("health")}                                       server health check

${c.dim("env: LAPIS_API (default: http://localhost:3001)")}
${c.dim("     AGENT_SEED (required for escrow release)")}
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const sub = args[1];
  const rest = args.slice(2);

  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(HELP);
    return;
  }

  try {
    switch (cmd) {
      case "health":
        await health();
        break;

      case "analyze":
        if (sub === "status") {
          await analyzeStatus(rest[0]);
        } else if (sub === "report") {
          await analyzeReport(rest[0]);
        } else {
          // sub is the github url, rest of args after it
          await analyze(args.slice(1));
        }
        break;

      case "price":
        if (sub === "open") {
          await priceOpen(rest[0]);
        } else if (sub === "bet") {
          await priceBet(rest);
        } else if (sub === "close") {
          await priceClose(rest[0]);
        } else if (sub === "check") {
          await priceCheck(rest[0]);
        } else {
          console.log(error(`unknown subcommand: price ${sub ?? ""}`));
          console.log(c.dim("  try: open, bet, close, check"));
          process.exit(1);
        }
        break;

      case "monitor":
        if (sub === "start") {
          await monitorStart(rest);
        } else if (sub === "stop") {
          await monitorStop(rest[0]);
        } else if (sub === "list") {
          await monitorList();
        } else if (sub === "check") {
          await monitorCheck(rest[0]);
        } else {
          console.log(error(`unknown subcommand: monitor ${sub ?? ""}`));
          console.log(c.dim("  try: start, stop, list, check"));
          process.exit(1);
        }
        break;

      case "issue":
        if (sub === "settle") {
          await issueSettle(rest[0]);
        } else if (sub === "release") {
          await issueRelease(rest);
        } else if (sub === "status") {
          await issueStatus();
        } else {
          console.log(error(`unknown subcommand: issue ${sub ?? ""}`));
          console.log(c.dim("  try: settle, release, status"));
          process.exit(1);
        }
        break;

      default:
        console.log(error(`unknown command: ${cmd}`));
        console.log(c.dim("  run lapis --help for usage"));
        process.exit(1);
    }
  } catch (err) {
    console.log(error(String(err)));
    process.exit(1);
  }
}

main();
