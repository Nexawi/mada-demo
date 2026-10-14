import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  PERSONAS,
  SUKUK_RATE,
  TERM_FOR_RISK,
  buyable,
  emergencyTarget,
  initialRate,
  nextRate,
  profitOf,
  round3,
  route,
  type Holding,
  type Path,
  type Persona,
  type RateReason,
  type Risk,
  type Term,
} from "./engine";
import type { Key, Lang } from "./i18n";

export type Stage = "welcome" | "consent" | "reading" | "risk" | "path" | "app";
export type Tab = "home" | "pots" | "invest" | "activity" | "settings";
export type Scenario = "raise" | "cut" | "essentials" | "spend" | "dip" | "prize";
export type PotKey = "emergency" | "invest";

export interface LogEntry {
  id: number;
  month: number;
  key: Key;
  p?: Record<string, number | string>;
  money?: string[]; // which params are money
}

interface Data {
  lang: Lang;
  stage: Stage;
  tab: Tab;
  personaId: Persona["id"];
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
  month: number; // months run so far
  emergency: number;
  investPot: number;
  holdings: Holding[];
  reinvest: boolean;
  mode: "auto" | "approve";
  liquidPct: number;
  paused: boolean;
  dip: boolean;
  targetReached: boolean;
  notice: "held" | "target" | null;
  pendingRate: { rate: number; reason: RateReason } | null;
  pendingBuy: { amount: number; term: Term } | null;
  queue: Scenario[];
  log: LogEntry[];
  seq: number;
  history: Snapshot[];
}

export interface Snapshot {
  month: number;
  emergency: number;
  invested: number;
}

interface Actions {
  set: (patch: Partial<Data>) => void;
  start: (id: Persona["id"]) => void;
  finishOnboarding: () => void;
  nextMonth: () => void;
  runMonths: (n: number) => void;
  acceptRate: () => void;
  keepRate: () => void;
  approveBuy: () => void;
  declineBuy: () => void;
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
    salary: p.salary,
    essentials: p.essentials,
    other: p.other,
    baseOther: p.other,
    risk: "balanced",
    path: "hybrid",
    investPct: 30,
    minRate: 5,
    maxRate: 25,
    rate: 15,
    month: 0,
    emergency: 0,
    investPot: 0,
    holdings: [],
    reinvest: true,
    mode: "auto",
    liquidPct: 10,
    paused: false,
    dip: false,
    targetReached: false,
    notice: null,
    pendingRate: null,
    pendingBuy: null,
    queue: [],
    log: [],
    seq: 0,
    history: [],
  };
};

export const targetOf = (s: Pick<Data, "personaId" | "essentials" | "baseOther">) =>
  emergencyTarget({
    sector: persona(s.personaId).sector,
    essentials: s.essentials,
    other: s.baseOther,
  });

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
            emergency: s.emergency,
            invested: round3(s.investPot + holdingsTotal(s.holdings)),
          };
          return { history: [...s.history.filter((h) => h.month !== s.month), point] };
        });

      const tryBuy = () => {
        const s = get();
        const amount = buyable(s.investPot, holdingsTotal(s.holdings), s.liquidPct);
        if (!amount) return;
        const term = TERM_FOR_RISK[s.risk];
        if (s.mode === "approve") set({ pendingBuy: { amount, term } });
        else buy(amount, term);
      };

      const buy = (amount: number, term: Term) => {
        set((s) => ({
          investPot: round3(s.investPot - amount),
          holdings: [
            ...s.holdings,
            {
              id: `${s.month}-${s.holdings.length}-${Math.random().toString(36).slice(2, 6)}`,
              amount,
              term,
              rate: SUKUK_RATE[term],
              start: s.month,
              maturity: s.month + term,
            },
          ],
        }));
        log({ key: "log.bought", p: { a: amount, term }, money: ["a"] });
      };

      const deduct = () => {
        const s = get();
        if (s.paused) {
          log({ key: "log.paused" });
          snap();
          return;
        }
        const amount = round3((s.salary * s.rate) / 100);
        const target = targetOf(s);
        const r = route(amount, s.path, s.investPct, s.emergency, target);
        const emergency = round3(s.emergency + r.toEmergency);
        set({ emergency, investPot: round3(s.investPot + r.toInvest) });
        log({
          key: "log.saved",
          p: { a: amount, e: r.toEmergency, i: r.toInvest },
          money: ["a", "e", "i"],
        });
        if (!s.targetReached && emergency >= target && s.path !== "direct") {
          set({ targetReached: true, notice: "target" });
          log({ key: "log.target" });
        }
        tryBuy();
        snap();
      };

      return {
        ...initial(),
        set: (patch) => set(patch),

        start: (id) => {
          const p = persona(id);
          set({
            ...initial(get().lang),
            personaId: id,
            salary: p.salary,
            essentials: p.essentials,
            other: p.other,
            baseOther: p.other,
            stage: "consent",
          });
        },

        finishOnboarding: () => {
          const s = get();
          const rate = initialRate(persona(s.personaId), s.minRate, s.maxRate);
          set({
            rate,
            stage: "app",
            tab: "home",
            history: [{ month: 0, emergency: 0, invested: 0 }],
          });
          log({ key: "log.start" });
        },

        nextMonth: () => {
          let s = get();
          if (s.pendingRate) get().acceptRate();
          if (s.pendingBuy) set({ pendingBuy: null });
          s = get();
          const prev = { salary: s.salary, essentials: s.essentials, other: s.other };
          const q = s.queue;
          let salary = s.salary;
          if (q.includes("raise")) salary = Math.round(salary * 1.15);
          if (q.includes("cut")) salary = Math.round(salary * 0.85);
          const essentials = q.includes("essentials") ? s.essentials + 100 : s.essentials;
          const other = q.includes("spend") ? s.baseOther + 200 : s.baseOther;
          const month = s.month + 1;
          set({
            month,
            salary,
            essentials,
            other,
            queue: [],
            dip: q.includes("dip"),
            notice: null,
          });

          // Maturities
          const due = get().holdings.filter((h) => h.maturity <= month);
          if (due.length) {
            set((st) => ({ holdings: st.holdings.filter((h) => h.maturity > month) }));
            for (const h of due) {
              const profit = profitOf(h);
              log({ key: "log.matured", p: { a: h.amount, p: profit }, money: ["a", "p"] });
              const reinvest = get().reinvest;
              set((st) => ({
                investPot: round3(st.investPot + h.amount + (reinvest ? profit : 0)),
              }));
              if (!reinvest) log({ key: "log.profitOut", p: { p: profit }, money: ["p"] });
            }
          }

          // Prize draw on the emergency pot
          if (get().emergency >= 100) {
            if (q.includes("prize")) {
              set((st) => ({ emergency: round3(st.emergency + 100) }));
              log({ key: "log.prizeWin", p: { a: 100 }, money: ["a"] });
            } else log({ key: "log.prizeNo" });
          }

          // Rate engine
          const cur = get();
          const next = nextRate(
            cur.rate,
            prev,
            { salary, essentials, other },
            cur.minRate,
            cur.maxRate,
          );
          if (next.reason === "spending-held") {
            set({ notice: "held" });
            log({ key: "log.held", p: { r: cur.rate } });
          }
          if (next.rate !== cur.rate && !cur.paused) set({ pendingRate: next });
          else deduct();
        },

        runMonths: (n) => {
          for (let i = 0; i < n; i++) {
            get().nextMonth();
            if (get().pendingBuy) get().approveBuy();
          }
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

        approveBuy: () => {
          const p = get().pendingBuy;
          if (!p) return;
          set({ pendingBuy: null });
          buy(p.amount, p.term);
          snap();
        },

        declineBuy: () => {
          set({ pendingBuy: null });
          log({ key: "log.declined" });
        },

        withdraw: (pot, amount) => {
          const field = pot === "emergency" ? "emergency" : "investPot";
          set((s) => ({ [field]: round3(s[field] - amount) }) as Partial<Data>);
          log({
            key: "log.withdraw",
            p: { a: amount, pot: pot === "emergency" ? "home.emergency" : "pots.invest" },
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
    { name: "halal-auto-invest-demo-v2" },
  ),
);
