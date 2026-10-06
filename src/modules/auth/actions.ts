"use server";

import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import { isLocale } from "@/shared/lib/localized";
import { fail, type ActionResult } from "./guards";
import { requestOtp, verifyOtp } from "./otp";
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
