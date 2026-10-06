import "server-only";
import { db } from "@/shared/lib/db";

/** Event catalogue – keep in sync with docs/tracking-plan.md. */
export const EVENTS = [
  "page_view",
  "cta_call_click",
  "cta_whatsapp_click",
  "booking_started",
  "booking_step_completed",
  "quote_viewed",
  "booking_submitted",
  "booking_completed",
  "booking_cancelled",
  "otp_requested",
  "login_success",
  "partner_apply_started",
  "partner_apply_submitted",
  "contract_signed",
  "coming_soon_lead",
  "razorpay_interest_clicked",
  "language_changed",
  "job_accepted",
  "review_submitted",
  "payment_succeeded",
] as const;
export type EventName = (typeof EVENTS)[number];

export async function trackServer(name: EventName, props?: Record<string, unknown>, ctx?: { userId?: string | null; anonId?: string | null; path?: string }) {
  try {
    await db.analyticsEvent.create({ data: { name, props: (props ?? undefined) as object | undefined, userId: ctx?.userId, anonId: ctx?.anonId, path: ctx?.path } });
  } catch {
    /* analytics must never break a request */
  }
}
