import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import type { Locale } from "@/shared/lib/localized";
import { getCurrentUser } from "./session";

/** Page-level guard: redirects to login (preserving the destination) or home when forbidden. */
export async function requireUser(locale: Locale, next: string, roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(user.role)) redirect(`/${locale}?forbidden=1`);
  return user;
}

/** Action-level guard: throws instead of redirecting (server actions must always re-check). */
export async function assertRole(roles: Role[]) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}

export class ActionError extends Error {}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const fail = (error: string, fieldErrors?: Record<string, string>): { ok: false; error: string; fieldErrors?: Record<string, string> } => ({ ok: false, error, fieldErrors });
