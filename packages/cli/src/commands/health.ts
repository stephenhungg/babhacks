import { get } from "../api.js";
import { c, success, error } from "../format.js";

export async function health(): Promise<void> {
  const res = await get<{ status: string; timestamp: string }>("/health");

  if (!res.success || !res.data) {
    console.log(error(res.error ?? "health check failed"));
    process.exit(1);
  }

  console.log(success(`server is up — ${c.dim(res.data.timestamp)}`));
}
