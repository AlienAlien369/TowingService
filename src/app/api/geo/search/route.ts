import { NextResponse } from "next/server";
import { getGeoProvider } from "@/modules/geo/service";
import { clientIp, rateLimit } from "@/shared/lib/guard";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 120) ?? "";
  if (q.trim().length < 3) return NextResponse.json({ results: [] });
  if (!(await rateLimit(`geo:${await clientIp()}`, 90, 600))) return NextResponse.json({ results: [], error: "rate_limited" }, { status: 429 });
  try {
    const results = await (await getGeoProvider()).search(q);
    return NextResponse.json({ results });
  } catch (e) {
    console.warn("[geo] search failed:", (e as Error).message);
    return NextResponse.json({ results: [], error: "unavailable" }, { status: 502 });
  }
}
