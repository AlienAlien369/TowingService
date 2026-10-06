import "server-only";
import { z } from "zod";
import { db } from "@/shared/lib/db";
import { audit, clientIp } from "@/shared/lib/guard";
import { normalizeEmail, normalizePhone, renderTemplate } from "@/shared/lib/utils";
import { asLocalized } from "@/shared/lib/localized";
import { getBrand, getSetting } from "@/modules/settings/service";
import { checkOtp, requestOtp } from "@/modules/auth/otp";
import { defer, onContractSigned, onDriverInvited, onProviderApplied, onProviderReviewed } from "@/modules/notifications/events";
import type { ContractParty, TruckKind } from "@/generated/prisma/enums";

const TRUCK_KINDS = ["FLATBED", "WHEEL_LIFT", "HOOK_CRANE", "HYDRAULIC_HEAVY", "BIKE_CARRIER", "SERVICE_VAN"] as const;
const opt = z.string().trim().max(200).optional().or(z.literal(""));

const truckSchema = z.object({
  registrationNo: z.string().trim().toUpperCase().regex(/^[A-Z0-9 -]{6,14}$/, "Enter a valid vehicle registration number"),
  kind: z.enum(TRUCK_KINDS),
  make: opt,
  model: opt,
  capacityKg: z.coerce.number().int().min(0).max(100000).optional(),
});

export const driverApplySchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().min(8),
  email: z.string().trim().min(5, "Enter your email"),
  licenseNo: z.string().trim().min(6, "Enter your driving licence number").max(25),
  licenseExpiry: z.string().optional(),
  pan: opt,
  address: z.string().trim().min(5, "Enter your address").max(300),
  vehicleTypeIds: z.array(z.string()).min(1, "Select at least one vehicle type you can tow"),
  serviceIds: z.array(z.string()).min(1, "Select at least one service you offer"),
  truck: truckSchema,
  upiId: opt,
  bankAccountName: opt,
  bankAccountNo: opt,
  bankIfsc: opt,
});

export const companyApplySchema = z.object({
  legalName: z.string().trim().min(2, "Enter the company legal name").max(120),
  tradeName: opt,
  gstin: z.string().trim().toUpperCase().regex(/^$|^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/, "Enter a valid 15-character GSTIN").optional().or(z.literal("")),
  pan: opt,
  address: z.string().trim().min(5, "Enter the registered address").max(300),
  contactEmail: z.string().trim().min(5, "Enter a contact email"),
  contactPhone: z.string().min(8),
  upiId: opt,
  bankAccountName: opt,
  bankAccountNo: opt,
  bankIfsc: opt,
});

type R = { ok: true; id: string } | { ok: false; error: string };

export async function applyAsDriver(userId: string, raw: unknown): Promise<R> {
  const p = driverApplySchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid details" };
  const d = p.data;
  const phone = normalizePhone(d.phone);
  const email = normalizeEmail(d.email);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  if (!email) return { ok: false, error: "Enter a valid email address." };
  if (await db.driver.findUnique({ where: { userId } })) return { ok: false, error: "You have already applied as a driver." };
  if (await db.truck.findUnique({ where: { registrationNo: d.truck.registrationNo } })) return { ok: false, error: "This vehicle is already registered with us." };

  const driver = await db.driver.create({
    data: {
      userId, name: d.name, phone, email, licenseNo: d.licenseNo, licenseExpiry: d.licenseExpiry ? new Date(d.licenseExpiry) : null, pan: d.pan || null, address: d.address,
      upiId: d.upiId || null, bankAccountName: d.bankAccountName || null, bankAccountNo: d.bankAccountNo || null, bankIfsc: d.bankIfsc || null,
      vehicleTypes: { connect: d.vehicleTypeIds.map((id) => ({ id })) },
      services: { connect: d.serviceIds.map((id) => ({ id })) },
      trucks: { create: { registrationNo: d.truck.registrationNo, kind: d.truck.kind as TruckKind, make: d.truck.make || null, model: d.truck.model || null, capacityKg: d.truck.capacityKg } },
    },
  });
  defer(() => onProviderApplied("DRIVER", driver.id));
  return { ok: true, id: driver.id };
}

export async function applyAsCompany(userId: string, raw: unknown): Promise<R> {
  const p = companyApplySchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid details" };
  const d = p.data;
  const phone = normalizePhone(d.contactPhone);
  const email = normalizeEmail(d.contactEmail);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  if (!email) return { ok: false, error: "Enter a valid email address." };
  if (await db.company.findFirst({ where: { ownerId: userId } })) return { ok: false, error: "You have already registered a company." };
  const c = await db.company.create({
    data: { ownerId: userId, legalName: d.legalName, tradeName: d.tradeName || null, gstin: d.gstin || null, pan: d.pan || null, address: d.address, contactEmail: email, contactPhone: phone, upiId: d.upiId || null, bankAccountName: d.bankAccountName || null, bankAccountNo: d.bankAccountNo || null, bankIfsc: d.bankIfsc || null },
  });
  defer(() => onProviderApplied("COMPANY", c.id));
  return { ok: true, id: c.id };
}

// ───────────────────────── contracts ─────────────────────────
export async function renderContractBody(party: ContractParty, vars: Record<string, string | number>, locale: "en" | "hi" = "en") {
  const tpl = await db.contractTemplate.findFirst({ where: { party, isActive: true }, orderBy: { version: "desc" } });
  if (!tpl) throw new Error(`No active ${party} contract template. Create one in Admin → Contract templates.`);
  const title = asLocalized(tpl.title);
  const body = asLocalized(tpl.body);
  return { tpl, title: title[locale] || title.en, body: renderTemplate(body[locale] || body.en, vars) };
}

async function contractVars(party: ContractParty, subject: { id: string; name: string; address: string; email: string; phone: string; gstin?: string | null }, commissionBp: number) {
  const [brand, biz] = await Promise.all([getBrand(), getSetting("business")]);
  return {
    brand: brand.name,
    legalEntity: biz.legalName || brand.name,
    companyAddress: `${brand.addressLine}, ${brand.city}, ${brand.state} ${brand.pincode}`,
    companyGstin: biz.gstin,
    providerName: subject.name,
    providerAddress: subject.address,
    providerEmail: subject.email,
    providerPhone: subject.phone,
    providerGstin: subject.gstin || "Not registered / not provided",
    commissionPct: (commissionBp / 100).toFixed(commissionBp % 100 ? 2 : 0),
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }),
    contractRef: `${party === "COMPANY" ? "C" : "D"}-${subject.id.slice(-8).toUpperCase()}`,
    supportEmail: brand.supportEmail,
    party: party === "COMPANY" ? "Fleet Partner" : "Independent Driver Partner",
  };
}

export async function reviewProvider(input: { kind: "COMPANY" | "DRIVER"; id: string; approve: boolean; note?: string; commissionPct?: number }, staffId: string, staffRole: string): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getSetting("pricing");
  const bp = Math.round((input.commissionPct ?? cfg.platformCommissionPct) * 100);
  if (input.kind === "COMPANY") {
    const c = await db.company.findUnique({ where: { id: input.id } });
    if (!c) return { ok: false, error: "Not found" };
    if (!input.approve) {
      await db.company.update({ where: { id: c.id }, data: { status: "REJECTED", reviewNote: input.note || null } });
    } else {
      const vars = await contractVars("COMPANY", { id: c.id, name: c.legalName, address: c.address, email: c.contactEmail, phone: c.contactPhone, gstin: c.gstin }, bp);
      const { tpl, title, body } = await renderContractBody("COMPANY", vars);
      await db.$transaction([
        db.company.update({ where: { id: c.id }, data: { status: "APPROVED", commissionBp: bp, reviewNote: input.note || null } }),
        db.user.updateMany({ where: { id: c.ownerId, role: "CUSTOMER" }, data: { role: "COMPANY_OWNER" } }),
        db.providerContract.create({ data: { templateId: tpl.id, templateVersion: tpl.version, party: "COMPANY", companyId: c.id, title, renderedBody: body, commissionBp: bp } }),
      ]);
    }
  } else {
    const d = await db.driver.findUnique({ where: { id: input.id } });
    if (!d) return { ok: false, error: "Not found" };
    if (d.companyId) return { ok: false, error: "Company drivers are covered by their company's agreement." };
    if (!input.approve) {
      await db.driver.update({ where: { id: d.id }, data: { status: "REJECTED", reviewNote: input.note || null } });
    } else {
      const vars = await contractVars("INDIVIDUAL", { id: d.id, name: d.name, address: d.address ?? "", email: d.email, phone: d.phone }, bp);
      const { tpl, title, body } = await renderContractBody("INDIVIDUAL", vars);
      await db.$transaction([
        db.driver.update({ where: { id: d.id }, data: { status: "APPROVED", commissionBp: bp, reviewNote: input.note || null } }),
        db.user.updateMany({ where: { id: d.userId, role: "CUSTOMER" }, data: { role: "DRIVER" } }),
        db.providerContract.create({ data: { templateId: tpl.id, templateVersion: tpl.version, party: "INDIVIDUAL", driverId: d.id, title, renderedBody: body, commissionBp: bp } }),
      ]);
    }
  }
  await audit({ actorId: staffId, actorRole: staffRole, action: input.approve ? "provider.approve" : "provider.reject", entity: input.kind, entityId: input.id, meta: { note: input.note, commissionBp: bp } });
  defer(() => onProviderReviewed(input.kind, input.id, input.approve, input.note));
  return { ok: true };
}

export async function setProviderSuspended(kind: "COMPANY" | "DRIVER", id: string, suspended: boolean, staffId: string) {
  const status = suspended ? "SUSPENDED" : "ACTIVE";
  if (kind === "COMPANY") await db.company.update({ where: { id }, data: { status } });
  else await db.driver.update({ where: { id }, data: { status, ...(suspended ? { isOnline: false } : {}) } });
  await audit({ actorId: staffId, action: suspended ? "provider.suspend" : "provider.reactivate", entity: kind, entityId: id });
}

async function ownedContract(userId: string, contractId: string) {
  const c = await db.providerContract.findUnique({ where: { id: contractId }, include: { company: true, driver: true } });
  if (!c) return null;
  const mine = c.company?.ownerId === userId || c.driver?.userId === userId;
  return mine ? c : null;
}

export async function requestContractOtp(userId: string, contractId: string) {
  const c = await ownedContract(userId, contractId);
  if (!c || c.status !== "SENT") return { ok: false as const, error: "Contract not found or already signed." };
  const email = c.company?.contactEmail ?? c.driver!.email;
  return requestOtp(email, "contract");
}

export async function signContract(userId: string, contractId: string, typedName: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const c = await ownedContract(userId, contractId);
  if (!c || c.status !== "SENT") return { ok: false, error: "Contract not found or already signed." };
  const expected = (c.company?.legalName ?? c.driver!.name).trim().toLowerCase();
  const typed = typedName.trim().toLowerCase();
  if (typed.length < 3) return { ok: false, error: "Type your full name to sign." };
  if (!expected.includes(typed) && !typed.includes(expected) && typed.split(/\s+/)[0] !== expected.split(/\s+/)[0])
    return { ok: false, error: `Type your name exactly as it appears on the agreement (“${c.company?.legalName ?? c.driver!.name}”).` };
  const email = c.company?.contactEmail ?? c.driver!.email;
  const ok = await checkOtp(email, code);
  if (!ok.ok) return { ok: false, error: ok.error };

  await db.$transaction([
    db.providerContract.update({ where: { id: c.id }, data: { status: "SIGNED", signedName: typedName.trim(), signedAt: new Date(), signedIp: await clientIp(), signedVia: "EMAIL_OTP", effectiveFrom: new Date() } }),
    ...(c.companyId ? [db.company.update({ where: { id: c.companyId }, data: { status: "ACTIVE" } }), db.driver.updateMany({ where: { companyId: c.companyId, status: "APPROVED" }, data: { status: "ACTIVE" } })] : []),
    ...(c.driverId ? [db.driver.update({ where: { id: c.driverId }, data: { status: "ACTIVE" } })] : []),
  ]);
  await audit({ actorId: userId, action: "contract.sign", entity: "ProviderContract", entityId: c.id, meta: { version: c.templateVersion } });
  defer(() => onContractSigned(c.id));
  return { ok: true };
}

// ───────────────────────── company fleet ─────────────────────────
export const addDriverSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().min(8),
  email: z.string().trim().min(5),
  licenseNo: z.string().trim().min(6).max(25),
});

export async function companyAddDriver(ownerId: string, raw: unknown): Promise<R> {
  const company = await db.company.findFirst({ where: { ownerId } });
  if (!company || !["APPROVED", "ACTIVE"].includes(company.status)) return { ok: false, error: "Your company must be approved first." };
  const p = addDriverSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid details" };
  const email = normalizeEmail(p.data.email);
  const phone = normalizePhone(p.data.phone);
  if (!email) return { ok: false, error: "Enter a valid email address." };
  if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number." };

  let user = (await db.user.findUnique({ where: { email } })) ?? (await db.user.findUnique({ where: { phone } }));
  if (user && ["DISPATCHER", "ADMIN", "SUPER_ADMIN", "COMPANY_OWNER"].includes(user.role)) return { ok: false, error: "This email/phone belongs to a staff or company account." };
  if (user && (await db.driver.findUnique({ where: { userId: user.id } }))) return { ok: false, error: "This person is already registered as a driver." };
  if (!user) user = await db.user.create({ data: { email, phone, name: p.data.name, role: "DRIVER" } });
  else user = await db.user.update({ where: { id: user.id }, data: { role: "DRIVER", email: user.email ?? email, phone: user.phone ?? phone, name: user.name ?? p.data.name } });

  const [vt, sv] = await Promise.all([db.vehicleType.findMany({ where: { isActive: true }, select: { id: true } }), db.service.findMany({ where: { isActive: true }, select: { id: true } })]);
  const d = await db.driver.create({
    data: { userId: user.id, companyId: company.id, name: p.data.name, phone, email, licenseNo: p.data.licenseNo, status: company.status === "ACTIVE" ? "ACTIVE" : "APPROVED", vehicleTypes: { connect: vt }, services: { connect: sv } },
  });
  await audit({ actorId: ownerId, action: "company.driver.add", entity: "Driver", entityId: d.id });
  defer(() => onDriverInvited(d.id));
  return { ok: true, id: d.id };
}

export async function companyRemoveDriver(ownerId: string, driverId: string) {
  const d = await db.driver.findFirst({ where: { id: driverId, company: { ownerId } } });
  if (!d) return { ok: false, error: "Driver not found." };
  await db.driver.update({ where: { id: d.id }, data: { status: "SUSPENDED", isOnline: false } });
  await audit({ actorId: ownerId, action: "company.driver.remove", entity: "Driver", entityId: d.id });
  return { ok: true };
}

export async function addTruck(owner: { driverId?: string; companyId?: string }, raw: unknown): Promise<R> {
  const p = truckSchema.safeParse(raw);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Invalid details" };
  if (await db.truck.findUnique({ where: { registrationNo: p.data.registrationNo } })) return { ok: false, error: "This vehicle is already registered." };
  const t = await db.truck.create({ data: { registrationNo: p.data.registrationNo, kind: p.data.kind as TruckKind, make: p.data.make || null, model: p.data.model || null, capacityKg: p.data.capacityKg, driverId: owner.driverId, companyId: owner.companyId } });
  return { ok: true, id: t.id };
}

// ───────────────────────── driver runtime ─────────────────────────
export async function setDriverOnline(driverId: string, online: boolean) {
  const d = await db.driver.findUnique({ where: { id: driverId } });
  if (!d) return { ok: false, error: "Driver not found." };
  if (online && d.status !== "ACTIVE") return { ok: false, error: "Your account isn't active yet. Sign your partner agreement first." };
  await db.driver.update({ where: { id: driverId }, data: { isOnline: online, ...(online ? { lastSeenAt: new Date() } : {}) } });
  return { ok: true };
}

export async function updateDriverLocation(driverId: string, lat: number, lng: number) {
  if (!(lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98)) return; // India sanity box
  await db.driver.update({ where: { id: driverId }, data: { lastLat: lat, lastLng: lng, lastSeenAt: new Date() } });
}

export async function getProviderContext(userId: string) {
  const [driver, company] = await Promise.all([
    db.driver.findUnique({ where: { userId }, include: { company: true, trucks: true, vehicleTypes: true, services: true } }),
    db.company.findFirst({ where: { ownerId: userId } }),
  ]);
  return { driver, company };
}
