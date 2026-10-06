import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/shared/lib/db";
import { env } from "@/shared/lib/env";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE = "rs_session";
const SESSION_DAYS = 30;

const hash = (token: string) => createHash("sha256").update(token + env.authSecret).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({
    data: {
      tokenHash: hash(token),
      userId,
      expiresAt,
      ip: (h.get("x-forwarded-for")?.split(",")[0] ?? "").trim() || null,
      userAgent: h.get("user-agent")?.slice(0, 200) ?? null,
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd && env.appUrl.startsWith("https"),
    path: "/",
    expires: expiresAt,
  });
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  return session.user;
});
export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(SESSION_COOKIE);
}

// ── RBAC ──
export const STAFF_ROLES: Role[] = ["DISPATCHER", "ADMIN", "SUPER_ADMIN"];
export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];
export const isStaff = (r: Role) => STAFF_ROLES.includes(r);
export const isAdmin = (r: Role) => ADMIN_ROLES.includes(r);
