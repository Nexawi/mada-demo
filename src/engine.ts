// Pure simulation rules. No React, no storage — tested in engine.test.ts.

export type Risk = "cautious" | "balanced" | "growth";
export type Path = "tejoori" | "split" | "invest";
export type Term = 3 | 6 | 12;

export interface Persona {
  id: "ahmed" | "fatima";
  partner: "sara" | "yousif"; // family member in the demo's family account
  salary: number;
  essentials: number; // rent, bills, groceries
  other: number; // discretionary spending
}

export const PERSONAS: Persona[] = [
  { id: "ahmed", partner: "sara", salary: 1200, essentials: 650, other: 250 },
  { id: "fatima", partner: "yousif", salary: 1000, essentials: 550, other: 200 },
];

/** Illustrative annual profit rates per Sukuk term. Not real market rates. */
export const SUKUK_RATE: Record<Term, number> = { 3: 0.045, 6: 0.05, 12: 0.055 };
export const TERM_FOR_RISK: Record<Risk, Term> = { cautious: 3, balanced: 6, growth: 12 };
/** Minimum balance to open the Tejoori savings account (BD). */
export const TEJOORI_MIN = 50;
/** Minimum for the investment account: Sukuk are bought in steps of this (BD). */
export const INVEST_MIN = 100;
/** Demo family member contribution to a family Tejoori (BD a month). */
export const FAMILY_MEMBER_AMOUNT = 100;
/** Example nisab in BD. The real figure follows the gold price and the Sharia board. */
export const NISAB_EXAMPLE = 2500;

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const round3 = (n: number) => Math.round(n * 1000) / 1000;

export interface MonthInputs {
  salary: number;
  essentials: number;
  other: number;
}

/**
 * Stand-in for the bank's savings engine. In the real product this number comes from the
 * open banking API; the demo approximates it as 60% of last month's free cash. The customer's
 * limits always cap the result.
 */
export function recommendRate(m: MonthInputs, min: number, max: number) {
  const free = Math.max(0, (m.salary - m.essentials - m.other) / m.salary);
  return clamp(Math.round(free * 60), min, max);
}

/** Months to reach a goal at a fixed monthly amount, starting from a balance. */
export const monthsToGoal = (goal: number, start: number, monthly: number) =>
  goal <= start ? 0 : monthly > 0 ? Math.ceil((goal - start) / monthly) : Infinity;

export interface Split {
  toTejoori: number;
  toInvest: number;
}

/**
 * Route one month's saving. `afterGoal` is the customer's choice once the Tejoori goal is
 * reached: "invest" sends the Tejoori share to investing from then on.
 */
export function route(
  amount: number,
  path: Path,
  investPct: number,
  afterGoal: "keep" | "invest" | null,
): Split {
  let share = path === "invest" ? 1 : path === "tejoori" ? 0 : investPct / 100;
  if (afterGoal === "invest") share = 1;
  const toInvest = round3(amount * share);
  return { toTejoori: round3(amount - toInvest), toInvest };
}

export interface Holding {
  id: string;
  amount: number;
  term: Term;
  rate: number;
  start: number; // month index
  maturity: number; // month index
}

/** Gross profit a holding earns over its term. */
export const profitOf = (h: Pick<Holding, "amount" | "rate" | "term">) =>
  round3((h.amount * h.rate * h.term) / 12);

/**
 * Bank fee is a share of profit only (profitability-based, mudarabah-style): no profit, no fee.
 * 20% is an example figure, not a decided one.
 */
export const BANK_SHARE = 0.2;
export const bankFeeOf = (grossProfit: number, share = BANK_SHARE) =>
  grossProfit > 0 ? round3(grossProfit * share) : 0;
export const netProfitOf = (h: Pick<Holding, "amount" | "rate" | "term">, share = BANK_SHARE) => {
  const gross = profitOf(h);
  return round3(gross - bankFeeOf(gross, share));
};

/** How much of the investment pot can buy Sukuk, keeping the liquid portion as cash. */
export function buyable(pot: number, holdingsTotal: number, liquidPct: number) {
  const reserve = ((pot + holdingsTotal) * liquidPct) / 100;
  const free = pot - reserve;
  return free >= INVEST_MIN ? Math.floor(free / INVEST_MIN) * INVEST_MIN : 0;
}

export const zakatDue = (wealth: number, nisab = NISAB_EXAMPLE) =>
  wealth >= nisab ? round3(wealth * 0.025) : 0;
