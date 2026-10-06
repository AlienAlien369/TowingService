"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/shared/lib/db";
import { audit } from "@/shared/lib/guard";
import { parseForm } from "@/shared/forms";
import { fail, type ActionResult, assertRole } from "@/modules/auth/guards";
import { ADMIN_ROLES, STAFF_ROLES } from "@/modules/auth/session";
import { settingSchemas, type SettingKey } from "@/modules/settings/schemas";
import { settingMeta } from "@/modules/settings/fields";
import { updateSetting } from "@/modules/settings/service";
import { assignManually } from "@/modules/dispatch/service";
import { changeStatus } from "@/modules/bookings/service";
import { reviewProvider, setProviderSuspended } from "@/modules/providers/service";
import { buildSchema, resources, SLUG_RE } from "./resources";
import type { BookingStatus, Role } from "@/generated/prisma/enums";

const NULLABLE = new Set(["maxWeightKg"]);
const issue = (e: z.ZodError) => e.issues[0]?.message ?? "Invalid input";

// ───────────────────────── generic resources ─────────────────────────
export async function saveResourceAction(key: string, id: string | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const staff = await assertRole(ADMIN_ROLES);
  const res = resources[key];
  if (!res) return fail("Unknown resource");
  const parsed = buildSchema(res).safeParse(parseForm(formData, res.fields));
  if (!parsed.success) return fail(issue(parsed.error));
  let data = { ...parsed.data } as Record<string, unknown>;
  if (typeof data.slug === "string" && !SLUG_RE.test(data.slug)) return fail("Slug must be lowercase letters, numbers and dashes only.");
  for (const f of res.fields) {
    if (data[f.name] === undefined) {
      if (id && NULLABLE.has(f.name)) data[f.name] = null;
      else delete data[f.name];
    }
  }
  const existing = id ? await res.delegate.findUnique({ where: { id } }) : null;
  if (res.prepare) data = res.prepare(data, existing);
  try {
    const row = id ? await res.delegate.update({ where: { id }, data }) : await res.delegate.create({ data });
    for (const t of res.tags) updateTag(t);
    await audit({ actorId: staff.id, actorRole: staff.role, action: id ? "resource.update" : "resource.create", entity: key, entityId: String(row.id) });
    revalidatePath("/", "layout");
    return { ok: true, data: { id: String(row.id) } };
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "P2002") return fail("That slug / combination already exists. Pick a different one.");
    console.error("[admin] save failed", e);
    return fail("Could not save. Check the values and try again.");
  }
}

export async function deleteResourceAction(key: string, id: string): Promise<ActionResult> {
  const staff = await assertRole(ADMIN_ROLES);
  const res = resources[key];
  if (!res) return fail("Unknown resource");
  try {
    await res.delegate.delete({ where: { id } });
    for (const t of res.tags) updateTag(t);
    await audit({ actorId: staff.id, actorRole: staff.role, action: "resource.delete", entity: key, entityId: id });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return fail("This item is in use (bookings or other records refer to it). Deactivate it instead of deleting.");
  }
}

// ───────────────────────── settings ─────────────────────────
export async function saveSettingsAction(key: SettingKey, formData: FormData): Promise<ActionResult> {
  const staff = await assertRole(ADMIN_ROLES);
  const meta = settingMeta[key];
  if (!meta) return fail("Unknown settings group");
  const raw = parseForm(formData, meta.fields);
  // Numbers left blank fall back to schema defaults.
  for (const k of Object.keys(raw)) if (raw[k] === undefined) delete raw[k];
  const parsed = settingSchemas[key].safeParse(raw);
  if (!parsed.success) return fail(issue(parsed.error));
  await updateSetting(key, parsed.data, staff.id);
  await audit({ actorId: staff.id, actorRole: staff.role, action: "settings.update", entity: "SiteSetting", entityId: key });
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved. Changes are live." };
}

// ───────────────────────── providers ─────────────────────────
export async function reviewProviderAction(input: { kind: "COMPANY" | "DRIVER"; id: string; approve: boolean; note?: string; commissionPct?: number }): Promise<ActionResult> {
  const staff = await assertRole(ADMIN_ROLES);
  if (input.approve && input.commissionPct != null && (input.commissionPct < 0 || input.commissionPct > 60)) return fail("Commission must be between 0 and 60%.");
  const r = await reviewProvider(input, staff.id, staff.role);
  revalidatePath("/", "layout");
  return r.ok ? { ok: true } : fail(r.error ?? "Failed");
}

export async function suspendProviderAction(kind: "COMPANY" | "DRIVER", id: string, suspended: boolean): Promise<ActionResult> {
  const staff = await assertRole(ADMIN_ROLES);
  await setProviderSuspended(kind, id, suspended, staff.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setCommissionAction(kind: "COMPANY" | "DRIVER", id: string, pct: number): Promise<ActionResult> {
  const staff = await assertRole(ADMIN_ROLES);
  if (!(pct >= 0 && pct <= 60)) return fail("Commission must be between 0 and 60%.");
  const bp = Math.round(pct * 100);
  if (kind === "COMPANY") await db.company.update({ where: { id }, data: { commissionBp: bp } });
  else await db.driver.update({ where: { id }, data: { commissionBp: bp } });
  await audit({ actorId: staff.id, actorRole: staff.role, action: "provider.commission", entity: kind, entityId: id, meta: { bp } });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ───────────────────────── bookings / dispatch ─────────────────────────
export async function assignDriverAction(bookingId: string, driverId: string): Promise<ActionResult> {
  const staff = await assertRole(STAFF_ROLES);
  const r = await assignManually(bookingId, driverId, staff.id);
  revalidatePath("/", "layout");
  return r.ok ? { ok: true } : fail(r.error ?? "Failed");
}

export async function adminChangeStatusAction(bookingId: string, to: BookingStatus, note?: string): Promise<ActionResult> {
  const staff = await assertRole(STAFF_ROLES);
  const r = await changeStatus(bookingId, to, { type: "ADMIN", id: staff.id }, { note: note || `Set by ${staff.role.toLowerCase()}` });
  await audit({ actorId: staff.id, actorRole: staff.role, action: "booking.status", entity: "Booking", entityId: bookingId, meta: { to, note } });
  revalidatePath("/", "layout");
  return r.ok ? { ok: true } : fail(r.error);
}

export async function retryDispatchAction(bookingId: string): Promise<ActionResult> {
  const staff = await assertRole(STAFF_ROLES);
  const r = await changeStatus(bookingId, "PENDING_DISPATCH", { type: "ADMIN", id: staff.id }, { note: "Dispatch retried by staff" });
  if (!r.ok) return fail(r.error);
  revalidatePath("/", "layout");
  return { ok: true };
}

// ───────────────────────── money ─────────────────────────
export async function settleLedgerAction(ids: string[], ref: string): Promise<ActionResult> {
  const staff = await assertRole(ADMIN_ROLES);
  if (!ids.length) return fail("Select at least one entry.");
  await db.ledgerEntry.updateMany({ where: { id: { in: ids }, status: "PENDING" }, data: { status: "SETTLED", settledAt: new Date(), settlementRef: ref.trim().slice(0, 80) || null } });
  await audit({ actorId: staff.id, actorRole: staff.role, action: "ledger.settle", entity: "LedgerEntry", meta: { count: ids.length, ref } });
  revalidatePath("/", "layout");
  return { ok: true, message: `${ids.length} entries settled.` };
}

// ───────────────────────── users & leads ─────────────────────────
export async function setUserRoleAction(userId: string, role: Role): Promise<ActionResult> {
  const staff = await assertRole(["SUPER_ADMIN"]);
  if (userId === staff.id) return fail("You can't change your own role.");
  const allowed: Role[] = ["CUSTOMER", "DISPATCHER", "ADMIN", "SUPER_ADMIN"];
  if (!allowed.includes(role)) return fail("Invalid role.");
  await db.user.update({ where: { id: userId }, data: { role } });
  await db.session.deleteMany({ where: { userId } }); // force re-login with new permissions
  await audit({ actorId: staff.id, actorRole: staff.role, action: "user.role", entity: "User", entityId: userId, meta: { role } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<ActionResult> {
  const staff = await assertRole(ADMIN_ROLES);
  if (userId === staff.id) return fail("You can't disable yourself.");
  await db.user.update({ where: { id: userId }, data: { isActive: active } });
  if (!active) await db.session.deleteMany({ where: { userId } });
  await audit({ actorId: staff.id, actorRole: staff.role, action: active ? "user.enable" : "user.disable", entity: "User", entityId: userId });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function inviteStaffAction(email: string, role: Role): Promise<ActionResult> {
  const staff = await assertRole(["SUPER_ADMIN"]);
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return fail("Enter a valid email.");
  if (!["DISPATCHER", "ADMIN"].includes(role)) return fail("Invalid role.");
  await db.user.upsert({ where: { email: e }, create: { email: e, role }, update: { role } });
  await audit({ actorId: staff.id, actorRole: staff.role, action: "staff.invite", entity: "User", meta: { email: e, role } });
  revalidatePath("/", "layout");
  return { ok: true, message: `${e} can now sign in as ${role.toLowerCase()} using an email code.` };
}

export async function setLeadStatusAction(id: string, status: "NEW" | "CONTACTED" | "CLOSED"): Promise<ActionResult> {
  await assertRole(STAFF_ROLES);
  await db.lead.update({ where: { id }, data: { status } });
  revalidatePath("/", "layout");
  return { ok: true };
}
