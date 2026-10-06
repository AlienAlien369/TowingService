import { describe, expect, it } from "vitest";
import { computeQuote, isNightHour, istHour, splitCommission, splitGst, type PricingRules, type RateInput } from "./engine";

const rate: RateInput = { baseFare: 99900, includedKm: 5, perKm: 4500, minFare: 99900 };
const rules: PricingRules = { nightStartHour: 22, nightEndHour: 6, nightMultiplier: 1.25, surgeMultiplier: 1, gstRatePct: 18, roundToRupee: true };
// 2026-10-05 06:30 UTC = 12:00 IST (day) ; 2026-10-05 18:30 UTC = 00:00 IST next day (night)
const day = new Date("2026-10-05T06:30:00Z");
const night = new Date("2026-10-05T18:30:00Z");

describe("istHour", () => {
  it("converts UTC to IST", () => {
    expect(istHour(day)).toBe(12);
    expect(istHour(night)).toBe(0);
    expect(istHour(new Date("2026-10-05T20:00:00Z"))).toBe(1);
  });
});

describe("isNightHour", () => {
  it("handles windows that wrap midnight", () => {
    expect(isNightHour(23, 22, 6)).toBe(true);
    expect(isNightHour(3, 22, 6)).toBe(true);
    expect(isNightHour(6, 22, 6)).toBe(false);
    expect(isNightHour(12, 22, 6)).toBe(false);
  });
  it("handles same-day windows and disabled windows", () => {
    expect(isNightHour(1, 0, 5)).toBe(true);
    expect(isNightHour(5, 0, 5)).toBe(false);
    expect(isNightHour(3, 4, 4)).toBe(false);
  });
});

describe("computeQuote", () => {
  it("charges only the base fare within included km", () => {
    const q = computeQuote({ rate, distanceKm: 4, requiresDrop: true, at: day, rules });
    expect(q.distanceCharge).toBe(0);
    expect(q.subtotal).toBe(99900);
    expect(q.gstAmount).toBe(18000); // 18% of 999 = 179.82 -> ₹180
    expect(q.total).toBe(117900);
  });

  it("adds per-km charge beyond included km", () => {
    const q = computeQuote({ rate, distanceKm: 15, requiresDrop: true, at: day, rules });
    expect(q.billableKm).toBe(10);
    expect(q.distanceCharge).toBe(45000);
    expect(q.subtotal).toBe(144900);
  });

  it("applies night multiplier on the fare", () => {
    const q = computeQuote({ rate, distanceKm: 4, requiresDrop: true, at: night, rules });
    expect(q.isNight).toBe(true);
    expect(q.nightSurcharge).toBe(Math.round(99900 * 0.25));
    expect(q.subtotal % 100).toBe(0);
  });

  it("applies surge", () => {
    const q = computeQuote({ rate, distanceKm: 4, requiresDrop: true, at: day, rules: { ...rules, surgeMultiplier: 1.5 } });
    expect(q.surgeSurcharge).toBe(Math.round(99900 * 0.5));
  });

  it("enforces the minimum fare", () => {
    const q = computeQuote({ rate: { ...rate, baseFare: 50000, minFare: 99900 }, distanceKm: 1, requiresDrop: true, at: day, rules });
    expect(q.minFareTopUp).toBe(49900);
    expect(q.subtotal).toBe(99900);
  });

  it("ignores distance for on-spot services", () => {
    const q = computeQuote({ rate, distanceKm: 40, requiresDrop: false, at: day, rules });
    expect(q.distanceKm).toBe(0);
    expect(q.distanceCharge).toBe(0);
  });

  it("total always equals subtotal + gst", () => {
    for (const km of [0, 3.3, 7.77, 25, 61.4]) {
      const q = computeQuote({ rate, distanceKm: km, requiresDrop: true, at: night, rules: { ...rules, surgeMultiplier: 1.3 } });
      expect(q.total).toBe(q.subtotal + q.gstAmount);
    }
  });
});

describe("splitGst", () => {
  it("splits intra-state evenly with no rounding leak", () => {
    for (const g of [18000, 17999, 1, 0]) {
      const s = splitGst(g, true);
      expect(s.cgst + s.sgst).toBe(g);
      expect(s.igst).toBe(0);
    }
  });
  it("uses IGST for inter-state", () => {
    expect(splitGst(18000, false)).toEqual({ cgst: 0, sgst: 0, igst: 18000 });
  });
});

describe("splitCommission", () => {
  it("takes commission on taxable value", () => {
    const r = splitCommission(100000, 18000, 2000);
    expect(r).toEqual({ commission: 20000, net: 80000, gross: 118000 });
  });
});
