"use client";

type Order = { orderId: string; amount: number; currency: string; keyId: string; name: string; phone: string; email?: string; code: string };
type RzpWindow = Window & { Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(e: string, cb: () => void): void } };

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as RzpWindow).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Razorpay Checkout. Resolves with the signed payload on success, null if dismissed/failed. */
export async function openRazorpay(order: Order, brandName: string): Promise<{ orderId: string; paymentId: string; signature: string } | null> {
  if (!(await loadScript())) return null;
  const Rzp = (window as RzpWindow).Razorpay!;
  return new Promise((resolve) => {
    const rzp = new Rzp({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: brandName,
      description: `Booking ${order.code}`,
      order_id: order.orderId,
      prefill: { name: order.name, contact: order.phone, email: order.email },
      theme: { color: "#FFC400" },
      handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => resolve({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on("payment.failed", () => resolve(null));
    rzp.open();
  });
}
