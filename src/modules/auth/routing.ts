import { isLocale } from "@/shared/lib/localized";
import type { Role } from "@/generated/prisma/enums";

export function homeForRole(role: Role, locale: string): string {
  const l = isLocale(locale) ? locale : "en";
  if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "DISPATCHER") return `/${l}/admin`;
  if (role === "DRIVER") return `/${l}/driver`;
  if (role === "COMPANY_OWNER") return `/${l}/partner-portal`;
  return `/${l}/account`;
}

/** Only same-site relative paths are accepted as post-login destinations (prevents open redirects). */
export function safeNext(next: string | undefined, fallback: string): string {
  return next && /^\/(en|hi)(\/|$)/.test(next) && !next.startsWith("//") ? next : fallback;
}
