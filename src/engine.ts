// Pure simulation rules. No React, no storage — tested in engine.test.ts.

export type Sector = "private" | "government";
export type Risk = "cautious" | "balanced" | "growth";
export type Path = "safety" | "hybrid" | "direct";
export type Term = 3 | 6 | 12;

export interface Persona {
  id: "ahmed" | "fatima";
  sector: Sector;
  salary: number;
  essentials: number; // rent, bills, groceries
  other: number; // discretionary spending
}

export const PERSONAS: Persona[] = [
  { id: "ahmed", sector: "private", salary: 1200, essentials: 650, other: 250 },
  { id: "fatima", sector: "government", salary: 1000, essentials: 550, other: 200 },
];

/** Months of expenses the emergency fund should cover. */
export const TARGET_MONTHS: Record<Sector, number> = { private: 6, government: 3 };

/** Illustrative annual profit rates per Sukuk term. Not real market rates. */
export const SUKUK_RATE: Record<Term, number> = { 3: 0.045, 6: 0.05, 12: 0.055 };
export const TERM_FOR_RISK: Record<Risk, Term> = { cautious: 3, balanced: 6, growth: 12 };
export const SUKUK_MIN = 100;
/** Example nisab in BD. The real figure follows the gold price and the Sharia board. */
export const NISAB_EXAMPLE = 2500;

export const emergencyTarget = (p: { sector: Sector; essentials: number; other: number }) =>
  TARGET_MONTHS[p.sector] * (p.essentials + p.other);

/** Months to fill the emergency target at a fixed monthly amount. */
export const monthsToTarget = (target: number, monthly: number) =>
  monthly > 0 ? Math.ceil(target / monthly) : Infinity;

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Starting rate: 60% of free cash as a share of salary, rounded to whole percent. */
export function initialRate(p: Persona, min: number, max: number) {
  const free = (p.salary - p.essentials - p.other) / p.salary;
  return clamp(Math.round(free * 60), min, max);
}

export type RateReason = "income-up" | "income-down" | "essentials-up" | "spending-held" | "same";

export interface MonthInputs {
  salary: number;
  essentials: number;
  other: number;
}

/**
 * Monthly rate rule (revised version):
 * - income up → rate up 2 points
 * - income down or essential costs up → rate down 2 points
 * - only discretionary spending up → rate held (no reward for overspending)
 * Result stays within the customer's min/max and never takes more than free cash.
 */
export function nextRate(
  current: number,
  prev: MonthInputs,
  now: MonthInputs,
  min: number,
  max: number,
): { rate: number; reason: RateReason } {
  let rate = current;
  let reason: RateReason = "same";
  if (now.salary > prev.salary) {
    rate += 2;
    reason = "income-up";
  } else if (now.salary < prev.salary) {
    rate -= 2;
    reason = "income-down";
  } else if (now.essentials > prev.essentials) {
    rate -= 2;
    reason = "essentials-up";
  } else if (now.other > prev.other) {
    reason = "spending-held";
  }
  const freeShare = Math.floor(((now.salary - now.essentials) / now.salary) * 100);
  rate = clamp(Math.min(rate, freeShare), min, max);
  return { rate, reason };
}

export interface Split {
  toEmergency: number;
  toInvest: number;
}

/** Route one month's saving between the emergency pot and the investment pot. */
export function route(
  amount: number,
  path: Path,
  investPct: number,
  emergency: number,
  target: number,
): Split {
  const investShare = path === "direct" ? 1 : path === "safety" ? 0 : investPct / 100;
  let toInvest = amount * investShare;
  let toEmergency = amount - toInvest;
  const room = Math.max(0, target - emergency);
  if (toEmergency > room) {
    toInvest += toEmergency - room; // overflow
    toEmergency = room;
  }
  return { toEmergency: round3(toEmergency), toInvest: round3(toInvest) };
}

export interface Holding {
  id: string;
  amount: number;
  term: Term;
  rate: number;
  start: number; // month index
  maturity: number; // month index
}

export const profitOf = (h: Pick<Holding, "amount" | "rate" | "term">) =>
  round3((h.amount * h.rate * h.term) / 12);

/** How much of the investment pot can buy Sukuk, keeping the liquid portion as cash. */
export function buyable(pot: number, holdingsTotal: number, liquidPct: number) {
  const reserve = ((pot + holdingsTotal) * liquidPct) / 100;
  const free = pot - reserve;
  return free >= SUKUK_MIN ? Math.floor(free / SUKUK_MIN) * SUKUK_MIN : 0;
}

export const zakatDue = (wealth: number, nisab = NISAB_EXAMPLE) =>
  wealth >= nisab ? round3(wealth * 0.025) : 0;

export const round3 = (n: number) => Math.round(n * 1000) / 1000;
