import { describe, expect, it } from "vitest";
import {
  PERSONAS,
  SAMPLE_SPENDING,
  bankFeeOf,
  buyable,
  monthsToGoal,
  netProfitOf,
  profitOf,
  recommendRate,
  route,
  zakatDue,
} from "./engine";

const base = { salary: 1200, essentials: 650, other: 250 };

describe("savings engine stand-in", () => {
  it("recommends 60% of free cash", () => expect(recommendRate(base, 5, 25)).toBe(15));
  it("respects the customer maximum", () =>
    expect(recommendRate({ ...base, salary: 3000 }, 5, 25)).toBe(25));
  it("respects the customer minimum", () =>
    expect(recommendRate({ ...base, other: 540 }, 5, 25)).toBe(5));
  it("never goes negative when spending exceeds salary", () =>
    expect(recommendRate({ ...base, other: 900 }, 0, 25)).toBe(0));
  it("Fatima starts at 15%", () => expect(recommendRate(PERSONAS[1], 5, 25)).toBe(15));
});

describe("dummy spending", () => {
  it("adds up to each persona's essentials and other spending", () => {
    for (const p of PERSONAS) {
      const rows = SAMPLE_SPENDING[p.id];
      const sum = (ess: boolean) =>
        rows.filter((r) => r.essential === ess).reduce((a, r) => a + r.amount, 0);
      expect(sum(true)).toBe(p.essentials);
      expect(sum(false)).toBe(p.other);
    }
  });
});

describe("routing", () => {
  it("Tejoori path saves everything", () =>
    expect(route(180, "tejoori", 50, null)).toEqual({ toTejoori: 180, toInvest: 0 }));
  it("split follows the slider", () =>
    expect(route(200, "split", 30, null)).toEqual({ toTejoori: 140, toInvest: 60 }));
  it("invest path invests everything", () =>
    expect(route(180, "invest", 0, null)).toEqual({ toTejoori: 0, toInvest: 180 }));
  it("after the goal, choosing invest moves the Tejoori share", () =>
    expect(route(200, "split", 30, "invest")).toEqual({ toTejoori: 0, toInvest: 200 }));
  it("after the goal, choosing keep changes nothing", () =>
    expect(route(200, "tejoori", 30, "keep")).toEqual({ toTejoori: 200, toInvest: 0 }));
});

describe("goal and investing", () => {
  it("months to goal from an opening balance", () => expect(monthsToGoal(3000, 50, 180)).toBe(17));
  it("goal already met", () => expect(monthsToGoal(40, 50, 180)).toBe(0));
  it("buys in BD 100 steps after the liquid reserve", () => {
    expect(buyable(250, 0, 10)).toBe(200);
    expect(buyable(90, 0, 0)).toBe(0);
  });
  it("profit for 6 months at 5%", () =>
    expect(profitOf({ amount: 1000, rate: 0.05, term: 6 })).toBe(25));
  it("bank takes a share of profit only", () => {
    expect(bankFeeOf(25)).toBe(5);
    expect(bankFeeOf(0)).toBe(0);
    expect(netProfitOf({ amount: 1000, rate: 0.05, term: 6 })).toBe(20);
  });
  it("zakat is 2.5% above nisab only", () => {
    expect(zakatDue(4000)).toBe(100);
    expect(zakatDue(1000)).toBe(0);
  });
});
