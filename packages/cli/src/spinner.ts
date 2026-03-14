// Polling spinner — zero deps

const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface Spinner {
  update(msg: string): void;
  stop(msg?: string): void;
}

export function createSpinner(initialMsg: string): Spinner {
  let i = 0;
  let msg = initialMsg;

  const interval = setInterval(() => {
    process.stderr.write(`\r\x1b[K  ${frames[i % frames.length]} ${msg}`);
    i++;
  }, 80);

  return {
    update(newMsg: string) {
      msg = newMsg;
    },
    stop(finalMsg?: string) {
      clearInterval(interval);
      process.stderr.write("\r\x1b[K");
      if (finalMsg) {
        console.log(finalMsg);
      }
    },
  };
}

/** Poll a URL until a condition is met */
export async function poll<T>(
  fn: () => Promise<T>,
  isDone: (data: T) => boolean,
  opts: { intervalMs?: number; timeoutMs?: number; onTick?: (data: T) => void } = {}
): Promise<T> {
  const { intervalMs = 3000, timeoutMs = 300_000, onTick } = opts;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await fn();
    onTick?.(result);
    if (isDone(result)) return result;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("polling timed out");
}
