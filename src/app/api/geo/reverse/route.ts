import { NextResponse } from "next/server";
import { getGeoProvider } from "@/modules/geo/service";
import { clientIp, rateLimit } from "@/shared/lib/guard";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!(await rateLimit(`geo:${await clientIp()}`, 90, 600))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  try {
    const label = await (await getGeoProvider()).reverse({ lat, lng });
    return NextResponse.json({ label: label ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  } catch {
    return NextResponse.json({ label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  }
}
