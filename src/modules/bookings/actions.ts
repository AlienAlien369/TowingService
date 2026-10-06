"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/modules/auth/guards";
import { getCurrentUser } from "@/modules/auth/session";
import { trackServer } from "@/modules/analytics/track";
import { quoteBooking, type QuoteResult } from "@/modules/pricing/service";
import { createRazorpayOrder, markRazorpayFailed, markRazorpayPaid, verifyCheckoutSignature } from "@/modules/payments/service";
import { clientIp, rateLimit } from "@/shared/lib/guard";
import { db } from "@/shared/lib/db";
import { createBooking, customerCancel, submitReview } from "./service";

type Pt = { lat: number; lng: number };

/** Public (no login): the fare preview shown in step 3 of the booking flow. */
export async function quoteAction(input: { vehicleTypeId: string; serviceId: string; pickup: Pt; drop?: Pt | null; scheduledFor?: string | null }): Promise<QuoteResult> {
  if (!(await rateLimit(`quote:${await clientIp()}`, 60, 600))) return { ok: false, code: "NO_RATE", error: "Too many requests. Please wait a moment." };
  const result = await quoteBooking({ ...input, scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null });
  if (result.ok) void trackServer("quote_viewed", { service: input.serviceId, total: result.quote.total });
  return result;
}

export async function createBookingAction(input: unknown): Promise<ActionResult<{ id: string; code: string; payOnline: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Please verify your mobile number to continue.");
  if (!(await rateLimit(`book:${user.id}`, 10, 3600))) return fail("Too many booking attempts. Please try again later.");
  const r = await createBooking(input, user.id);
  if (!r.ok) return fail(r.error);
  void trackServer("booking_submitted", { code: r.code, payOnline: r.payOnline }, { userId: user.id });
  revalidatePath("/", "layout");
  return { ok: true, data: { id: r.id, code: r.code, payOnline: r.payOnline } };
}

export async function cancelBookingAction(bookingId: string, reason?: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in.");
  const r = await customerCancel(bookingId, user.id, reason);
  if (!r.ok) return fail(r.error);
  void trackServer("booking_cancelled", { bookingId }, { userId: user.id });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reviewAction(bookingId: string, rating: number, comment?: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in.");
  const r = await submitReview(bookingId, user.id, rating, comment);
  revalidatePath("/", "layout");
  return r.ok ? { ok: true } : fail(r.error);
}

// ───────── Razorpay (live only when enabled in Admin → Settings → Payments) ─────────
export async function createPaymentOrderAction(bookingId: string): Promise<ActionResult<Awaited<ReturnType<typeof createRazorpayOrder>>>> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in.");
  const owned = await db.booking.findFirst({ where: { id: bookingId, customerId: user.id }, select: { id: true } });
  if (!owned) return fail("Booking not found.");
  try {
    return { ok: true, data: await createRazorpayOrder(bookingId) };
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function verifyPaymentAction(input: { orderId: string; paymentId: string; signature: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in.");
  const pay = await db.payment.findFirst({ where: { providerOrderId: input.orderId }, include: { booking: { select: { customerId: true } } } });
  if (!pay || pay.booking.customerId !== user.id) return fail("Payment not found.");
  if (!verifyCheckoutSignature(input.orderId, input.paymentId, input.signature)) {
    await markRazorpayFailed(input.orderId);
    return fail("Payment verification failed.");
  }
  await markRazorpayPaid(input.orderId, input.paymentId);
  revalidatePath("/", "layout");
  return { ok: true };
}
