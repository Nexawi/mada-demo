import { describe, expect, it } from "vitest";
import {
  PERSONAS,
  buyable,
  emergencyTarget,
  initialRate,
  monthsToTarget,
  nextRate,
  profitOf,
  route,
  zakatDue,
} from "./engine";

const ahmed = PERSONAS[0];
const base = { salary: 1200, essentials: 650, other: 250 };

describe("emergency target", () => {
  it("uses 6 months of expenses for private sector, 3 for government", () => {
    expect(emergencyTarget(ahmed)).toBe(5400);
    expect(emergencyTarget(PERSONAS[1])).toBe(2250);
  });
  it("expense-based target fills faster than salary-based", () => {
    const monthly = 1200 * 0.15;
    expect(monthsToTarget(6 * 1200, monthly)).toBe(40);
    expect(monthsToTarget(emergencyTarget(ahmed), monthly)).toBe(30);
  });
});

describe("rate engine", () => {
  it("starts at 60% of free cash", () => expect(initialRate(ahmed, 5, 25)).toBe(15));
  it("raises on income up", () =>
    expect(nextRate(15, base, { ...base, salary: 1400 }, 5, 25)).toEqual({ rate: 17, reason: "income-up" }));
  it("lowers on essentials up", () =>
    expect(nextRate(15, base, { ...base, essentials: 750 }, 5, 25)).toEqual({ rate: 13, reason: "essentials-up" }));
  it("holds on a discretionary spending spike", () =>
    expect(nextRate(15, base, { ...base, other: 450 }, 5, 25)).toEqual({ rate: 15, reason: "spending-held" }));
  it("respects the customer maximum", () =>
    expect(nextRate(25, base, { ...base, salary: 1400 }, 5, 25).rate).toBe(25));
  it("never takes more than free cash", () =>
    expect(nextRate(20, base, { ...base, essentials: 1050 }, 5, 25).rate).toBe(12));
});

describe("routing", () => {
  it("safety first sends everything to the emergency pot", () =>
    expect(route(180, "safety", 50, 0, 5400)).toEqual({ toEmergency: 180, toInvest: 0 }));
  it("overflow above target goes to investing", () =>
    expect(route(180, "safety", 0, 5300, 5400)).toEqual({ toEmergency: 100, toInvest: 80 }));
  it("hybrid splits by the slider", () =>
    expect(route(200, "hybrid", 30, 0, 5400)).toEqual({ toEmergency: 140, toInvest: 60 }));
  it("direct skips the emergency pot", () =>
    expect(route(180, "direct", 0, 0, 5400)).toEqual({ toEmergency: 0, toInvest: 180 }));
});

describe("investing", () => {
  it("buys in BD 100 steps after the liquid reserve", () => {
    expect(buyable(250, 0, 10)).toBe(200);
    expect(buyable(90, 0, 0)).toBe(0);
  });
  it("profit for 6 months at 5%", () => expect(profitOf({ amount: 1000, rate: 0.05, term: 6 })).toBe(25));
  it("zakat is 2.5% above nisab only", () => {
    expect(zakatDue(4000)).toBe(100);
    expect(zakatDue(1000)).toBe(0);
  });
});
