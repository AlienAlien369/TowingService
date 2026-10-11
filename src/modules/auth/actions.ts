"use server";

import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import { isLocale } from "@/shared/lib/localized";
import { fail, type ActionResult } from "./guards";
import { requestOtp, signInVerified, verifyOtp } from "./otp";
import { verifyFirebasePhoneToken } from "./firebase";
import { env } from "@/shared/lib/env";
import { clientIp, rateLimit } from "@/shared/lib/guard";
import { destroySession } from "./session";
import { trackServer } from "@/modules/analytics/track";
import { homeForRole, safeNext } from "./routing";

export async function requestOtpAction(identifier: string): Promise<ActionResult<{ identifier: string; channel: "EMAIL" | "SMS"; devCode?: string }>> {
  const r = await requestOtp(identifier);
  if (!r.ok) return fail(r.error);
  void trackServer("otp_requested", { channel: r.channel });
  return { ok: true, data: { identifier: r.identifier, channel: r.channel, devCode: r.devCode } };
}

export async function verifyOtpAction(input: { identifier: string; code: string; locale: string; next?: string; name?: string }): Promise<ActionResult<{ redirectTo: string; isNew: boolean }>> {
  const r = await verifyOtp(input.identifier, input.code, { name: input.name });
  if (!r.ok) return fail(r.error);
  const user = await db.user.findUniqueOrThrow({ where: { id: r.userId } });
  void trackServer("login_success", { isNew: r.isNew, role: user.role }, { userId: user.id });
  return { ok: true, data: { redirectTo: safeNext(input.next, homeForRole(user.role, input.locale)), isNew: r.isNew } };
}

export type FirebaseWebConfig = { apiKey: string; authDomain: string; projectId: string; appId: string };

/** Public web config for Firebase Phone Auth, or null when it isn't configured (the UI then uses SMS/email OTP). */
export async function firebaseConfigAction(): Promise<FirebaseWebConfig | null> {
  const f = env.firebase;
  return f.enabled ? { apiKey: f.apiKey, authDomain: f.authDomain, projectId: f.projectId, appId: f.appId } : null;
}

/** Signs in with a Firebase phone-auth ID token (verified server-side against Google's signing keys). */
export async function firebaseLoginAction(input: { idToken: string; locale: string; next?: string; name?: string }): Promise<ActionResult<{ redirectTo: string; isNew: boolean }>> {
  if (!(await rateLimit(`fbauth:ip:${await clientIp()}`, 30, 3600))) return fail("Too many attempts. Please try again in an hour.");
  const t = await verifyFirebasePhoneToken(input.idToken);
  if (!t.ok) return fail(t.error);
  const r = await signInVerified({ channel: "SMS", value: t.phone }, { name: input.name });
  if (!r.ok) return fail(r.error);
  const user = await db.user.findUniqueOrThrow({ where: { id: r.userId } });
  void trackServer("login_success", { isNew: r.isNew, role: user.role, via: "firebase" }, { userId: user.id });
  return { ok: true, data: { redirectTo: safeNext(input.next, homeForRole(user.role, input.locale)), isNew: r.isNew } };
}

export async function logoutAction(locale: string) {
  await destroySession();
  redirect(`/${isLocale(locale) ? locale : "en"}`);
}

export async function updateProfileAction(input: { name: string; locale?: string }): Promise<ActionResult> {
  const { getCurrentUser } = await import("./session");
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in.");
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) return fail("Enter your name.");
  await db.user.update({ where: { id: user.id }, data: { name, ...(input.locale && isLocale(input.locale) ? { locale: input.locale } : {}) } });
  return { ok: true };
}
