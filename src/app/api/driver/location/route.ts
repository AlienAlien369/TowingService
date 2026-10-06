import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/shared/lib/db";
import { rateLimit } from "@/shared/lib/guard";
import { getCurrentUser } from "@/modules/auth/session";
import { updateDriverLocation } from "@/modules/providers/service";

const body = z.object({ lat: z.number().min(6).max(38), lng: z.number().min(68).max(98) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const driver = await db.driver.findUnique({ where: { userId: user.id }, select: { id: true, isOnline: true } });
  if (!driver) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!(await rateLimit(`loc:${driver.id}`, 30, 60))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  await updateDriverLocation(driver.id, p.data.lat, p.data.lng);
  return NextResponse.json({ ok: true });
}
