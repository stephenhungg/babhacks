import { get, post } from "../api.js";
import { c, header, kv, error, success, fmtM, fmtDate, table } from "../format.js";

interface MarketBet {
  userId: string;
  valuation: number;
  amount: number;
  timestamp: string;
}

interface ValuationMarket {
  id: string;
  reportId: string;
  githubUrl: string;
  status: string;
  bets: MarketBet[];
  consensusValuation: number | null;
  openedAt: string;
  closedAt: string | null;
  agentValuation: number | null;
  agentConfidence: number | null;
}

function printMarket(m: ValuationMarket): void {
  console.log(header(`market: ${m.githubUrl}`));
  console.log(kv("id", m.id));
  console.log(kv("report", m.reportId));
  console.log(kv("status", m.status === "open" ? c.green(m.status) : c.yellow(m.status)));
  console.log(kv("opened", fmtDate(m.openedAt)));
  if (m.closedAt) console.log(kv("closed", fmtDate(m.closedAt)));
  console.log(kv("agent valuation", fmtM(m.agentValuation)));
  if (m.agentConfidence != null) console.log(kv("agent confidence", `${(m.agentConfidence * 100).toFixed(0)}%`));
  console.log(kv("consensus", fmtM(m.consensusValuation)));

  if (m.bets.length > 0) {
    console.log(header("bets"));
    const rows = [
      [c.dim("user"), c.dim("valuation"), c.dim("amount"), c.dim("time")],
      ...m.bets.map((b) => [
        b.userId,
        fmtM(b.valuation),
        `$${b.amount}`,
        fmtDate(b.timestamp),
      ]),
    ];
    console.log(table(rows));
  }
  console.log("");
}

/** lapis price open <report-id> */
export async function priceOpen(reportId: string): Promise<void> {
  if (!reportId) {
    console.log(error("usage: lapis price open <report-id>"));
    process.exit(1);
  }

  const res = await post<ValuationMarket>(`/market/${reportId}`);
  if (!res.success || !res.data) {
    console.log(error(res.error ?? "failed to open market"));
    process.exit(1);
  }

  console.log(success("market opened"));
  printMarket(res.data);
}

/** lapis price bet <market-id> --user <id> --valuation <M> --amount <usd> */
export async function priceBet(args: string[]): Promise<void> {
  const marketId = args.find((a) => !a.startsWith("--"));
  const getFlag = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const userId = getFlag("--user");
  const valuation = getFlag("--valuation");
  const amount = getFlag("--amount");

  if (!marketId || !userId || !valuation || !amount) {
    console.log(error("usage: lapis price bet <market-id> --user <id> --valuation <M> --amount <usd>"));
    process.exit(1);
  }

  const res = await post<ValuationMarket>(`/market/${marketId}/bet`, {
    userId,
    valuation: parseFloat(valuation),
    amount: parseFloat(amount),
  });

  if (!res.success || !res.data) {
    console.log(error(res.error ?? "failed to place bet"));
    process.exit(1);
  }

  console.log(success(`bet placed — consensus now ${fmtM(res.data.consensusValuation)}`));
  printMarket(res.data);
}

/** lapis price close <market-id> */
export async function priceClose(marketId: string): Promise<void> {
  if (!marketId) {
    console.log(error("usage: lapis price close <market-id>"));
    process.exit(1);
  }

  const res = await post<ValuationMarket>(`/market/${marketId}/close`);
  if (!res.success || !res.data) {
    console.log(error(res.error ?? "failed to close market"));
    process.exit(1);
  }

  console.log(success(`market closed — final consensus: ${fmtM(res.data.consensusValuation)}`));
  printMarket(res.data);
}

/** lapis price check <market-id> */
export async function priceCheck(marketId: string): Promise<void> {
  if (!marketId) {
    console.log(error("usage: lapis price check <market-id>"));
    process.exit(1);
  }

  const res = await get<ValuationMarket>(`/market/${marketId}`);
  if (!res.success || !res.data) {
    console.log(error(res.error ?? "market not found"));
    process.exit(1);
  }

  printMarket(res.data);
}
