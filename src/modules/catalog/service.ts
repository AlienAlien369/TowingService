import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/shared/lib/db";

const opts = { tags: ["catalog"], revalidate: 300 };

export const getVehicleTypes = unstable_cache(
  async () => db.vehicleType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ["catalog-vehicle-types"],
  opts,
);

export const getServices = unstable_cache(
  async () => db.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ["catalog-services"],
  opts,
);

export const getRateCards = unstable_cache(
  async () => db.rateCard.findMany({ where: { isActive: true, vehicleType: { isActive: true }, service: { isActive: true } } }),
  ["catalog-rate-cards"],
  opts,
);

export async function getServiceBySlug(slug: string) {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}

/** "From ₹x" per service = cheapest active rate card. */
export async function getStartingPrices(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const r of await getRateCards()) out[r.serviceId] = Math.min(out[r.serviceId] ?? Infinity, r.minFare);
  return out;
}
