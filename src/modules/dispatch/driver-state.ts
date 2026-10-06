import "server-only";
import { db } from "@/shared/lib/db";
import { L } from "@/shared/lib/localized";
import { DRIVER_ACTIVE } from "@/modules/bookings/state";

export type DriverOffer = {
  id: string;
  bookingCode: string;
  service: string;
  vehicle: string;
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  drop: string | null;
  distanceKm: number; // driver → pickup
  tripKm: number;
  fare: number; // taxable fare (what the provider earns before commission)
  expiresAt: string;
};

export type DriverJob = {
  id: string;
  code: string;
  status: string;
  service: string;
  vehicle: string;
  customerName: string;
  customerPhone: string;
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  drop: string | null;
  dropLat: number | null;
  dropLng: number | null;
  vehicleNumber: string | null;
  vehicleDetails: string | null;
  notes: string | null;
  total: number;
  collectCash: boolean;
  paymentStatus: string;
};

export async function getDriverState(driverId: string) {
  const [driver, offers, job] = await Promise.all([
    db.driver.findUniqueOrThrow({ where: { id: driverId }, select: { id: true, status: true, isOnline: true, lastLat: true, lastLng: true, lastSeenAt: true } }),
    db.dispatchOffer.findMany({ where: { driverId, status: "PENDING", expiresAt: { gt: new Date() } }, include: { booking: { include: { service: true, vehicleType: true } } }, orderBy: { createdAt: "asc" } }),
    db.booking.findFirst({ where: { driverId, status: { in: DRIVER_ACTIVE } }, include: { service: true, vehicleType: true }, orderBy: { assignedAt: "desc" } }),
  ]);
  const o: DriverOffer[] = offers.map((x) => ({
    id: x.id,
    bookingCode: x.booking.code,
    service: L(x.booking.service.name, "en"),
    vehicle: L(x.booking.vehicleType.name, "en"),
    pickup: x.booking.pickupAddress,
    pickupLat: x.booking.pickupLat,
    pickupLng: x.booking.pickupLng,
    drop: x.booking.dropAddress,
    distanceKm: x.distanceKm,
    tripKm: x.booking.distanceKm,
    fare: x.booking.subtotal,
    expiresAt: x.expiresAt.toISOString(),
  }));
  const j: DriverJob | null = job
    ? {
        id: job.id,
        code: job.code,
        status: job.status,
        service: L(job.service.name, "en"),
        vehicle: L(job.vehicleType.name, "en"),
        customerName: job.contactName,
        customerPhone: job.contactPhone,
        pickup: job.pickupAddress,
        pickupLat: job.pickupLat,
        pickupLng: job.pickupLng,
        drop: job.dropAddress,
        dropLat: job.dropLat,
        dropLng: job.dropLng,
        vehicleNumber: job.vehicleNumber,
        vehicleDetails: job.vehicleDetails,
        notes: job.notes,
        total: job.total,
        collectCash: job.paymentMethod === "CASH",
        paymentStatus: job.paymentStatus,
      }
    : null;
  return { driver: { status: driver.status, isOnline: driver.isOnline, lat: driver.lastLat, lng: driver.lastLng, seenAt: driver.lastSeenAt?.toISOString() ?? null }, offers: o, job: j };
}
export type DriverState = Awaited<ReturnType<typeof getDriverState>>;
