import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/shared/lib/db";
import { env } from "@/shared/lib/env";
import { clientIp, rateLimit } from "@/shared/lib/guard";
import { normalizeEmail, normalizePhone, randomOtp } from "@/shared/lib/utils";
import { sendOtpMessage } from "@/modules/notifications/events";
import { createSession } from "./session";

const OTP_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

const hashCode = (identifier: string, code: string) => createHash("sha256").update(`${identifier}:${code}:${env.authSecret}`).digest("hex");

export type Identifier = { channel: "EMAIL" | "SMS"; value: string };

export function parseIdentifier(raw: string): Identifier | null {
  const v = raw.trim();
  if (v.includes("@")) {
    const e = normalizeEmail(v);
    return e ? { channel: "EMAIL", value: e } : null;
  }
  const p = normalizePhone(v);
  return p ? { channel: "SMS", value: p } : null;
}

export type OtpRequestResult = { ok: true; identifier: string; channel: "EMAIL" | "SMS"; devCode?: string } | { ok: false; error: string };

export async function requestOtp(raw: string, purpose = "login"): Promise<OtpRequestResult> {
  const id = parseIdentifier(raw);
  if (!id) return { ok: false, error: "Enter a valid email address or 10-digit Indian mobile number." };

  const ip = await clientIp();
  if (!(await rateLimit(`otp:id:${id.value}`, 5, 3600)) || !(await rateLimit(`otp:ip:${ip}`, 30, 3600)))
    return { ok: false, error: "Too many attempts. Please try again in an hour." };
  if (!(await rateLimit(`otp:cool:${id.value}`, 1, 30))) return { ok: false, error: "Please wait 30 seconds before requesting another code." };

  const code = randomOtp();
  await db.otpChallenge.create({
    data: { identifier: id.value, channel: id.channel, purpose, codeHash: hashCode(id.value, code), expiresAt: new Date(Date.now() + OTP_TTL_MS), ip },
  });
  const sent = await sendOtpMessage(id.channel, id.value, code);
  if (!sent && env.isProd && !env.exposeDevOtp) return { ok: false, error: "We couldn't send the code right now. Please try again." };
  return { ok: true, identifier: id.value, channel: id.channel, devCode: env.exposeDevOtp ? code : undefined };
}

/** Validates and consumes the newest unexpired code for the identifier (no session side-effects). */
export async function checkOtp(raw: string, code: string): Promise<{ ok: true; id: Identifier } | { ok: false; error: string }> {
  const id = parseIdentifier(raw);
  if (!id || !/^\d{6}$/.test(code.trim())) return { ok: false, error: "Enter the 6-digit code." };

  const ch = await db.otpChallenge.findFirst({
    where: { identifier: id.value, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!ch || ch.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Code expired. Please request a new one." };

  const a = Buffer.from(ch.codeHash);
  const b = Buffer.from(hashCode(id.value, code.trim()));
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await db.otpChallenge.update({ where: { id: ch.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: "Incorrect code. Please check and try again." };
  }
  await db.otpChallenge.update({ where: { id: ch.id }, data: { consumedAt: new Date() } });
  return { ok: true, id };
}

export type VerifyResult = { ok: true; userId: string; isNew: boolean } | { ok: false; error: string };

/** Verifies the code; on success finds/creates the user, marks the channel verified and starts a session. */
export async function verifyOtp(raw: string, code: string, profile?: { name?: string }): Promise<VerifyResult> {
  const checked = await checkOtp(raw, code);
  if (!checked.ok) return checked;
  const id = checked.id;

  const where = id.channel === "EMAIL" ? { email: id.value } : { phone: id.value };
  const isOwner = id.channel === "EMAIL" && env.adminEmail !== "" && id.value === env.adminEmail;
  let user = await db.user.findUnique({ where });
  const isNew = !user;
  const now = new Date();
  const verified = id.channel === "EMAIL" ? { emailVerifiedAt: now } : { phoneVerifiedAt: now };
  if (!user) {
    user = await db.user.create({ data: { ...where, ...verified, name: profile?.name?.trim() || undefined, role: isOwner ? "SUPER_ADMIN" : "CUSTOMER" } });
  } else {
    if (!user.isActive) return { ok: false, error: "This account is disabled. Contact support." };
    user = await db.user.update({
      where: { id: user.id },
      data: { ...verified, ...(profile?.name && !user.name ? { name: profile.name.trim() } : {}), ...(isOwner ? { role: "SUPER_ADMIN" as const } : {}) },
    });
  }
  await createSession(user.id);
  return { ok: true, userId: user.id, isNew };
}
