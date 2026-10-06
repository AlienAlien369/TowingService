import { NextResponse } from "next/server";
import { advanceIfStale } from "@/modules/dispatch/service";
import { buildTrackData } from "@/modules/bookings/track-data";
import { getCurrentUser } from "@/modules/auth/session";
import { clientIp, rateLimit } from "@/shared/lib/guard";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!/^[A-Za-z0-9-]{4,20}$/.test(code)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!(await rateLimit(`track:${await clientIp()}`, 240, 600))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let data = await buildTrackData(code, await getCurrentUser());
  if (data?.status === "OFFERED") {
    await advanceIfStale(data.id);
    data = await buildTrackData(code, await getCurrentUser());
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
