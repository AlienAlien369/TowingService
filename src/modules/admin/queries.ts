import "server-only";
import { db } from "@/shared/lib/db";

const startOfDayIST = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60_000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 330 * 60_000);
};

/** Back-office read model. Admin is allowed to read across modules (CQRS-style), but never writes here. */
export async function dashboardStats() {
  const today = startOfDayIST();
  const d7 = new Date(today.getTime() - 6 * 86_400_000);
  const d30 = new Date(today.getTime() - 29 * 86_400_000);
  const [todayBookings, active, attention, completedToday, gmv7, gmv30, online, pendingProviders, newLeads, recent, last14] = await Promise.all([
    db.booking.count({ where: { createdAt: { gte: today } } }),
    db.booking.count({ where: { status: { in: ["ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"] } } }),
    db.booking.count({ where: { status: { in: ["NO_DRIVER_FOUND", "PENDING_DISPATCH"] } } }),
    db.booking.count({ where: { status: "COMPLETED", completedAt: { gte: today } } }),
    db.booking.aggregate({ where: { status: "COMPLETED", completedAt: { gte: d7 } }, _sum: { total: true }, _count: true }),
    db.booking.aggregate({ where: { status: "COMPLETED", completedAt: { gte: d30 } }, _sum: { total: true, subtotal: true }, _count: true }),
    db.driver.count({ where: { isOnline: true, status: "ACTIVE" } }),
    Promise.all([db.company.count({ where: { status: "PENDING" } }), db.driver.count({ where: { status: "PENDING", companyId: null } })]).then(([a, b]) => a + b),
    db.lead.count({ where: { status: "NEW" } }),
    db.booking.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { service: true, driver: true } }),
    db.booking.findMany({ where: { createdAt: { gte: new Date(today.getTime() - 13 * 86_400_000) } }, select: { createdAt: true, status: true } }),
  ]);
  // bookings per IST day for the last 14 days
  const days: { label: string; total: number; completed: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const from = new Date(today.getTime() - i * 86_400_000);
    const to = new Date(from.getTime() + 86_400_000);
    const inDay = last14.filter((b) => b.createdAt >= from && b.createdAt < to);
    days.push({ label: new Date(from.getTime() + 330 * 60_000).toISOString().slice(5, 10), total: inDay.length, completed: inDay.filter((b) => b.status === "COMPLETED").length });
  }
  return { todayBookings, active, attention, completedToday, gmv7, gmv30, online, pendingProviders, newLeads, recent, days };
}

export async function funnel(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000);
  const names = ["page_view", "booking_started", "quote_viewed", "booking_submitted", "booking_completed", "cta_call_click", "otp_requested", "login_success", "partner_apply_started", "partner_apply_submitted", "contract_signed", "coming_soon_lead", "razorpay_interest_clicked"];
  const rows = await db.analyticsEvent.groupBy({ by: ["name"], where: { createdAt: { gte: since }, name: { in: names } }, _count: true });
  const counts = Object.fromEntries(rows.map((r) => [r.name, r._count]));
  const completed = await db.booking.count({ where: { status: "COMPLETED", completedAt: { gte: since } } });
  return { counts: { ...counts, booking_completed: completed } as Record<string, number> };
}
