import { get, post, del } from "../api.js";
import { c, header, kv, error, success, table } from "../format.js";

interface MonitorStartResult {
  reportId: string;
  githubUrl: string;
  intervalMs: number;
  message: string;
}

interface MonitoredRepo {
  reportId: string;
  githubUrl: string;
  intervalMs: number;
  lastChecked: string | null;
}

/** lapis monitor start <report-id> [--interval <ms>] */
export async function monitorStart(args: string[]): Promise<void> {
  const reportId = args.find((a) => !a.startsWith("--"));
  const intervalIdx = args.indexOf("--interval");
  const intervalMs = intervalIdx !== -1 ? parseInt(args[intervalIdx + 1], 10) : undefined;

  if (!reportId) {
    console.log(error("usage: lapis monitor start <report-id> [--interval <ms>]"));
    process.exit(1);
  }

  const res = await post<MonitorStartResult>(`/monitor/${reportId}`, {
    ...(intervalMs ? { intervalMs } : {}),
  });

  if (!res.success || !res.data) {
    console.log(error(res.error ?? "failed to start monitor"));
    process.exit(1);
  }

  const d = res.data;
  console.log(success(`monitoring ${c.bold(d.githubUrl)}`));
  console.log(kv("report id", d.reportId));
  console.log(kv("interval", `${d.intervalMs}ms`));
}

/** lapis monitor stop <report-id> */
export async function monitorStop(reportId: string): Promise<void> {
  if (!reportId) {
    console.log(error("usage: lapis monitor stop <report-id>"));
    process.exit(1);
  }

  const res = await del<{ message: string }>(`/monitor/${reportId}`);
  if (!res.success) {
    console.log(error(res.error ?? "failed to stop monitor"));
    process.exit(1);
  }

  console.log(success("monitor stopped"));
}

/** lapis monitor list */
export async function monitorList(): Promise<void> {
  const res = await get<MonitoredRepo[]>("/monitor");
  if (!res.success || !res.data) {
    console.log(error(res.error ?? "failed to list monitors"));
    process.exit(1);
  }

  if (res.data.length === 0) {
    console.log(c.dim("  no active monitors"));
    return;
  }

  console.log(header("active monitors"));
  const rows = [
    [c.dim("report"), c.dim("repo"), c.dim("interval")],
    ...res.data.map((m) => [
      m.reportId.slice(0, 8),
      m.githubUrl,
      `${m.intervalMs}ms`,
    ]),
  ];
  console.log(table(rows));
  console.log("");
}

/** lapis monitor check <report-id> */
export async function monitorCheck(reportId: string): Promise<void> {
  if (!reportId) {
    console.log(error("usage: lapis monitor check <report-id>"));
    process.exit(1);
  }

  const res = await get<{ monitoring: boolean }>(`/monitor/${reportId}`);
  if (!res.success || !res.data) {
    console.log(error(res.error ?? "failed to check monitor"));
    process.exit(1);
  }

  if (res.data.monitoring) {
    console.log(success(`${reportId} is being monitored`));
  } else {
    console.log(c.dim(`  ${reportId} is not being monitored`));
  }
}
