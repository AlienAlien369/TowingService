import "server-only";
import { after } from "next/server";
import { db } from "@/shared/lib/db";
import { env } from "@/shared/lib/env";
import { formatINR } from "@/shared/lib/utils";
import { L } from "@/shared/lib/localized";
import { getBrand, getSettings } from "@/modules/settings/service";
import { sendEmail, sendSms } from "./channels";
import { esc, renderEmail, row, stripTags, table } from "./layout";

/** Run work after the response is sent (serverless-safe); falls back to fire-and-forget. */
export function defer(fn: () => Promise<unknown>) {
  const run = () => fn().catch((e) => console.error("[notify]", e));
  try {
    after(run);
  } catch {
    void run();
  }
}

async function mail(to: string | string[], template: string, subject: string, parts: Parameters<typeof renderEmail>[1], bookingId?: string) {
  const brand = await getBrand();
  const html = renderEmail(brand, parts);
  return sendEmail({ to, subject, html, text: stripTags(html), template, bookingId });
}

const link = (path: string) => `${env.appUrl}${path}`;

// ───────────── OTP ─────────────
export async function sendOtpMessage(channel: "EMAIL" | "SMS", to: string, code: string) {
  const brand = await getBrand();
  if (channel === "SMS") {
    return sendSms({ to, template: "otp", otp: code, text: `${code} is your ${brand.name} verification code. Valid for 10 minutes. Do not share it with anyone.` });
  }
  return mail(to, "otp", `${code} is your ${brand.name} sign-in code`, {
    title: "Your sign-in code",
    preheader: `Use ${code} to sign in`,
    body: `<p>Enter this code to continue. It is valid for 10 minutes.</p><p style="font-size:34px;letter-spacing:8px;font-weight:900;margin:18px 0">${esc(code)}</p>`,
    footnote: "If you did not request this, you can safely ignore this email. Never share this code with anyone.",
  });
}

// ───────────── bookings ─────────────
async function loadBooking(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: { vehicleType: true, service: true, customer: true, driver: { include: { company: { include: { owner: true } }, trucks: { where: { isActive: true }, take: 1 } } } },
  });
}
type FullBooking = NonNullable<Awaited<ReturnType<typeof loadBooking>>>;

const bookingTable = (b: FullBooking) =>
  table(
    row("Booking", b.code) +
      row("Service", `${L(b.service.name, "en")} · ${L(b.vehicleType.name, "en")}`) +
      row("Pickup", b.pickupAddress) +
      (b.dropAddress ? row("Drop", b.dropAddress) : "") +
      row("Fare (incl. GST)", formatINR(b.total)) +
      row("Payment", b.paymentMethod === "CASH" ? "Pay after service" : "Online (Razorpay)"),
  );

export async function onBookingCreated(bookingId: string) {
  const [b, s, brand] = await Promise.all([loadBooking(bookingId), getSettings(), getBrand()]);
  if (!b) return;
  const track = link(`/en/track/${b.code}`);
  if (b.contactEmail && s.notifications.emailCustomers)
    await mail(b.contactEmail, "booking-created", `Booking ${b.code} received – ${brand.name}`, {
      title: "We're finding a driver for you",
      preheader: `Booking ${b.code}`,
      body: `<p>Hi ${esc(b.contactName)}, your request is confirmed. We'll assign the nearest verified driver and notify you right away.</p>${bookingTable(b)}<p>Your trip PIN is <strong style="font-size:20px;letter-spacing:3px">${esc(b.startPin)}</strong> – share it with the driver only when they arrive.</p>`,
      cta: { label: "Track my booking", href: track },
    }, b.id);
  if (s.notifications.smsCustomers)
    await sendSms({ to: b.contactPhone, template: "booking-created", bookingId: b.id, text: `${brand.name}: booking ${b.code} confirmed. Trip PIN ${b.startPin}. Track: ${track}` });
  const ops = s.notifications.adminAlertEmail || brand.supportEmail;
  if (ops)
    await mail(ops, "ops-new-booking", `New booking ${b.code}`, {
      title: "New booking",
      body: `${bookingTable(b)}${table(row("Customer", `${b.contactName} · ${b.contactPhone}`))}`,
      cta: { label: "Open in admin", href: link(`/en/admin/bookings/${b.id}`) },
    }, b.id);
}

export async function onJobOffered(driverIds: string[], bookingId: string) {
  const [b, s, brand] = await Promise.all([loadBooking(bookingId), getSettings(), getBrand()]);
  if (!b) return;
  const drivers = await db.driver.findMany({ where: { id: { in: driverIds } } });
  for (const d of drivers) {
    if (s.notifications.smsDrivers)
      await sendSms({ to: d.phone, template: "job-offer", bookingId, text: `${brand.name}: new ${L(b.service.name, "en")} job near ${b.pickupAddress.slice(0, 40)}. Open the driver app to accept: ${link("/en/driver")}` });
  }
}

export async function onDriverAssigned(bookingId: string) {
  const [b, s, brand] = await Promise.all([loadBooking(bookingId), getSettings(), getBrand()]);
  if (!b || !b.driver) return;
  const d = b.driver;
  const truck = d.trucks[0];
  const track = link(`/en/track/${b.code}`);
  // customer
  if (b.contactEmail && s.notifications.emailCustomers)
    await mail(b.contactEmail, "driver-assigned", `Driver assigned for ${b.code}`, {
      title: `${d.name} is on the way`,
      body: `<p>Your driver has been assigned.</p>${table(row("Driver", `${d.name} · ${d.phone}`) + row("Truck", truck ? `${truck.registrationNo} (${truck.kind.replace("_", " ").toLowerCase()})` : "—") + row("Trip PIN", b.startPin))}${bookingTable(b)}`,
      cta: { label: "Live tracking", href: track },
    }, b.id);
  if (s.notifications.smsCustomers)
    await sendSms({ to: b.contactPhone, template: "driver-assigned", bookingId: b.id, text: `${brand.name}: ${d.name} (${d.phone}) is on the way${truck ? `, truck ${truck.registrationNo}` : ""}. PIN ${b.startPin}. Track: ${track}` });
  // driver
  const jobTable = table(row("Booking", b.code) + row("Customer", `${b.contactName} · ${b.contactPhone}`) + row("Pickup", b.pickupAddress) + (b.dropAddress ? row("Drop", b.dropAddress) : "") + row("Service", `${L(b.service.name, "en")} · ${L(b.vehicleType.name, "en")}`) + row("Fare", formatINR(b.total)));
  if (s.notifications.emailDrivers)
    await mail(d.email, "job-assigned-driver", `Job assigned: ${b.code}`, {
      title: "New job assigned to you",
      body: `<p>Hi ${esc(d.name)}, you have a new job.</p>${jobTable}<p>Ask the customer for the 4-digit trip PIN when you arrive.</p>`,
      cta: { label: "Open driver app", href: link("/en/driver") },
    }, b.id);
  if (s.notifications.smsDrivers)
    await sendSms({ to: d.phone, template: "job-assigned-driver", bookingId: b.id, text: `${brand.name}: job ${b.code} assigned. Pickup: ${b.pickupAddress.slice(0, 60)}. Customer ${b.contactPhone}.` });
  // company (driver belongs to a company)
  if (d.company && s.notifications.emailCompanies)
    await mail(d.company.contactEmail, "job-assigned-company", `${d.name} assigned to job ${b.code}`, {
      title: "Your driver got a job",
      body: `<p>${esc(d.name)} from ${esc(d.company.tradeName || d.company.legalName)} has been assigned a job.</p>${jobTable}`,
      cta: { label: "Open partner portal", href: link("/en/partner-portal") },
    }, b.id);
}

export async function onBookingStatus(bookingId: string) {
  const [b, s, brand] = await Promise.all([loadBooking(bookingId), getSettings(), getBrand()]);
  if (!b) return;
  const track = link(`/en/track/${b.code}`);
  const msg: Partial<Record<FullBooking["status"], string>> = {
    EN_ROUTE: `${b.driver?.name ?? "Your driver"} is on the way.`,
    ARRIVED: `Your driver has arrived. Share PIN ${b.startPin} to start.`,
    IN_PROGRESS: "Service in progress.",
    COMPLETED: "Service completed. Thank you for choosing us!",
    CANCELLED: "Your booking was cancelled.",
    NO_DRIVER_FOUND: "We're sorry, no driver is available right now. Our team will call you shortly.",
  };
  const text = msg[b.status];
  if (!text) return;
  if (b.status === "NO_DRIVER_FOUND") {
    const ops = s.notifications.adminAlertEmail || brand.supportEmail;
    if (ops) await mail(ops, "ops-no-driver", `⚠ No driver found for ${b.code}`, { title: "Dispatcher action needed", body: `${bookingTable(b)}${table(row("Customer", `${b.contactName} · ${b.contactPhone}`))}`, cta: { label: "Assign manually", href: link(`/en/admin/bookings/${b.id}`) } }, b.id);
  }
  if (s.notifications.smsCustomers && ["ARRIVED", "COMPLETED", "CANCELLED", "NO_DRIVER_FOUND"].includes(b.status))
    await sendSms({ to: b.contactPhone, template: `status-${b.status.toLowerCase()}`, bookingId: b.id, text: `${brand.name}: ${text} ${track}` });
  if (b.contactEmail && s.notifications.emailCustomers && ["COMPLETED", "CANCELLED", "NO_DRIVER_FOUND"].includes(b.status)) {
    await mail(b.contactEmail, `status-${b.status.toLowerCase()}`, `Booking ${b.code}: ${b.status.replace(/_/g, " ").toLowerCase()}`, {
      title: text,
      body: bookingTable(b),
      cta: b.status === "COMPLETED" ? { label: "View invoice & rate your driver", href: link(`/en/track/${b.code}`) } : { label: "View booking", href: track },
    }, b.id);
  }
  if (b.status === "CANCELLED" && b.driver && s.notifications.emailDrivers)
    await mail(b.driver.email, "job-cancelled-driver", `Job ${b.code} cancelled`, { title: "Job cancelled", body: `<p>Booking ${esc(b.code)} was cancelled${b.cancelReason ? `: ${esc(b.cancelReason)}` : ""}.</p>` }, b.id);
}

// ───────────── providers ─────────────
export async function onProviderApplied(kind: "COMPANY" | "DRIVER", id: string) {
  const [s, brand] = await Promise.all([getSettings(), getBrand()]);
  const rec = kind === "COMPANY" ? await db.company.findUnique({ where: { id } }) : await db.driver.findUnique({ where: { id } });
  if (!rec) return;
  const email = kind === "COMPANY" ? (rec as { contactEmail: string }).contactEmail : (rec as { email: string }).email;
  const name = kind === "COMPANY" ? (rec as { legalName: string }).legalName : (rec as { name: string }).name;
  await mail(email, "partner-applied", `We received your application – ${brand.name}`, {
    title: "Application received",
    body: `<p>Hi ${esc(name)}, thanks for applying to partner with ${esc(brand.name)}. Our onboarding team will review your details and get back within 1–2 working days. After approval you'll receive your partner agreement to e-sign.</p>`,
  });
  const ops = s.notifications.adminAlertEmail || brand.partnersEmail;
  if (ops) await mail(ops, "ops-partner-applied", `New ${kind.toLowerCase()} partner application: ${name}`, { title: "New partner application", body: `<p>${esc(name)} applied as ${kind === "COMPANY" ? "a towing company" : "an independent driver"}.</p>`, cta: { label: "Review", href: link("/en/admin/providers") } });
}

export async function onProviderReviewed(kind: "COMPANY" | "DRIVER", id: string, approved: boolean, note?: string | null) {
  const brand = await getBrand();
  const rec = kind === "COMPANY" ? await db.company.findUnique({ where: { id } }) : await db.driver.findUnique({ where: { id } });
  if (!rec) return;
  const email = kind === "COMPANY" ? (rec as { contactEmail: string }).contactEmail : (rec as { email: string }).email;
  const name = kind === "COMPANY" ? (rec as { legalName: string }).legalName : (rec as { name: string }).name;
  if (approved)
    await mail(email, "partner-approved", `You're approved – sign your ${brand.name} partner agreement`, {
      title: "Welcome aboard!",
      body: `<p>Hi ${esc(name)}, your application has been approved. The last step is to review and e-sign your partner agreement. Once signed you can start receiving jobs.</p>`,
      cta: { label: "Review & sign agreement", href: link(kind === "COMPANY" ? "/en/partner-portal/contract" : "/en/driver/contract") },
    });
  else
    await mail(email, "partner-rejected", `Update on your ${brand.name} application`, {
      title: "Application update",
      body: `<p>Hi ${esc(name)}, thank you for your interest. Unfortunately we couldn't approve your application right now.</p>${note ? `<p><em>${esc(note)}</em></p>` : ""}<p>You're welcome to reapply once the points above are addressed.</p>`,
    });
}

export async function onContractSigned(contractId: string) {
  const [s, brand] = await Promise.all([getSettings(), getBrand()]);
  const c = await db.providerContract.findUnique({ where: { id: contractId }, include: { company: true, driver: true } });
  if (!c) return;
  const email = c.company?.contactEmail ?? c.driver?.email;
  const name = c.company?.legalName ?? c.driver?.name ?? "Partner";
  if (email)
    await mail(email, "contract-signed", `Partner agreement signed – ${brand.name}`, {
      title: "Agreement signed – you're live",
      body: `<p>Thank you ${esc(name)}. Your partner agreement (“${esc(c.title)}”) was e-signed on ${esc(c.signedAt?.toISOString().slice(0, 10))}. You can now go online and receive jobs.</p>`,
      cta: { label: "Go to dashboard", href: link(c.company ? "/en/partner-portal" : "/en/driver") },
    });
  const ops = s.notifications.adminAlertEmail || brand.partnersEmail;
  if (ops) await mail(ops, "ops-contract-signed", `Contract signed: ${name}`, { title: "Contract signed", body: `<p>${esc(name)} signed “${esc(c.title)}” (v${c.templateVersion}).</p>` });
}

export async function onDriverInvited(driverId: string) {
  const brand = await getBrand();
  const d = await db.driver.findUnique({ where: { id: driverId }, include: { company: true } });
  if (!d || !d.company) return;
  await mail(d.email, "driver-invited", `${d.company.tradeName || d.company.legalName} added you on ${brand.name}`, {
    title: "You've been added as a driver",
    body: `<p>Hi ${esc(d.name)}, <strong>${esc(d.company.tradeName || d.company.legalName)}</strong> added you to their fleet on ${esc(brand.name)}. Sign in with this email address (we'll send you a one-time code) to open your driver app and start receiving jobs.</p>`,
    cta: { label: "Open driver app", href: link("/en/login?next=/en/driver") },
  });
  await sendSms({ to: d.phone, template: "driver-invited", text: `${brand.name}: ${d.company.tradeName || d.company.legalName} added you as a driver. Sign in at ${link("/en/driver")} with ${d.email}` });
}

export async function onLead(kind: string, data: { name?: string | null; phone?: string | null; email?: string | null; message?: string | null }) {
  const [s, brand] = await Promise.all([getSettings(), getBrand()]);
  const ops = s.notifications.adminAlertEmail || brand.supportEmail;
  if (ops)
    await mail(ops, "ops-lead", `New ${kind.toLowerCase().replace(/_/g, " ")} lead`, {
      title: "New lead",
      body: table(row("Type", kind) + row("Name", data.name) + row("Phone", data.phone) + row("Email", data.email) + row("Message", data.message)),
      cta: { label: "Open leads", href: link("/en/admin/leads") },
    });
  if (data.email && kind === "CONTACT")
    await mail(data.email, "lead-ack", `We got your message – ${brand.name}`, { title: "Thanks for reaching out", body: `<p>Hi ${esc(data.name ?? "")}, our team will respond shortly. For emergencies, call <strong>${esc(brand.emergencyPhone)}</strong> any time.</p>` });
}
