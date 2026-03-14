import { get, post } from "../api.js";
import { c, header, kv, error, success, warn, fmtM, fmtDate, table } from "../format.js";
import { createSpinner } from "../spinner.js";

interface ParticipantEscrow {
  userId: string;
  xrplAddress: string;
  sharesAllocated: string;
  explorerLink: string;
  escrow: {
    escrowSequence: number;
    finishAfter: number | null;
    cancelAfter: number | null;
  };
}

interface SettlementResult {
  marketId: string;
  reportId: string;
  companyName: string;
  consensusValuationM: number;
  valuationCapXRP: string;
  equityToken: {
    mptIssuanceId: string;
    founderAddress: string;
    companyName: string;
    totalShares: string;
  };
  escrows: ParticipantEscrow[];
  rlusdFeeHash: string | null;
  rlusdTrustLineHash: string | null;
  settledAt: string;
  explorerLinks: string[];
}

interface XrplStatus {
  configured: boolean;
  network: string;
  wallets: Record<string, unknown>;
  settlementCount: number;
  settlements: SettlementResult[];
}

function printSettlement(s: SettlementResult): void {
  console.log(header(`settlement: ${s.companyName}`));
  console.log(kv("market", s.marketId));
  console.log(kv("report", s.reportId));
  console.log(kv("consensus", fmtM(s.consensusValuationM)));
  console.log(kv("valuation cap", `${s.valuationCapXRP} XRP`));
  console.log(kv("settled", fmtDate(s.settledAt)));

  console.log(header("equity token (MPT)"));
  console.log(kv("issuance id", s.equityToken.mptIssuanceId));
  console.log(kv("founder", s.equityToken.founderAddress));
  console.log(kv("total shares", s.equityToken.totalShares));

  if (s.escrows.length > 0) {
    console.log(header("vesting escrows"));
    const rows = [
      [c.dim("user"), c.dim("shares"), c.dim("xrpl address")],
      ...s.escrows.map((e) => [
        e.userId,
        e.sharesAllocated,
        e.xrplAddress.slice(0, 12) + "...",
      ]),
    ];
    console.log(table(rows));
  }

  if (s.rlusdFeeHash) console.log(kv("rlusd fee tx", s.rlusdFeeHash));
  if (s.rlusdTrustLineHash) console.log(kv("rlusd trust line", s.rlusdTrustLineHash));

  if (s.explorerLinks.length > 0) {
    console.log(header("explorer links"));
    s.explorerLinks.forEach((link) => console.log(`  ${c.blue(link)}`));
  }
  console.log("");
}

/** lapis issue settle <market-id> */
export async function issueSettle(marketId: string): Promise<void> {
  if (!marketId) {
    console.log(error("usage: lapis issue settle <market-id>"));
    process.exit(1);
  }

  console.log(warn("settlement takes 30-60s on testnet — hang tight"));
  const spinner = createSpinner("settling on XRPL...");

  const res = await post<SettlementResult>(`/market/${marketId}/settle`, undefined, {
    timeoutMs: 120_000,
  });

  spinner.stop();

  if (!res.success || !res.data) {
    console.log(error(res.error ?? "settlement failed"));
    process.exit(1);
  }

  console.log(success("settled on XRPL"));
  printSettlement(res.data);
}

/** lapis issue release <market-id> --user <id> */
export async function issueRelease(args: string[]): Promise<void> {
  const marketId = args.find((a) => !a.startsWith("--"));
  const userIdx = args.indexOf("--user");
  const userId = userIdx !== -1 ? args[userIdx + 1] : undefined;

  if (!marketId || !userId) {
    console.log(error("usage: lapis issue release <market-id> --user <id>"));
    process.exit(1);
  }

  const agentSeed = process.env.AGENT_SEED;
  if (!agentSeed) {
    console.log(error("AGENT_SEED env var required for escrow release"));
    process.exit(1);
  }

  const res = await post<{
    txHash: string;
    userId: string;
    sharesReleased: string;
    beneficiary: string;
  }>(`/xrpl/escrow/${marketId}/release`, { userId }, {
    headers: { Authorization: `Bearer ${agentSeed}` },
  });

  if (!res.success || !res.data) {
    console.log(error(res.error ?? "escrow release failed"));
    process.exit(1);
  }

  const d = res.data;
  console.log(success(`escrow released for ${d.userId}`));
  console.log(kv("tx hash", d.txHash));
  console.log(kv("shares released", d.sharesReleased));
  console.log(kv("beneficiary", d.beneficiary));
}

/** lapis issue status */
export async function issueStatus(): Promise<void> {
  const res = await get<XrplStatus>("/xrpl/status");
  if (!res.success || !res.data) {
    console.log(error(res.error ?? "failed to get XRPL status"));
    process.exit(1);
  }

  const d = res.data;
  console.log(header("XRPL status"));
  console.log(kv("configured", d.configured ? c.green("yes") : c.red("no")));
  console.log(kv("network", d.network));
  console.log(kv("settlements", String(d.settlementCount)));

  if (Object.keys(d.wallets).length > 0) {
    console.log(header("wallets"));
    for (const [name, info] of Object.entries(d.wallets)) {
      console.log(kv(name, JSON.stringify(info)));
    }
  }

  if (d.settlements.length > 0) {
    for (const s of d.settlements) {
      printSettlement(s);
    }
  }
}
