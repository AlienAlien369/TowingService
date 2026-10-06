import "server-only";
import { db, type Tx } from "@/shared/lib/db";
import { haversineKm } from "@/shared/lib/utils";
import { getSetting } from "@/modules/settings/service";
import { defer, onBookingStatus, onDriverAssigned, onJobOffered } from "@/modules/notifications/events";
import { DRIVER_ACTIVE, canTransition } from "@/modules/bookings/state";
import type { BookingStatus } from "@/generated/prisma/enums";

export type Actor = { type: "SYSTEM" | "CUSTOMER" | "DRIVER" | "ADMIN"; id?: string };

export async function addEvent(tx: Tx | typeof db, bookingId: string, status: BookingStatus, actor: Actor, note?: string, pos?: { lat: number; lng: number }) {
  return tx.bookingEvent.create({ data: { bookingId, status, actorType: actor.type, actorId: actor.id, note, lat: pos?.lat, lng: pos?.lng } });
}

/** Drivers who can take this booking, nearest first, excluding anyone already offered it. */
async function findCandidates(bookingId: string) {
  const [b, cfg] = await Promise.all([db.booking.findUniqueOrThrow({ where: { id: bookingId } }), getSetting("dispatch")]);
  const fresh = new Date(Date.now() - cfg.driverFreshnessMin * 60_000);
  const already = await db.dispatchOffer.findMany({ where: { bookingId }, select: { driverId: true } });
  const busy = await db.booking.findMany({ where: { status: { in: DRIVER_ACTIVE }, driverId: { not: null } }, select: { driverId: true } });
  const exclude = new Set([...already.map((o) => o.driverId), ...busy.map((x) => x.driverId!)]);

  const drivers = await db.driver.findMany({
    where: {
      status: "ACTIVE",
      isOnline: true,
      lastSeenAt: { gte: fresh },
      lastLat: { not: null },
      lastLng: { not: null },
      vehicleTypes: { some: { id: b.vehicleTypeId } },
      services: { some: { id: b.serviceId } },
      OR: [{ companyId: null }, { company: { status: "ACTIVE" } }],
    },
  });
  return drivers
    .filter((d) => !exclude.has(d.id))
    .map((d) => ({ driver: d, distanceKm: haversineKm({ lat: b.pickupLat, lng: b.pickupLng }, { lat: d.lastLat!, lng: d.lastLng! }) }))
    .filter((c) => c.distanceKm <= cfg.searchRadiusKm)
    .sort((a, c) => a.distanceKm - c.distanceKm);
}

/** Runs one dispatch round: offer the job to the N nearest eligible drivers. */
export async function runDispatchRound(bookingId: string): Promise<"OFFERED" | "NO_DRIVER_FOUND" | "SKIPPED"> {
  const cfg = await getSetting("dispatch");
  const b = await db.booking.findUnique({ where: { id: bookingId } });
  if (!b || !["PENDING_DISPATCH", "OFFERED"].includes(b.status) || b.driverId) return "SKIPPED";
  if (b.paymentMethod === "RAZORPAY" && b.paymentStatus !== "PAID") return "SKIPPED"; // prepaid: wait for payment

  if (b.dispatchRound >= cfg.maxRounds) return markNoDriver(bookingId);
  const candidates = (await findCandidates(bookingId)).slice(0, cfg.offersPerRound);
  if (candidates.length === 0) return markNoDriver(bookingId);

  const round = b.dispatchRound + 1;
  const expiresAt = new Date(Date.now() + cfg.offerTimeoutSec * 1000);
  await db.$transaction(async (tx) => {
    await tx.dispatchOffer.createMany({ data: candidates.map((c) => ({ bookingId, driverId: c.driver.id, distanceKm: Math.round(c.distanceKm * 10) / 10, round, expiresAt })) });
    await tx.booking.update({ where: { id: bookingId }, data: { status: "OFFERED", dispatchRound: round } });
    await addEvent(tx, bookingId, "OFFERED", { type: "SYSTEM" }, `Round ${round}: offered to ${candidates.length} driver(s)`);
  });
  defer(() => onJobOffered(candidates.map((c) => c.driver.id), bookingId));
  return "OFFERED";
}

async function markNoDriver(bookingId: string) {
  await db.$transaction(async (tx) => {
    await tx.dispatchOffer.updateMany({ where: { bookingId, status: "PENDING" }, data: { status: "EXPIRED" } });
    await tx.booking.update({ where: { id: bookingId }, data: { status: "NO_DRIVER_FOUND" } });
    await addEvent(tx, bookingId, "NO_DRIVER_FOUND", { type: "SYSTEM" }, "No eligible driver accepted – escalated to dispatcher");
  });
  defer(() => onBookingStatus(bookingId));
  return "NO_DRIVER_FOUND" as const;
}

/** Atomically assigns the booking. Returns false if someone else got there first. */
async function assign(bookingId: string, driverId: string, actor: Actor, note: string): Promise<boolean> {
  const done = await db.$transaction(async (tx) => {
    const cur = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!cur || !canTransition(cur.status, "ASSIGNED") || cur.driverId) return false;
    const res = await tx.booking.updateMany({
      where: { id: bookingId, driverId: null, status: { in: ["PENDING_DISPATCH", "OFFERED", "NO_DRIVER_FOUND"] } },
      data: { driverId, status: "ASSIGNED", assignedAt: new Date() },
    });
    if (res.count === 0) return false;
    await tx.dispatchOffer.updateMany({ where: { bookingId, status: "PENDING", driverId: { not: driverId } }, data: { status: "CANCELLED" } });
    await tx.dispatchOffer.updateMany({ where: { bookingId, driverId, status: "PENDING" }, data: { status: "ACCEPTED" } });
    await addEvent(tx, bookingId, "ASSIGNED", actor, note);
    return true;
  });
  if (done) defer(() => onDriverAssigned(bookingId));
  return done;
}

export async function acceptOffer(offerId: string, driverId: string): Promise<{ ok: boolean; error?: string }> {
  const offer = await db.dispatchOffer.findUnique({ where: { id: offerId } });
  if (!offer || offer.driverId !== driverId) return { ok: false, error: "Offer not found." };
  if (offer.status !== "PENDING" || offer.expiresAt < new Date()) return { ok: false, error: "This offer has expired or was taken by another driver." };
  const ok = await assign(offer.bookingId, driverId, { type: "DRIVER", id: driverId }, "Driver accepted the job");
  return ok ? { ok: true } : { ok: false, error: "Another driver already took this job." };
}

export async function declineOffer(offerId: string, driverId: string) {
  await db.dispatchOffer.updateMany({ where: { id: offerId, driverId, status: "PENDING" }, data: { status: "DECLINED" } });
  await maybeAdvance((await db.dispatchOffer.findUnique({ where: { id: offerId } }))?.bookingId);
}

export async function assignManually(bookingId: string, driverId: string, staffId: string) {
  const d = await db.driver.findUnique({ where: { id: driverId } });
  if (!d || d.status !== "ACTIVE") return { ok: false, error: "Driver is not active." };
  const ok = await assign(bookingId, driverId, { type: "ADMIN", id: staffId }, `Manually assigned to ${d.name}`);
  return ok ? { ok: true } : { ok: false, error: "Booking can no longer be assigned." };
}

/** If every offer of the current round is closed and nobody accepted, start the next round. */
async function maybeAdvance(bookingId?: string) {
  if (!bookingId) return;
  const b = await db.booking.findUnique({ where: { id: bookingId } });
  if (!b || b.status !== "OFFERED") return;
  const pending = await db.dispatchOffer.count({ where: { bookingId, status: "PENDING", expiresAt: { gt: new Date() } } });
  if (pending === 0) {
    await db.booking.update({ where: { id: bookingId }, data: { status: "PENDING_DISPATCH" } });
    await runDispatchRound(bookingId);
  }
}

/** Called when a customer polls tracking: keeps dispatch moving even if the cron scheduler is slow or absent. */
export async function advanceIfStale(bookingId: string) {
  await db.dispatchOffer.updateMany({ where: { bookingId, status: "PENDING", expiresAt: { lt: new Date() } }, data: { status: "EXPIRED" } });
  await maybeAdvance(bookingId);
}

/** Cron entry point: expire stale offers, advance rounds, release scheduled bookings. */
export async function dispatchTick() {
  const now = new Date();
  await db.dispatchOffer.updateMany({ where: { status: "PENDING", expiresAt: { lt: now } }, data: { status: "EXPIRED" } });
  const stuck = await db.booking.findMany({ where: { status: "OFFERED" }, select: { id: true } });
  for (const b of stuck) await maybeAdvance(b.id);

  // scheduled bookings enter dispatch 45 minutes before the slot
  const due = await db.booking.findMany({
    where: { status: "PENDING_DISPATCH", dispatchRound: 0, scheduledFor: { lte: new Date(now.getTime() + 45 * 60_000) } },
    select: { id: true },
  });
  for (const b of due) await runDispatchRound(b.id);
  return { advanced: stuck.length, released: due.length };
}

/** Booking creation hook: scheduled-later bookings wait for the tick. */
export async function startDispatch(bookingId: string) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, select: { scheduledFor: true } });
  if (b?.scheduledFor && b.scheduledFor.getTime() - Date.now() > 45 * 60_000) return "SKIPPED" as const;
  return runDispatchRound(bookingId);
}
