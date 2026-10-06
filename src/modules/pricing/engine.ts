// Pure pricing engine – no I/O, fully unit-tested. All money is integer paise.

export type RateInput = {
  baseFare: number;
  includedKm: number;
  perKm: number;
  minFare: number;
};

export type PricingRules = {
  nightStartHour: number;
  nightEndHour: number;
  nightMultiplier: number;
  surgeMultiplier: number;
  gstRatePct: number;
  roundToRupee: boolean;
};

export type Quote = {
  distanceKm: number;
  billableKm: number;
  baseFare: number;
  distanceCharge: number;
  minFareTopUp: number;
  nightSurcharge: number;
  surgeSurcharge: number;
  isNight: boolean;
  subtotal: number; // taxable value
  gstRatePct: number;
  gstAmount: number;
  total: number;
};

/** Hour of day (0-23) in India Standard Time (UTC+05:30, no DST). */
export function istHour(at: Date): number {
  const minutes = at.getUTCHours() * 60 + at.getUTCMinutes() + 330;
  return Math.floor(minutes / 60) % 24;
}

export function isNightHour(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  return start > end ? hour >= start || hour < end : hour >= start && hour < end;
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export function computeQuote(input: { rate: RateInput; distanceKm: number; requiresDrop: boolean; at: Date; rules: PricingRules }): Quote {
  const { rate, rules } = input;
  const distanceKm = input.requiresDrop ? Math.max(0, Math.round(input.distanceKm * 10) / 10) : 0;
  const billableKm = Math.max(0, distanceKm - rate.includedKm);
  const baseFare = rate.baseFare;
  const distanceCharge = Math.round(billableKm * rate.perKm);

  let fare = baseFare + distanceCharge;
  const minFareTopUp = Math.max(0, rate.minFare - fare);
  fare += minFareTopUp;

  const isNight = isNightHour(istHour(input.at), rules.nightStartHour, rules.nightEndHour);
  const nightSurcharge = isNight ? Math.round(fare * (rules.nightMultiplier - 1)) : 0;
  const surgeSurcharge = Math.round(fare * (rules.surgeMultiplier - 1));

  let subtotal = fare + nightSurcharge + surgeSurcharge;
  if (rules.roundToRupee) subtotal = roundTo(subtotal, 100);
  let gstAmount = Math.round((subtotal * rules.gstRatePct) / 100);
  if (rules.roundToRupee) gstAmount = roundTo(gstAmount, 100);

  return {
    distanceKm,
    billableKm: Math.round(billableKm * 10) / 10,
    baseFare,
    distanceCharge,
    minFareTopUp,
    nightSurcharge,
    surgeSurcharge,
    isNight,
    subtotal,
    gstRatePct: rules.gstRatePct,
    gstAmount,
    total: subtotal + gstAmount,
  };
}

/** CGST+SGST for intra-state supply, IGST otherwise. Splits are exact (cgst + sgst === gst). */
export function splitGst(gstAmount: number, intraState: boolean) {
  if (!intraState) return { cgst: 0, sgst: 0, igst: gstAmount };
  const cgst = Math.floor(gstAmount / 2);
  return { cgst, sgst: gstAmount - cgst, igst: 0 };
}

/** Platform commission and provider net on a booking; commission is charged on the taxable value only. */
export function splitCommission(subtotal: number, gstAmount: number, commissionBp: number) {
  const commission = Math.round((subtotal * commissionBp) / 10_000);
  // Provider is owed taxable value minus commission; GST collected is remitted by the platform.
  return { commission, net: subtotal - commission, gross: subtotal + gstAmount };
}
