import type { Key } from "./i18n";
import type { LogEntry } from "./store";

/** Turn a stored log entry into display text (money, terms and pot names translated). */
export function logText(
  e: LogEntry,
  t: (k: Key, p?: Record<string, string | number>) => string,
  m: (n: number) => string,
) {
  const p: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(e.p ?? {})) {
    if (e.money?.includes(k)) p[k] = m(Number(v));
    else if (k === "term") p[k] = t(`term.${v}` as Key);
    else if (k === "pot") p[k] = t(v as Key);
    else p[k] = v;
  }
  return t(e.key, p);
}
