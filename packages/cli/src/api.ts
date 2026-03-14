// Fetch wrapper for the Lapis API — zero deps

export const BASE_URL = process.env.LAPIS_API ?? "http://localhost:3001";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function api<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
  opts?: { timeoutMs?: number; headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;
  const { timeoutMs = 30_000, headers = {} } = opts ?? {};

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const json = (await res.json()) as ApiResponse<T>;
    return json;
  } catch (err: unknown) {
    if (err instanceof TypeError && (err as NodeJS.ErrnoException).cause) {
      const cause = (err as NodeJS.ErrnoException).cause as NodeJS.ErrnoException;
      if (cause.code === "ECONNREFUSED") {
        return {
          success: false,
          error: `server not running at ${BASE_URL} — run: npm run dev:agent`,
        };
      }
    }
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return { success: false, error: `request timed out after ${timeoutMs}ms` };
    }
    return { success: false, error: String(err) };
  }
}

export function get<T>(path: string, opts?: { timeoutMs?: number; headers?: Record<string, string> }) {
  return api<T>("GET", path, undefined, opts);
}

export function post<T>(path: string, body?: Record<string, unknown>, opts?: { timeoutMs?: number; headers?: Record<string, string> }) {
  return api<T>("POST", path, body, opts);
}

export function del<T>(path: string, opts?: { timeoutMs?: number; headers?: Record<string, string> }) {
  return api<T>("DELETE", path, undefined, opts);
}
