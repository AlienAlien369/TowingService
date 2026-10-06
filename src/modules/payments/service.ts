import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { db } from "@/shared/lib/db";
import { env } from "@/shared/lib/env";
import { getSetting } from "@/modules/settings/service";
import { addEvent, startDispatch } from "@/modules/dispatch/service";
import { trackServer } from "@/modules/analytics/track";

export type PaymentOptions = {
  cash: boolean;
  razorpay: { visible: true; enabled: boolean; comingSoon: boolean; mode: "coming_soon" | "test" | "live" };
};

/** What the checkout shows. Razorpay is always visible; it is *enabled* only when mode ≠ coming_soon and keys exist. */
export async function getPaymentOptions(): Promise<PaymentOptions> {
  const p = await getSetting("payments");
  const keysReady = Boolean(env.razorpay.keyId && env.razorpay.keySecret);
  const enabled = p.razorpayMode !== "coming_soon" && keysReady;
  return { cash: p.cashEnabled, razorpay: { visible: true, enabled, comingSoon: !enabled, mode: p.razorpayMode } };
}

const client = () => new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });

export async function createRazorpayOrder(bookingId: string) {
  const opts = await getPaymentOptions();
  if (!opts.razorpay.enabled) throw new Error("Online payments are coming soon.");
  const booking = await db.booking.findUniqueOrThrow({ where: { id: bookingId } });
  if (booking.paymentStatus === "PAID") throw new Error("Already paid.");
  const order = await client().orders.create({ amount: booking.total, currency: "INR", receipt: booking.code, notes: { bookingId, code: booking.code } });
  await db.payment.create({ data: { bookingId, method: "RAZORPAY", status: "PENDING", amount: booking.total, providerOrderId: order.id } });
  await db.booking.update({ where: { id: bookingId }, data: { paymentStatus: "PENDING" } });
  return { orderId: order.id, amount: booking.total, currency: "INR", keyId: env.razorpay.keyId, name: booking.contactName, phone: booking.contactPhone, email: booking.contactEmail ?? undefined, code: booking.code };
}

const safeEq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = createHmac("sha256", env.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEq(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.razorpay.webhookSecret) return false;
  return safeEq(createHmac("sha256", env.razorpay.webhookSecret).update(rawBody).digest("hex"), signature);
}

/** Idempotent: marks the order paid and releases the booking to dispatch. */
export async function markRazorpayPaid(orderId: string, paymentId: string, raw?: unknown) {
  const pay = await db.payment.findFirst({ where: { providerOrderId: orderId } });
  if (!pay || pay.status === "PAID") return pay;
  const updated = await db.$transaction(async (tx) => {
    const p = await tx.payment.update({ where: { id: pay.id }, data: { status: "PAID", providerPaymentId: paymentId, raw: (raw ?? undefined) as object | undefined } });
    await tx.booking.update({ where: { id: pay.bookingId }, data: { paymentStatus: "PAID" } });
    await addEvent(tx, pay.bookingId, "PENDING_DISPATCH", { type: "SYSTEM" }, "Online payment received");
    return p;
  });
  void trackServer("payment_succeeded", { method: "RAZORPAY", amount: pay.amount });
  await startDispatch(pay.bookingId);
  return updated;
}

export async function markRazorpayFailed(orderId: string, raw?: unknown) {
  const pay = await db.payment.findFirst({ where: { providerOrderId: orderId } });
  if (!pay || pay.status === "PAID") return;
  await db.payment.update({ where: { id: pay.id }, data: { status: "FAILED", raw: (raw ?? undefined) as object | undefined } });
  await db.booking.update({ where: { id: pay.bookingId }, data: { paymentStatus: "FAILED" } });
}

/** Driver confirms the customer paid on completion (cash / UPI). */
export async function recordOfflinePayment(bookingId: string) {
  const b = await db.booking.findUniqueOrThrow({ where: { id: bookingId } });
  if (b.paymentStatus === "PAID") return;
  await db.$transaction([
    db.payment.create({ data: { bookingId, method: "CASH", status: "PAID", amount: b.total } }),
    db.booking.update({ where: { id: bookingId }, data: { paymentStatus: "PAID" } }),
  ]);
}
