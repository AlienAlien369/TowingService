import { NextResponse } from "next/server";
import { z } from "zod";
import { EVENTS, trackServer, type EventName } from "@/modules/analytics/track";
import { getCurrentUser } from "@/modules/auth/session";
import { rateLimit, clientIp } from "@/shared/lib/guard";

const schema = z.object({ name: z.string(), props: z.record(z.string(), z.unknown()).optional(), path: z.string().max(200).optional() });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !(EVENTS as readonly string[]).includes(parsed.data.name)) return NextResponse.json({ ok: false }, { status: 400 });
  if (!(await rateLimit(`evt:${await clientIp()}`, 120, 60))) return NextResponse.json({ ok: false }, { status: 429 });
  const user = await getCurrentUser();
  if (user && ["DISPATCHER", "ADMIN", "SUPER_ADMIN"].includes(user.role)) return NextResponse.json({ ok: true, skipped: "internal" });
  await trackServer(parsed.data.name as EventName, parsed.data.props, { userId: user?.id, path: parsed.data.path });
  return NextResponse.json({ ok: true });
}
