import { NextResponse } from "next/server";
import { markRazorpayFailed, markRazorpayPaid, verifyWebhookSignature } from "@/modules/payments/service";

export const dynamic = "force-dynamic";

type Payload = { event: string; payload?: { payment?: { entity?: { id: string; order_id: string } }; order?: { entity?: { id: string } } } };

/** Razorpay webhook: the source of truth for payment state (checkout callbacks can be lost). */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, sig)) return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  let evt: Payload;
  try {
    evt = JSON.parse(raw) as Payload;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const pay = evt.payload?.payment?.entity;
  if ((evt.event === "payment.captured" || evt.event === "order.paid") && pay?.order_id) await markRazorpayPaid(pay.order_id, pay.id, evt);
  else if (evt.event === "payment.failed" && pay?.order_id) await markRazorpayFailed(pay.order_id, evt);
  return NextResponse.json({ ok: true });
}
