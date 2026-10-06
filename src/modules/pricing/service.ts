import "server-only";
import { db } from "@/shared/lib/db";
import { getSettings } from "@/modules/settings/service";
import { checkServiceability, getGeoProvider } from "@/modules/geo/service";
import type { LatLng } from "@/modules/geo/providers";
import { computeQuote, type Quote } from "./engine";

export type QuoteRequest = {
  vehicleTypeId: string;
  serviceId: string;
  pickup: LatLng;
  drop?: LatLng | null;
  scheduledFor?: Date | null;
};

export type QuoteResult =
  | { ok: true; quote: Quote; route: { geometry: [number, number][] | null; durationMin: number; approximate: boolean } | null; etaMinutes: number; areaName?: string }
  | { ok: false; code: "COMING_SOON" | "OUT_OF_AREA" | "NO_RATE" | "NEEDS_DROP" | "TOO_FAR"; error: string; areaName?: string; city?: string };

const MAX_TOW_KM = 150;

/** Server-authoritative pricing: bookings re-run this, they never trust a client-supplied fare. */
export async function quoteBooking(req: QuoteRequest): Promise<QuoteResult> {
  const [settings, rate] = await Promise.all([
    getSettings(),
    db.rateCard.findFirst({ where: { vehicleTypeId: req.vehicleTypeId, serviceId: req.serviceId, isActive: true, vehicleType: { isActive: true }, service: { isActive: true } }, include: { service: true } }),
  ]);
  if (!rate) return { ok: false, code: "NO_RATE", error: "This vehicle / service combination is not available right now." };

  const area = await checkServiceability(req.pickup);
  if (area.status === "COMING_SOON") return { ok: false, code: "COMING_SOON", error: `We're launching in ${area.areaName ?? area.city} soon.`, areaName: area.areaName, city: area.city };
  if (area.status === "OUT") return { ok: false, code: "OUT_OF_AREA", error: "Pickup location is outside our current service area (Delhi)." };

  let route: { geometry: [number, number][] | null; durationMin: number; approximate: boolean } | null = null;
  let distanceKm = 0;
  if (rate.service.requiresDrop) {
    if (!req.drop) return { ok: false, code: "NEEDS_DROP", error: "Please choose a drop location." };
    const r = await (await getGeoProvider()).route(req.pickup, req.drop);
    if (r.distanceKm > MAX_TOW_KM) return { ok: false, code: "TOO_FAR", error: `Drop is too far (${r.distanceKm} km). Maximum ${MAX_TOW_KM} km.` };
    distanceKm = r.distanceKm;
    route = { geometry: r.geometry, durationMin: r.durationMin, approximate: r.approximate };
  }

  const quote = computeQuote({
    rate,
    distanceKm,
    requiresDrop: rate.service.requiresDrop,
    at: req.scheduledFor ?? new Date(),
    rules: {
      nightStartHour: settings.pricing.nightStartHour,
      nightEndHour: settings.pricing.nightEndHour,
      nightMultiplier: settings.pricing.nightMultiplier,
      surgeMultiplier: settings.pricing.surgeMultiplier,
      gstRatePct: settings.business.gstRatePct,
      roundToRupee: settings.pricing.roundToRupee,
    },
  });
  return { ok: true, quote, route, etaMinutes: rate.service.etaMinutes, areaName: area.areaName };
}
