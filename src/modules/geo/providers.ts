import "server-only";
import { env } from "@/shared/lib/env";
import { haversineKm } from "@/shared/lib/utils";

export type LatLng = { lat: number; lng: number };
export type Place = { label: string; lat: number; lng: number };
export type Route = { distanceKm: number; durationMin: number; geometry: [number, number][] | null; approximate: boolean };

export interface GeoProvider {
  name: "osm" | "google";
  search(query: string): Promise<Place[]>;
  reverse(p: LatLng): Promise<string | null>;
  route(a: LatLng, b: LatLng): Promise<Route>;
}

// tiny TTL cache so repeated lookups don't hammer public endpoints
const cache = new Map<string, { at: number; v: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.v as T;
  const v = await fn();
  cache.set(key, { at: Date.now(), v });
  if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  return v;
}

async function getJson<T>(url: string, init: RequestInit = {}, timeoutMs = 7000): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
  return (await res.json()) as T;
}

/** Straight-line fallback so quoting never hard-fails when the routing engine is down. */
export function approximateRoute(a: LatLng, b: LatLng): Route {
  const km = haversineKm(a, b) * 1.35; // city road factor
  return { distanceKm: Math.round(km * 10) / 10, durationMin: Math.max(5, Math.round((km / 22) * 60)), geometry: [[a.lat, a.lng], [b.lat, b.lng]], approximate: true };
}

// ───────────────────────── OpenStreetMap (Nominatim + OSRM) ─────────────────────────
const UA = { "User-Agent": `TowingPlatform/1.0 (${env.appUrl})`, "Accept-Language": "en" };

export const osmProvider: GeoProvider = {
  name: "osm",
  async search(query) {
    const q = query.trim();
    if (q.length < 3) return [];
    return cached(`osm:s:${q.toLowerCase()}`, 10 * 60_000, async () => {
      const url = `${env.nominatimUrl}/search?format=jsonv2&limit=6&countrycodes=in&viewbox=76.80,28.95,77.45,28.30&q=${encodeURIComponent(q.includes("delhi") ? q : `${q}, Delhi`)}`;
      const rows = await getJson<{ display_name: string; lat: string; lon: string }[]>(url, { headers: UA });
      return rows.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
    });
  },
  async reverse(p) {
    return cached(`osm:r:${p.lat.toFixed(4)},${p.lng.toFixed(4)}`, 60 * 60_000, async () => {
      const r = await getJson<{ display_name?: string }>(`${env.nominatimUrl}/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lng}`, { headers: UA });
      return r.display_name ?? null;
    });
  },
  async route(a, b) {
    try {
      const url = `${env.osrmUrl}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=simplified&geometries=geojson`;
      const r = await getJson<{ routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] }>(url);
      const best = r.routes?.[0];
      if (!best) return approximateRoute(a, b);
      return {
        distanceKm: Math.round((best.distance / 1000) * 10) / 10,
        durationMin: Math.max(1, Math.round(best.duration / 60)),
        geometry: best.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
        approximate: false,
      };
    } catch (e) {
      console.warn("[geo] OSRM unavailable, using approximation:", (e as Error).message);
      return approximateRoute(a, b);
    }
  },
};

// ───────────────────────── Google Maps (swap-in) ─────────────────────────
function decodePolyline(str: string): [number, number][] {
  const out: [number, number][] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    for (const axis of [0, 1]) {
      let shift = 0, result = 0, byte: number;
      do {
        byte = str.charCodeAt(i++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += d;
      else lng += d;
    }
    out.push([lat / 1e5, lng / 1e5]);
  }
  return out;
}

export const googleProvider: GeoProvider = {
  name: "google",
  async search(query) {
    const q = query.trim();
    if (q.length < 3) return [];
    return cached(`g:s:${q.toLowerCase()}`, 10 * 60_000, async () => {
      const r = await getJson<{ results: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[] }>(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&components=country:IN&bounds=28.30,76.80|28.95,77.45&key=${env.googleMapsKey}`,
      );
      return r.results.slice(0, 6).map((x) => ({ label: x.formatted_address, ...x.geometry.location }));
    });
  },
  async reverse(p) {
    const r = await getJson<{ results: { formatted_address: string }[] }>(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${p.lat},${p.lng}&key=${env.googleMapsKey}`);
    return r.results[0]?.formatted_address ?? null;
  },
  async route(a, b) {
    try {
      const r = await getJson<{ routes: { overview_polyline: { points: string }; legs: { distance: { value: number }; duration: { value: number } }[] }[] }>(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&key=${env.googleMapsKey}`,
      );
      const route = r.routes[0];
      if (!route) return approximateRoute(a, b);
      const leg = route.legs[0];
      return { distanceKm: Math.round((leg.distance.value / 1000) * 10) / 10, durationMin: Math.round(leg.duration.value / 60), geometry: decodePolyline(route.overview_polyline.points), approximate: false };
    } catch {
      return approximateRoute(a, b);
    }
  },
};
