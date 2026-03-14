import { get, post } from "../api.js";
import { c, header, scoreBar, kv, error, success, fmtDate } from "../format.js";
import { createSpinner, poll } from "../spinner.js";

interface ScoreResponse {
  id: string;
  status: string;
  scores: Record<string, number> | null;
  error: string | null;
}

interface ReportCard {
  id: string;
  githubUrl: string;
  status: string;
  scores: Record<string, number> | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  adversarialReport: {
    redFlags: { flag: string; reason: string; severity: string }[];
    overallAssessment: string;
    trustScore: number;
  } | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

/** lapis analyze <github-url> [--twitter <handle>] */
export async function analyze(args: string[]): Promise<void> {
  const githubUrl = args.find((a) => !a.startsWith("--"));
  const twitterIdx = args.indexOf("--twitter");
  const twitterHandle = twitterIdx !== -1 ? args[twitterIdx + 1] : undefined;

  if (!githubUrl) {
    console.log(error("usage: lapis analyze <github-url> [--twitter <handle>]"));
    process.exit(1);
  }

  // submit analysis
  const submit = await post<{ id: string; status: string }>("/analyze", {
    githubUrl,
    ...(twitterHandle ? { twitterHandle } : {}),
  });

  if (!submit.success || !submit.data) {
    console.log(error(submit.error ?? "failed to submit analysis"));
    process.exit(1);
  }

  const { id } = submit.data;
  console.log(`${success("submitted")} ${c.dim(`id: ${id}`)}`);

  // auto-poll
  const spinner = createSpinner("analyzing...");
  let lastStatus = "";

  const result = await poll<ScoreResponse>(
    () => get<ScoreResponse>(`/report/${id}/score`).then((r) => r.data!),
    (data) => data.status === "complete" || data.status === "error",
    {
      intervalMs: 3000,
      timeoutMs: 300_000,
      onTick(data) {
        if (data.status !== lastStatus) {
          lastStatus = data.status;
          spinner.update(`${data.status}...`);
        }
      },
    }
  );

  spinner.stop();

  if (result.status === "error") {
    console.log(error(result.error ?? "analysis failed"));
    process.exit(1);
  }

  // print scores
  console.log(header("scores"));
  if (result.scores) {
    console.log(scoreBar("code quality", result.scores.codeQuality));
    console.log(scoreBar("team strength", result.scores.teamStrength));
    console.log(scoreBar("traction", result.scores.traction));
    console.log(scoreBar("social presence", result.scores.socialPresence));
    console.log(scoreBar("overall", result.scores.overall));
  }

  console.log(`\n${c.dim(`full report: lapis analyze report ${id}`)}`);
}

/** lapis analyze status <report-id> */
export async function analyzeStatus(reportId: string): Promise<void> {
  if (!reportId) {
    console.log(error("usage: lapis analyze status <report-id>"));
    process.exit(1);
  }

  const res = await get<ScoreResponse>(`/report/${reportId}/score`);
  if (!res.success || !res.data) {
    console.log(error(res.error ?? "not found"));
    process.exit(1);
  }

  const { data } = res;
  console.log(kv("id", data.id));
  console.log(kv("status", data.status));

  if (data.scores) {
    console.log(header("scores"));
    console.log(scoreBar("code quality", data.scores.codeQuality));
    console.log(scoreBar("team strength", data.scores.teamStrength));
    console.log(scoreBar("traction", data.scores.traction));
    console.log(scoreBar("social presence", data.scores.socialPresence));
    console.log(scoreBar("overall", data.scores.overall));
  }

  if (data.error) {
    console.log(`\n${error(data.error)}`);
  }
}

/** lapis analyze report <report-id> */
export async function analyzeReport(reportId: string): Promise<void> {
  if (!reportId) {
    console.log(error("usage: lapis analyze report <report-id>"));
    process.exit(1);
  }

  const res = await get<ReportCard>(`/report/${reportId}`);
  if (!res.success || !res.data) {
    console.log(error(res.error ?? "not found"));
    process.exit(1);
  }

  const r = res.data;
  console.log(header(`report: ${r.githubUrl}`));
  console.log(kv("id", r.id));
  console.log(kv("status", r.status));
  console.log(kv("created", fmtDate(r.createdAt)));
  console.log(kv("completed", fmtDate(r.completedAt)));

  if (r.scores) {
    console.log(header("scores"));
    console.log(scoreBar("code quality", r.scores.codeQuality));
    console.log(scoreBar("team strength", r.scores.teamStrength));
    console.log(scoreBar("traction", r.scores.traction));
    console.log(scoreBar("social presence", r.scores.socialPresence));
    console.log(scoreBar("overall", r.scores.overall));
  }

  if (r.summary) {
    console.log(header("summary"));
    console.log(`  ${r.summary}`);
  }

  if (r.strengths?.length) {
    console.log(header("strengths"));
    r.strengths.forEach((s) => console.log(`  ${c.green("+")} ${s}`));
  }

  if (r.weaknesses?.length) {
    console.log(header("weaknesses"));
    r.weaknesses.forEach((w) => console.log(`  ${c.red("-")} ${w}`));
  }

  if (r.adversarialReport) {
    const ar = r.adversarialReport;
    console.log(header("adversarial audit"));
    console.log(kv("trust score", `${ar.trustScore}/10`));
    console.log(`  ${ar.overallAssessment}`);
    if (ar.redFlags?.length) {
      console.log("");
      for (const flag of ar.redFlags) {
        const sev =
          flag.severity === "critical" ? c.red("CRITICAL") :
          flag.severity === "warning" ? c.yellow("WARNING") :
          c.dim("INFO");
        console.log(`  [${sev}] ${flag.flag}`);
        console.log(`  ${c.dim(flag.reason)}`);
      }
    }
  }

  console.log("");
}
