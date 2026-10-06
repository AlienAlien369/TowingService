import "server-only";
import { z } from "zod";
import { db } from "@/shared/lib/db";
import { normalizeEmail, normalizePhone, randomCode, randomPin } from "@/shared/lib/utils";
import { getSetting } from "@/modules/settings/service";
import { quoteBooking } from "@/modules/pricing/service";
import { splitCommission } from "@/modules/pricing/engine";
import { addEvent, startDispatch, type Actor } from "@/modules/dispatch/service";
import { issueInvoice } from "@/modules/invoicing/service";
import { getPaymentOptions, recordOfflinePayment } from "@/modules/payments/service";
import { defer, onBookingCreated, onBookingStatus } from "@/modules/notifications/events";
import { trackServer } from "@/modules/analytics/track";
import { canTransition, DRIVER_ACTIVE, DRIVER_NEXT } from "./state";
import type { BookingStatus } from "@/generated/prisma/enums";

const place = z.object({ address: z.string().trim().min(3).max(300), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

export const createBookingSchema = z.object({
  vehicleTypeId: z.string().min(1),
  serviceId: z.string().min(1),
  pickup: place,
  drop: place.nullish(),
  contactName: z.string().trim().min(2, "Enter your name").max(80),
  contactPhone: z.string().min(8),
  contactEmail: z.string().trim().max(254).optional().or(z.literal("")),
  vehicleNumber: z.string().trim().max(20).optional(),
  vehicleDetails: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(500).optional(),
  scheduledFor: z.string().datetime().nullish(),
  paymentMethod: z.enum(["CASH", "RAZORPAY"]),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export type CreateBookingResult = { ok: true; id: string; code: string; payOnline: boolean } | { ok: false; error: string; code?: string };

export async function createBooking(raw: unknown, customerId: string): Promise<CreateBookingResult> {
  const parsed = createBookingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." };
  const i = parsed.data;

  const phone = normalizePhone(i.contactPhone);
  if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  const email = i.contactEmail ? normalizeEmail(i.contactEmail) : null;
  if (i.contactEmail && !email) return { ok: false, error: "Enter a valid email address." };

  const [dispatchCfg, opts, biz] = await Promise.all([getSetting("dispatch"), getPaymentOptions(), getSetting("business")]);
  if (i.paymentMethod === "CASH" && !opts.cash) return { ok: false, error: "Pay-after-service is currently unavailable." };
  if (i.paymentMethod === "RAZORPAY" && !opts.razorpay.enabled) return { ok: false, error: "Online payment is coming soon." };

  let scheduledFor: Date | null = null;
  if (i.scheduledFor) {
    scheduledFor = new Date(i.scheduledFor);
    if (!dispatchCfg.allowScheduling) return { ok: false, error: "Scheduling is not available." };
    if (scheduledFor.getTime() < Date.now() + 30 * 60_000) return { ok: false, error: "Schedule at least 30 minutes ahead, or book now." };
    if (scheduledFor.getTime() > Date.now() + 30 * 86_400_000) return { ok: false, error: "Schedule within the next 30 days." };
  }

  // Re-quote on the server – the client's displayed fare is never trusted.
  const q = await quoteBooking({ vehicleTypeId: i.vehicleTypeId, serviceId: i.serviceId, pickup: i.pickup, drop: i.drop ?? null, scheduledFor });
  if (!q.ok) return { ok: false, error: q.error, code: q.code };

  // Throttle abuse: max 3 open bookings per customer.
  const open = await db.booking.count({ where: { customerId, status: { in: ["PENDING_DISPATCH", "OFFERED", "NO_DRIVER_FOUND", ...DRIVER_ACTIVE] } } });
  if (open >= 3) return { ok: false, error: "You already have active bookings. Please complete or cancel one first." };

  const online = i.paymentMethod === "RAZORPAY";
  let created: { id: string; code: string } | null = null;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    try {
      created = await db.$transaction(async (tx) => {
        const b = await tx.booking.create({
          data: {
            code: `${biz.bookingPrefix}-${randomCode(8)}`,
            customerId,
            contactName: i.contactName,
            contactPhone: phone,
            contactEmail: email,
            vehicleTypeId: i.vehicleTypeId,
            serviceId: i.serviceId,
            vehicleNumber: i.vehicleNumber?.toUpperCase() || null,
            vehicleDetails: i.vehicleDetails || null,
            notes: i.notes || null,
            pickupAddress: i.pickup.address,
            pickupLat: i.pickup.lat,
            pickupLng: i.pickup.lng,
            dropAddress: i.drop?.address ?? null,
            dropLat: i.drop?.lat ?? null,
            dropLng: i.drop?.lng ?? null,
            distanceKm: q.quote.distanceKm,
            durationMin: q.route?.durationMin ?? null,
            scheduledFor,
            fare: q.quote as object,
            subtotal: q.quote.subtotal,
            gstAmount: q.quote.gstAmount,
            total: q.quote.total,
            paymentMethod: i.paymentMethod,
            paymentStatus: online ? "PENDING" : "UNPAID",
            startPin: randomPin(),
          },
        });
        await addEvent(tx, b.id, "PENDING_DISPATCH", { type: "CUSTOMER", id: customerId }, scheduledFor ? `Scheduled for ${scheduledFor.toISOString()}` : "Booking created");
        return { id: b.id, code: b.code };
      });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e; // retry on code collision only
    }
  }
  if (!created) return { ok: false, error: "Could not create booking. Please try again." };

  defer(() => onBookingCreated(created!.id));
  if (!online) await startDispatch(created.id); // online bookings dispatch after payment is captured
  return { ok: true, id: created.id, code: created.code, payOnline: online };
}

// ───────────────────────── status changes ─────────────────────────
export type ChangeResult = { ok: true } | { ok: false; error: string };

export async function changeStatus(bookingId: string, to: BookingStatus, actor: Actor, opts: { note?: string; pos?: { lat: number; lng: number } } = {}): Promise<ChangeResult> {
  const b = await db.booking.findUnique({ where: { id: bookingId } });
  if (!b) return { ok: false, error: "Booking not found." };
  if (!canTransition(b.status, to)) return { ok: false, error: `Cannot move from ${b.status} to ${to}.` };

  await db.$transaction(async (tx) => {
    const data: Record<string, unknown> = { status: to };
    if (to === "CANCELLED") {
      data.cancelledBy = actor.type;
      data.cancelReason = opts.note ?? null;
      await tx.dispatchOffer.updateMany({ where: { bookingId, status: "PENDING" }, data: { status: "CANCELLED" } });
    }
    if (to === "PENDING_DISPATCH") {
      data.driverId = null; // reassignment / retry
      data.dispatchRound = 0;
    }
    if (to === "COMPLETED") data.completedAt = new Date();
    await tx.booking.update({ where: { id: bookingId }, data });
    await addEvent(tx, bookingId, to, actor, opts.note, opts.pos);
  });

  if (to === "COMPLETED") await finalizeCompletion(bookingId);
  if (to === "PENDING_DISPATCH") await startDispatch(bookingId);
  defer(() => onBookingStatus(bookingId));
  return { ok: true };
}

/** Invoice + cash receipt + earnings ledger. Safe to call twice. */
async function finalizeCompletion(bookingId: string) {
  const [b, cfg] = await Promise.all([db.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { driver: { include: { company: true } } } }), getSetting("pricing")]);
  if (b.paymentMethod === "CASH") await recordOfflinePayment(bookingId);
  await issueInvoice(bookingId);
  void trackServer("booking_completed", { payment_method: b.paymentMethod, total: b.total, distance_km: b.distanceKm, service_id: b.serviceId, has_company: Boolean(b.driver?.companyId) }, { userId: b.customerId });
  if (b.driver) {
    const bp = b.driver.commissionBp ?? b.driver.company?.commissionBp ?? Math.round(cfg.platformCommissionPct * 100);
    const s = splitCommission(b.subtotal, b.gstAmount, bp);
    await db.ledgerEntry.upsert({
      where: { bookingId },
      create: { bookingId, driverId: b.driver.id, companyId: b.driver.companyId, gross: s.gross, commission: s.commission, net: s.net },
      update: {},
    });
  }
}

/** Driver-facing: advance to the next step. ARRIVED → IN_PROGRESS requires the customer's PIN. */
export async function driverAdvance(bookingId: string, driverId: string, input: { pin?: string; pos?: { lat: number; lng: number } }): Promise<ChangeResult> {
  const b = await db.booking.findUnique({ where: { id: bookingId } });
  if (!b || b.driverId !== driverId) return { ok: false, error: "This job is not assigned to you." };
  const step = DRIVER_NEXT[b.status];
  if (!step) return { ok: false, error: "Nothing to advance." };
  if (step.to === "IN_PROGRESS" && (input.pin ?? "").trim() !== b.startPin) return { ok: false, error: "Incorrect PIN. Ask the customer for the 4-digit trip PIN." };
  return changeStatus(bookingId, step.to, { type: "DRIVER", id: driverId }, { pos: input.pos });
}

export async function customerCancel(bookingId: string, customerId: string, reason?: string): Promise<ChangeResult> {
  const b = await db.booking.findUnique({ where: { id: bookingId } });
  if (!b || b.customerId !== customerId) return { ok: false, error: "Booking not found." };
  return changeStatus(bookingId, "CANCELLED", { type: "CUSTOMER", id: customerId }, { note: reason || "Cancelled by customer" });
}

export async function submitReview(bookingId: string, customerId: string, rating: number, comment?: string): Promise<ChangeResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: "Choose 1 to 5 stars." };
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { review: true } });
  if (!b || b.customerId !== customerId) return { ok: false, error: "Booking not found." };
  if (b.status !== "COMPLETED" || !b.driverId) return { ok: false, error: "You can review after the service is completed." };
  if (b.review) return { ok: false, error: "You already reviewed this booking." };
  await db.$transaction(async (tx) => {
    await tx.review.create({ data: { bookingId, driverId: b.driverId, rating, comment: comment?.slice(0, 500) || null } });
    const agg = await tx.review.aggregate({ where: { driverId: b.driverId }, _avg: { rating: true }, _count: true });
    await tx.driver.update({ where: { id: b.driverId! }, data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 100) / 100, ratingCount: agg._count } });
  });
  void trackServer("review_submitted", { rating }, { userId: customerId });
  return { ok: true };
}

// ───────────────────────── read models ─────────────────────────
export async function getTrackingView(code: string) {
  const b = await db.booking.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      vehicleType: true,
      service: true,
      events: { orderBy: { createdAt: "asc" } },
      review: true,
      invoice: { select: { number: true } },
      driver: { select: { id: true, name: true, phone: true, ratingAvg: true, ratingCount: true, lastLat: true, lastLng: true, lastSeenAt: true, company: { select: { tradeName: true, legalName: true } }, trucks: { where: { isActive: true }, take: 1, select: { registrationNo: true, kind: true } } } },
    },
  });
  return b;
}
export type TrackingView = NonNullable<Awaited<ReturnType<typeof getTrackingView>>>;
