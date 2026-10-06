import "server-only";
import { getTrackingView, type TrackingView } from "./service";
import { getSetting } from "@/modules/settings/service";
import { getPaymentOptions } from "@/modules/payments/service";
import { isStaff, type SessionUser } from "@/modules/auth/session";
import { L } from "@/shared/lib/localized";
import { DRIVER_ACTIVE } from "./state";

export type TrackData = {
  code: string;
  id: string;
  status: TrackingView["status"];
  isOwner: boolean;
  service: { en: string; hi: string };
  vehicle: { en: string; hi: string };
  pickup: { address: string; lat: number; lng: number };
  drop: { address: string; lat: number; lng: number } | null;
  total: number;
  gst: number;
  subtotal: number;
  paymentMethod: "CASH" | "RAZORPAY";
  paymentStatus: TrackingView["paymentStatus"];
  scheduledFor: string | null;
  pin: string | null;
  invoiceNumber: string | null;
  driver: null | { name: string; phone: string; rating: number; ratingCount: number; company: string | null; truck: string | null; lat: number | null; lng: number | null; seenAt: string | null };
  events: { status: TrackingView["status"]; at: string; note: string | null; actor: string }[];
  reviewed: boolean;
  canCancel: boolean;
  cancelFee: number;
  payOnlineEnabled: boolean;
  updatedAt: string;
};

/** What a customer (or anyone holding the booking code) may see. Never includes other customers' PII. */
export async function buildTrackData(code: string, user: SessionUser | null): Promise<TrackData | null> {
  const b = await getTrackingView(code);
  if (!b) return null;
  const [pricing, pay] = await Promise.all([getSetting("pricing"), getPaymentOptions()]);
  const isOwner = Boolean(user && (user.id === b.customerId || isStaff(user.role)));
  const driverVisible = b.driver && DRIVER_ACTIVE.concat(["COMPLETED"]).includes(b.status);
  const d = b.driver;
  return {
    code: b.code,
    id: b.id,
    status: b.status,
    isOwner,
    service: { en: L(b.service.name, "en"), hi: L(b.service.name, "hi") },
    vehicle: { en: L(b.vehicleType.name, "en"), hi: L(b.vehicleType.name, "hi") },
    pickup: { address: b.pickupAddress, lat: b.pickupLat, lng: b.pickupLng },
    drop: b.dropLat != null && b.dropLng != null ? { address: b.dropAddress ?? "", lat: b.dropLat, lng: b.dropLng } : null,
    total: b.total,
    gst: b.gstAmount,
    subtotal: b.subtotal,
    paymentMethod: b.paymentMethod,
    paymentStatus: b.paymentStatus,
    scheduledFor: b.scheduledFor?.toISOString() ?? null,
    pin: ["ASSIGNED", "EN_ROUTE", "ARRIVED"].includes(b.status) ? b.startPin : null,
    invoiceNumber: b.invoice?.number ?? null,
    driver: driverVisible && d
      ? {
          name: d.name,
          phone: d.phone,
          rating: d.ratingAvg,
          ratingCount: d.ratingCount,
          company: d.company ? d.company.tradeName || d.company.legalName : null,
          truck: d.trucks[0] ? `${d.trucks[0].registrationNo}` : null,
          lat: b.status === "COMPLETED" ? null : d.lastLat,
          lng: b.status === "COMPLETED" ? null : d.lastLng,
          seenAt: d.lastSeenAt?.toISOString() ?? null,
        }
      : null,
    events: b.events.map((e) => ({ status: e.status, at: e.createdAt.toISOString(), note: e.note, actor: e.actorType })),
    reviewed: Boolean(b.review),
    canCancel: !["IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(b.status),
    cancelFee: pricing.cancellationFeeRupees * 100,
    payOnlineEnabled: pay.razorpay.enabled && b.paymentMethod === "RAZORPAY" && b.paymentStatus !== "PAID",
    updatedAt: b.updatedAt.toISOString(),
  };
}
