import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  FAMILY_MEMBER_AMOUNT,
  PERSONAS,
  SUKUK_RATE,
  bankFeeOf,
  buyable,
  profitOf,
  recommendRate,
  round3,
  route,
  type Holding,
  type Path,
  type Persona,
  type Risk,
  type Term,
} from "./engine";
import type { Key, Lang } from "./i18n";

export type Stage = "welcome" | "consent" | "reading" | "risk" | "plan" | "tejoori" | "app";
export type Tab = "home" | "pots" | "invest" | "activity" | "settings";
export type Scenario = "raise" | "cut" | "essentials" | "spend" | "dip" | "prize";
export type PotKey = "tejoori" | "invest";

export interface LogEntry {
  id: number;
  month: number;
  key: Key;
  p?: Record<string, number | string>;
  money?: string[]; // which params are money
}

export interface Snapshot {
  month: number;
  tejoori: number;
  invested: number;
}

interface Data {
  lang: Lang;
  stage: Stage;
  tab: Tab;
  personaId: Persona["id"];
  accountType: "personal" | "family";
  salary: number;
  essentials: number;
  other: number;
  baseOther: number;
  risk: Risk;
  path: Path;
  investPct: number;
  minRate: number;
  maxRate: number;
  rate: number;
  term: Term;
  goalName: string;
  goalAmount: number;
  openingDeposit: number;
  month: number; // months run so far
  tejoori: number;
  investPot: number;
  holdings: Holding[];
  reinvested: number; // net profit reinvested so far
  bankFees: number; // bank's share of profit so far
  liquidPct: number;
  paused: boolean;
  dip: boolean;
  goalReached: boolean;
  afterGoal: "keep" | "invest" | null;
  pendingGoal: boolean;
  pendingRate: { rate: number } | null;
  queue: Scenario[];
  log: LogEntry[];
  seq: number;
  history: Snapshot[];
}

interface Actions {
  set: (patch: Partial<Data>) => void;
  start: (id: Persona["id"], accountType: "personal" | "family") => void;
  loadSample: () => void;
  finishOnboarding: () => void;
  nextMonth: () => void;
  runMonths: (n: number) => void;
  acceptRate: () => void;
  keepRate: () => void;
  chooseAfterGoal: (c: "keep" | "invest") => void;
  withdraw: (pot: PotKey, amount: number) => void;
  toggleScenario: (s: Scenario) => void;
  reset: () => void;
}

export type State = Data & Actions;

const persona = (id: Persona["id"]) => PERSONAS.find((p) => p.id === id)!;

const initial = (lang: Lang = "en"): Data => {
  const p = PERSONAS[0];
  return {
    lang,
    stage: "welcome",
    tab: "home",
    personaId: p.id,
    accountType: "personal",
    salary: p.salary,
    essentials: p.essentials,
    other: p.other,
    baseOther: p.other,
    risk: "balanced",
    path: "split",
    investPct: 30,
    minRate: 5,
    maxRate: 25,
    rate: 15,
    term: 6,
    goalName: "",
    goalAmount: 3000,
    openingDeposit: 50,
    month: 0,
    tejoori: 0,
    investPot: 0,
    holdings: [],
    reinvested: 0,
    bankFees: 0,
    liquidPct: 10,
    paused: false,
    dip: false,
    goalReached: false,
    afterGoal: null,
    pendingGoal: false,
    pendingRate: null,
    queue: [],
    log: [],
    seq: 0,
    history: [],
  };
};

/** Family accounts always have a shared Tejoori; personal ones unless investing only. */
export const usesTejoori = (s: Pick<Data, "path" | "accountType">) =>
  s.accountType === "family" || s.path !== "invest";

export const holdingsTotal = (h: Holding[]) => round3(h.reduce((a, x) => a + x.amount, 0));

export const useDemo = create<State>()(
  persist(
    (set, get) => {
      const log = (e: Omit<LogEntry, "month" | "id">) =>
        set((s) => ({
          seq: s.seq + 1,
          log: [{ id: s.seq + 1, month: s.month, ...e }, ...s.log].slice(0, 200),
        }));

      /** Record this month's balances for the chart (one point per month). */
      const snap = () =>
        set((s) => {
          const point = {
            month: s.month,
            tejoori: s.tejoori,
            invested: round3(s.investPot + holdingsTotal(s.holdings)),
          };
          return { history: [...s.history.filter((h) => h.month !== s.month), point] };
        });

      /** Profit is always reinvested; purchases run automatically at the chosen term. */
      const tryBuy = () => {
        const s = get();
        const amount = buyable(s.investPot, holdingsTotal(s.holdings), s.liquidPct);
        if (!amount) return;
        set({
          investPot: round3(s.investPot - amount),
          holdings: [
            ...s.holdings,
            {
              id: `${s.month}-${s.holdings.length}-${Math.random().toString(36).slice(2, 6)}`,
              amount,
              term: s.term,
              rate: SUKUK_RATE[s.term],
              start: s.month,
              maturity: s.month + s.term,
            },
          ],
        });
        log({ key: "log.bought", p: { a: amount, term: s.term }, money: ["a"] });
      };

      const deduct = () => {
        const s = get();
        if (s.paused) {
          log({ key: "log.paused" });
          snap();
          return;
        }
        const amount = round3((s.salary * s.rate) / 100);
        const r = route(amount, s.path, s.investPct, s.afterGoal);
        const tejoori = round3(s.tejoori + r.toTejoori);
        set({ tejoori, investPot: round3(s.investPot + r.toInvest) });
        if (s.accountType === "family") {
          set((st) => ({ tejoori: round3(st.tejoori + FAMILY_MEMBER_AMOUNT) }));
          log({
            key: "log.family",
            p: { name: `persona.${persona(s.personaId).partner}`, a: FAMILY_MEMBER_AMOUNT },
            money: ["a"],
          });
        }
        log({
          key: "log.saved",
          p: { a: amount, e: r.toTejoori, i: r.toInvest },
          money: ["a", "e", "i"],
        });
        if (!s.goalReached && usesTejoori(s) && get().tejoori >= s.goalAmount) {
          set({ goalReached: true, pendingGoal: true });
          log({ key: "log.goal", p: { a: s.goalAmount }, money: ["a"] });
        }
        tryBuy();
        snap();
      };

      return {
        ...initial(),
        set: (patch) => set(patch),

        start: (id, accountType) => {
          const p = persona(id);
          set({
            ...initial(get().lang),
            accountType,
            personaId: id,
            salary: p.salary,
            essentials: p.essentials,
            other: p.other,
            baseOther: p.other,
            stage: "consent",
          });
        },

        /**
         * Dummy data: Ahmed's personal account after 14 simulated months, with a raise,
         * a spending spike and a prize win along the way. Rate changes are accepted.
         */
        loadSample: () => {
          get().start("ahmed", "personal");
          set({
            path: "split",
            investPct: 30,
            goalName: "New car",
            goalAmount: 3000,
            openingDeposit: 200,
            term: 6,
          });
          get().finishOnboarding();
          const events: Record<number, Scenario[]> = {
            4: ["raise"],
            8: ["spend"],
            10: ["prize"],
            12: ["dip"],
          };
          for (let m = 1; m <= 14; m++) {
            set({ queue: events[m] ?? [] });
            get().nextMonth();
          }
          if (get().pendingRate) get().acceptRate();
          set({ tab: "home" });
        },

        finishOnboarding: () => {
          const s = get();
          const rate = recommendRate(persona(s.personaId), s.minRate, s.maxRate);
          const tejoori = usesTejoori(s) ? s.openingDeposit : 0;
          set({
            rate,
            tejoori,
            stage: "app",
            tab: "home",
            history: [{ month: 0, tejoori, invested: 0 }],
          });
          log({ key: "log.start" });
          if (tejoori > 0) log({ key: "log.opened", p: { a: tejoori }, money: ["a"] });
        },

        nextMonth: () => {
          let s = get();
          if (s.pendingRate) get().acceptRate();
          s = get();
          const q = s.queue;
          let salary = s.salary;
          if (q.includes("raise")) salary = Math.round(salary * 1.15);
          if (q.includes("cut")) salary = Math.round(salary * 0.85);
          const essentials = q.includes("essentials") ? s.essentials + 100 : s.essentials;
          const other = q.includes("spend") ? s.baseOther + 200 : s.baseOther;
          const month = s.month + 1;
          set({ month, salary, essentials, other, queue: [], dip: q.includes("dip") });

          // Maturities: principal and net profit go back to the investment pot (always reinvested)
          const due = get().holdings.filter((h) => h.maturity <= month);
          if (due.length) {
            set((st) => ({ holdings: st.holdings.filter((h) => h.maturity > month) }));
            for (const h of due) {
              const gross = profitOf(h);
              const fee = bankFeeOf(gross);
              const net = round3(gross - fee);
              set((st) => ({
                investPot: round3(st.investPot + h.amount + net),
                reinvested: round3(st.reinvested + net),
                bankFees: round3(st.bankFees + fee),
              }));
              log({
                key: "log.matured",
                p: { a: h.amount, p: net, f: fee },
                money: ["a", "p", "f"],
              });
            }
          }

          // Prize draw on the Tejoori balance
          if (get().tejoori >= 100) {
            if (q.includes("prize")) {
              set((st) => ({ tejoori: round3(st.tejoori + 100) }));
              log({ key: "log.prizeWin", p: { a: 100 }, money: ["a"] });
            } else log({ key: "log.prizeNo" });
          }

          // Savings engine recommendation, capped by the customer's limits
          const cur = get();
          const rec = recommendRate({ salary, essentials, other }, cur.minRate, cur.maxRate);
          if (rec !== cur.rate && !cur.paused) set({ pendingRate: { rate: rec } });
          else deduct();
        },

        runMonths: (n) => {
          for (let i = 0; i < n; i++) get().nextMonth();
          if (get().pendingRate) get().acceptRate();
        },

        acceptRate: () => {
          const p = get().pendingRate;
          if (!p) return;
          set({ rate: p.rate, pendingRate: null });
          log({ key: "log.rate", p: { r: p.rate } });
          deduct();
        },

        keepRate: () => {
          set({ pendingRate: null });
          log({ key: "log.rateKept", p: { r: get().rate } });
          deduct();
        },

        chooseAfterGoal: (c) => {
          set({ afterGoal: c, pendingGoal: false });
          log({ key: c === "invest" ? "log.goalInvest" : "log.goalKeep" });
        },

        withdraw: (pot, amount) => {
          const field = pot === "tejoori" ? "tejoori" : "investPot";
          set((s) => ({ [field]: round3(s[field] - amount) }) as Partial<Data>);
          log({
            key: "log.withdraw",
            p: { a: amount, pot: pot === "tejoori" ? "tejoori.name" : "pots.invest" },
            money: ["a"],
          });
          snap();
        },

        toggleScenario: (sc) =>
          set((s) => {
            let q = s.queue.includes(sc) ? s.queue.filter((x) => x !== sc) : [...s.queue, sc];
            if (sc === "raise") q = q.filter((x) => x !== "cut");
            if (sc === "cut") q = q.filter((x) => x !== "raise");
            return { queue: q };
          }),

        reset: () => set(initial(get().lang)),
      };
    },
    { name: "mada-demo-v1" },
  ),
);
