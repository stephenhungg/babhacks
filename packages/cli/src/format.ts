// ANSI color helpers — zero deps

const esc = (code: string) => `\x1b[${code}m`;
const reset = esc("0");

export const c = {
  bold: (s: string) => `${esc("1")}${s}${reset}`,
  dim: (s: string) => `${esc("2")}${s}${reset}`,
  red: (s: string) => `${esc("31")}${s}${reset}`,
  green: (s: string) => `${esc("32")}${s}${reset}`,
  yellow: (s: string) => `${esc("33")}${s}${reset}`,
  blue: (s: string) => `${esc("34")}${s}${reset}`,
  magenta: (s: string) => `${esc("35")}${s}${reset}`,
  cyan: (s: string) => `${esc("36")}${s}${reset}`,
  gray: (s: string) => `${esc("90")}${s}${reset}`,
};

/** Score bar: [████████░░] 8.2 */
export function scoreBar(label: string, value: number, max = 10, width = 20): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  let colorFn = c.red;
  if (value >= 7) colorFn = c.green;
  else if (value >= 5) colorFn = c.yellow;

  return `  ${label.padEnd(18)} ${colorFn(bar)} ${c.bold(value.toFixed(1))}`;
}

/** Print a labeled key-value pair */
export function kv(key: string, value: string | number | null | undefined): string {
  return `  ${c.dim(key.padEnd(18))} ${value ?? c.dim("n/a")}`;
}

/** Section header */
export function header(text: string): string {
  return `\n${c.bold(c.cyan(`── ${text} ──`))}`;
}

/** Error message */
export function error(msg: string): string {
  return `${c.red("error:")} ${msg}`;
}

/** Success message */
export function success(msg: string): string {
  return `${c.green("✓")} ${msg}`;
}

/** Warning message */
export function warn(msg: string): string {
  return `${c.yellow("!")} ${msg}`;
}

/** Format millions nicely */
export function fmtM(val: number | null | undefined): string {
  if (val == null) return c.dim("n/a");
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}B`;
  return `$${val.toFixed(1)}M`;
}

/** Format a date string */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return c.dim("n/a");
  return new Date(iso).toLocaleString();
}

/** Simple table from rows */
export function table(rows: string[][]): string {
  if (rows.length === 0) return "";
  const cols = rows[0].length;
  const widths: number[] = [];
  for (let i = 0; i < cols; i++) {
    widths.push(Math.max(...rows.map((r) => stripAnsi(r[i] ?? "").length)));
  }
  return rows
    .map((row) =>
      row.map((cell, i) => {
        const pad = widths[i] - stripAnsi(cell).length;
        return cell + " ".repeat(Math.max(0, pad));
      }).join("  ")
    )
    .join("\n");
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}
