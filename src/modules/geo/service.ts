import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/shared/lib/db";
import { env } from "@/shared/lib/env";
import { haversineKm } from "@/shared/lib/utils";
import { getSetting } from "@/modules/settings/service";
import { googleProvider, osmProvider, type GeoProvider, type LatLng } from "./providers";

/** Resolves the active provider: Admin → Settings → Maps overrides MAP_PROVIDER; Google needs a key. */
export async function getGeoProvider(): Promise<GeoProvider> {
  const maps = await getSetting("maps");
  const choice = maps.provider === "env" ? env.mapProvider : maps.provider;
  return choice === "google" && env.googleMapsKey ? googleProvider : osmProvider;
}

const loadAreas = unstable_cache(
  async () => db.area.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ["areas-active"],
  { tags: ["areas"], revalidate: 300 },
);

export type Serviceability = { status: "ACTIVE" | "COMING_SOON" | "OUT"; areaName?: string; city?: string };

/** Pickup must fall inside an ACTIVE area. COMING_SOON areas get lead capture instead of a booking. */
export async function checkServiceability(p: LatLng): Promise<Serviceability> {
  const areas = await loadAreas();
  let soon: Serviceability | null = null;
  for (const a of areas) {
    if (haversineKm(p, a) > a.radiusKm) continue;
    const name = (a.name as { en?: string }).en;
    if (a.status === "ACTIVE") return { status: "ACTIVE", areaName: name, city: a.city };
    soon ??= { status: "COMING_SOON", areaName: name, city: a.city };
  }
  return soon ?? { status: "OUT" };
}
