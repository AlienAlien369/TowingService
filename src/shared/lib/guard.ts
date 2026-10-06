import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

/** Fixed-window, DB-backed rate limiter (atomic upsert). Returns true when the call is allowed. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const resetAt = new Date(Date.now() + windowSec * 1000);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now() THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  return Number(rows[0]?.count ?? 1) <= limit;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export async function audit(input: {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    await db.auditLog.create({
      data: { ...input, meta: (input.meta ?? undefined) as object | undefined, ip: await clientIp().catch(() => null) },
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
