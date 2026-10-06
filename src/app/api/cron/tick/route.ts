import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/shared/lib/env";
import { db } from "@/shared/lib/db";
import { dispatchTick } from "@/modules/dispatch/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Called every minute by Vercel Cron / the docker `cron` service. Idempotent. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.cronSecret}`;
  if (auth.length !== expected.length || !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await dispatchTick();
  // housekeeping: expired sessions / OTPs / rate-limit rows
  const now = new Date();
  const [s, o, r] = await Promise.all([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.otpChallenge.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 86_400_000) } } }),
    db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
  ]);
  // drivers that stopped reporting for 30+ minutes drop offline so they stop receiving offers
  const stale = await db.driver.updateMany({ where: { isOnline: true, lastSeenAt: { lt: new Date(now.getTime() - 30 * 60_000) } }, data: { isOnline: false } });
  return NextResponse.json({ ok: true, ...result, cleaned: { sessions: s.count, otps: o.count, rateLimits: r.count }, driversOffline: stale.count });
}
