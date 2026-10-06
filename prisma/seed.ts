import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SETTING_KEYS, settingSchemas } from "../src/modules/settings/schemas";
import { areas, buildRateCards, contractTemplates, faqs, pages, services, testimonials, vehicleTypes } from "./seed-data";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  console.log("🌱 Seeding…");

  // Settings: only create missing groups, never overwrite what an admin has edited.
  for (const key of SETTING_KEYS) {
    const exists = await db.siteSetting.findUnique({ where: { key } });
    if (!exists) {
      const value = settingSchemas[key].parse(key === "brand" && process.env.BRAND_NAME ? { name: process.env.BRAND_NAME } : {});
      await db.siteSetting.create({ data: { key, value: value as object } });
    }
  }

  // Catalog: upsert by slug but keep admin-edited copy/prices (update = {} for existing rows).
  const vt = new Map<string, string>();
  for (const [i, v] of vehicleTypes.entries()) {
    const row = await db.vehicleType.upsert({ where: { slug: v.slug }, create: { ...v, sortOrder: i }, update: {} });
    vt.set(v.slug, row.id);
  }
  const sv = new Map<string, string>();
  for (const [i, s] of services.entries()) {
    const row = await db.service.upsert({ where: { slug: s.slug }, create: { ...s, sortOrder: i }, update: {} });
    sv.set(s.slug, row.id);
  }
  for (const r of buildRateCards()) {
    const vehicleTypeId = vt.get(r.vehicle)!;
    const serviceId = sv.get(r.service)!;
    await db.rateCard.upsert({
      where: { vehicleTypeId_serviceId: { vehicleTypeId, serviceId } },
      create: { vehicleTypeId, serviceId, baseFare: r.baseFare, includedKm: r.includedKm, perKm: r.perKm, minFare: r.minFare },
      update: {},
    });
  }

  for (const a of areas) await db.area.upsert({ where: { slug: a.slug }, create: a, update: {} });

  if ((await db.faq.count()) === 0) await db.faq.createMany({ data: faqs.map((f, i) => ({ ...f, sortOrder: i })) });
  if ((await db.testimonial.count()) === 0) await db.testimonial.createMany({ data: testimonials });
  for (const p of pages) await db.page.upsert({ where: { slug: p.slug }, create: { ...p, kind: "LEGAL" }, update: {} });
  for (const t of contractTemplates) await db.contractTemplate.upsert({ where: { party_version: { party: t.party, version: t.version } }, create: t, update: {} });

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (adminEmail) {
    await db.user.upsert({ where: { email: adminEmail }, create: { email: adminEmail, name: "Super Admin", role: "SUPER_ADMIN", emailVerifiedAt: new Date() }, update: { role: "SUPER_ADMIN" } });
    console.log(`  admin: ${adminEmail}`);
  }

  if (process.env.SEED_DEMO === "true") await seedDemo(vt, sv);
  console.log("✅ Seed complete");
}

/** Demo partners so dispatch can be tried end-to-end locally. Never run in production. */
async function seedDemo(vt: Map<string, string>, sv: Map<string, string>) {
  console.log("  demo partners…");
  const allVt = [...vt.values()].map((id) => ({ id }));
  const allSv = [...sv.values()].map((id) => ({ id }));
  const now = new Date();
  const contract = (tplId: string, party: "INDIVIDUAL" | "COMPANY", ref: { driverId?: string; companyId?: string }, name: string) => ({
    templateId: tplId, templateVersion: 1, party, ...ref, title: `${party === "COMPANY" ? "Fleet Partner" : "Independent Driver Partner"} Agreement`,
    renderedBody: `Demo agreement signed by ${name}.`, commissionBp: 2000, status: "SIGNED" as const, signedName: name, signedAt: now, signedVia: "EMAIL_OTP", effectiveFrom: now,
  });
  const tplInd = await db.contractTemplate.findFirstOrThrow({ where: { party: "INDIVIDUAL" } });
  const tplCo = await db.contractTemplate.findFirstOrThrow({ where: { party: "COMPANY" } });

  const person = async (email: string, phone: string, name: string, role: "DRIVER" | "COMPANY_OWNER") =>
    db.user.upsert({ where: { email }, create: { email, phone, name, role, emailVerifiedAt: now, phoneVerifiedAt: now }, update: { role } });

  // Independent drivers
  const indep = [
    { email: "driver.cp@demo.test", phone: "+919810000001", name: "Ramesh Kumar", reg: "DL1LAB0001", kind: "FLATBED" as const, lat: 28.6315, lng: 77.2167 },
    { email: "driver.saket@demo.test", phone: "+919810000002", name: "Imran Khan", reg: "DL3CAB0002", kind: "WHEEL_LIFT" as const, lat: 28.5355, lng: 77.21 },
    { email: "driver.dwarka@demo.test", phone: "+919810000003", name: "Gurpreet Singh", reg: "DL1RTA0003", kind: "FLATBED" as const, lat: 28.58, lng: 77.05 },
  ];
  for (const d of indep) {
    const u = await person(d.email, d.phone, d.name, "DRIVER");
    if (await db.driver.findUnique({ where: { userId: u.id } })) continue;
    const drv = await db.driver.create({
      data: { userId: u.id, name: d.name, phone: d.phone, email: d.email, licenseNo: "DL-0420110012345", status: "ACTIVE", isOnline: true, lastLat: d.lat, lastLng: d.lng, lastSeenAt: now, commissionBp: 2000, ratingAvg: 4.7, ratingCount: 38,
        vehicleTypes: { connect: allVt }, services: { connect: allSv }, trucks: { create: { registrationNo: d.reg, kind: d.kind, make: "Tata", model: "LPT 407", capacityKg: 3500 } } },
    });
    await db.providerContract.create({ data: contract(tplInd.id, "INDIVIDUAL", { driverId: drv.id }, d.name) });
  }

  // Fleet company with two drivers
  const owner = await person("owner@demo-fleet.test", "+919810000010", "Anil Sharma", "COMPANY_OWNER");
  let company = await db.company.findFirst({ where: { ownerId: owner.id } });
  if (!company) {
    company = await db.company.create({ data: { ownerId: owner.id, legalName: "Sharma Towing & Recovery Pvt Ltd", tradeName: "Sharma Towing", gstin: "07ABCDE1234F1Z5", address: "Plot 4, Mayapuri Industrial Area, Delhi", contactEmail: owner.email!, contactPhone: owner.phone!, status: "ACTIVE", commissionBp: 1800, upiId: "sharma@upi" } });
    await db.providerContract.create({ data: contract(tplCo.id, "COMPANY", { companyId: company.id }, "Anil Sharma") });
    await db.truck.create({ data: { registrationNo: "DL1LCD0100", kind: "HYDRAULIC_HEAVY", capacityKg: 20000, companyId: company.id } });
    for (const d of [
      { email: "fleet.driver1@demo.test", phone: "+919810000011", name: "Sunil Yadav", lat: 28.7, lng: 77.2 },
      { email: "fleet.driver2@demo.test", phone: "+919810000012", name: "Mohit Verma", lat: 28.6519, lng: 77.19 },
    ]) {
      const u = await person(d.email, d.phone, d.name, "DRIVER");
      const drv = await db.driver.create({
        data: { userId: u.id, companyId: company.id, name: d.name, phone: d.phone, email: d.email, licenseNo: "DL-0520120054321", status: "ACTIVE", isOnline: true, lastLat: d.lat, lastLng: d.lng, lastSeenAt: now, ratingAvg: 4.5, ratingCount: 12,
          vehicleTypes: { connect: allVt }, services: { connect: allSv }, trucks: { create: { registrationNo: `DL1LF${d.phone.slice(-4)}`, kind: "FLATBED", capacityKg: 5000, companyId: company.id } } },
      });
      void drv;
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
