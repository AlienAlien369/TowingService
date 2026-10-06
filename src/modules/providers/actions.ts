"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { fail, type ActionResult } from "@/modules/auth/guards";
import { getCurrentUser } from "@/modules/auth/session";
import { trackServer } from "@/modules/analytics/track";
import { acceptOffer, declineOffer } from "@/modules/dispatch/service";
import { driverAdvance } from "@/modules/bookings/service";
import * as providers from "./service";

async function me() {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}
async function myDriver() {
  const u = await me();
  const d = await db.driver.findUnique({ where: { userId: u.id } });
  if (!d) throw new Error("NOT_A_DRIVER");
  return { user: u, driver: d };
}

// ───────── onboarding ─────────
export async function applyDriverAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const u = await getCurrentUser();
  if (!u) return fail("Please sign in first.");
  const r = await providers.applyAsDriver(u.id, input);
  if (!r.ok) return fail(r.error);
  void trackServer("partner_apply_submitted", { type: "DRIVER" }, { userId: u.id });
  return { ok: true, data: { id: r.id } };
}

export async function applyCompanyAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const u = await getCurrentUser();
  if (!u) return fail("Please sign in first.");
  const r = await providers.applyAsCompany(u.id, input);
  if (!r.ok) return fail(r.error);
  void trackServer("partner_apply_submitted", { type: "COMPANY" }, { userId: u.id });
  return { ok: true, data: { id: r.id } };
}

// ───────── contract e-signature ─────────
export async function requestContractOtpAction(contractId: string): Promise<ActionResult<{ devCode?: string; identifier: string }>> {
  const u = await me();
  const r = await providers.requestContractOtp(u.id, contractId);
  if (!r.ok) return fail(r.error);
  return { ok: true, data: { devCode: r.devCode, identifier: r.identifier } };
}

export async function signContractAction(contractId: string, typedName: string, code: string): Promise<ActionResult> {
  const u = await me();
  const r = await providers.signContract(u.id, contractId, typedName, code);
  if (!r.ok) return fail(r.error ?? "Could not sign.");
  void trackServer("contract_signed", { contractId }, { userId: u.id });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ───────── company fleet ─────────
export async function companyAddDriverAction(input: unknown): Promise<ActionResult> {
  const u = await me();
  const r = await providers.companyAddDriver(u.id, input);
  if (!r.ok) return fail(r.error);
  revalidatePath("/", "layout");
  return { ok: true, message: "Driver added. We've emailed them an invitation." };
}

export async function companyRemoveDriverAction(driverId: string): Promise<ActionResult> {
  const u = await me();
  const r = await providers.companyRemoveDriver(u.id, driverId);
  revalidatePath("/", "layout");
  return r.ok ? { ok: true } : fail(r.error ?? "Failed");
}

export async function addTruckAction(input: unknown): Promise<ActionResult> {
  const u = await me();
  const [driver, company] = await Promise.all([db.driver.findUnique({ where: { userId: u.id } }), db.company.findFirst({ where: { ownerId: u.id } })]);
  const owner = company ? { companyId: company.id } : driver ? { driverId: driver.id } : null;
  if (!owner) return fail("Not a partner account.");
  const r = await providers.addTruck(owner, input);
  revalidatePath("/", "layout");
  return r.ok ? { ok: true } : fail(r.error);
}

export async function updatePayoutAction(input: { upiId?: string; bankAccountName?: string; bankAccountNo?: string; bankIfsc?: string }): Promise<ActionResult> {
  const u = await me();
  const data = { upiId: input.upiId?.trim().slice(0, 80) || null, bankAccountName: input.bankAccountName?.trim().slice(0, 80) || null, bankAccountNo: input.bankAccountNo?.trim().slice(0, 30) || null, bankIfsc: input.bankIfsc?.trim().toUpperCase().slice(0, 15) || null };
  const company = await db.company.findFirst({ where: { ownerId: u.id } });
  if (company) await db.company.update({ where: { id: company.id }, data });
  else await db.driver.update({ where: { userId: u.id }, data });
  revalidatePath("/", "layout");
  return { ok: true, message: "Payout details saved." };
}

// ───────── driver runtime ─────────
export async function toggleOnlineAction(online: boolean): Promise<ActionResult> {
  const { driver } = await myDriver();
  const r = await providers.setDriverOnline(driver.id, online);
  return r.ok ? { ok: true } : fail(r.error ?? "Failed");
}

export async function updateCapabilitiesAction(vehicleTypeIds: string[], serviceIds: string[]): Promise<ActionResult> {
  const { driver } = await myDriver();
  if (!vehicleTypeIds.length || !serviceIds.length) return fail("Select at least one vehicle type and one service.");
  await db.driver.update({ where: { id: driver.id }, data: { vehicleTypes: { set: vehicleTypeIds.map((id) => ({ id })) }, services: { set: serviceIds.map((id) => ({ id })) } } });
  return { ok: true, message: "Saved." };
}

export async function acceptOfferAction(offerId: string): Promise<ActionResult> {
  const { driver } = await myDriver();
  if (driver.status !== "ACTIVE") return fail("Account not active.");
  const r = await acceptOffer(offerId, driver.id);
  revalidatePath("/", "layout");
  if (r.ok) void trackServer("job_accepted", { independent: !driver.companyId }, { userId: driver.userId });
  return r.ok ? { ok: true } : fail(r.error ?? "Could not accept.");
}

export async function declineOfferAction(offerId: string): Promise<ActionResult> {
  const { driver } = await myDriver();
  await declineOffer(offerId, driver.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function driverAdvanceAction(bookingId: string, pin?: string, pos?: { lat: number; lng: number }): Promise<ActionResult> {
  const { driver } = await myDriver();
  const r = await driverAdvance(bookingId, driver.id, { pin, pos });
  revalidatePath("/", "layout");
  return r.ok ? { ok: true } : fail(r.error);
}
