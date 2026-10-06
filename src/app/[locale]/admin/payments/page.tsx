import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { formatINR } from "@/shared/lib/utils";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES } from "@/modules/auth/session";
import { getPaymentOptions } from "@/modules/payments/service";
import { Alert, Badge, Card, DataTable, Stat } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { SettleLedger } from "@/shared/client/admin-controls";

export default async function AdminPayments({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  await requireUser(locale, p("/admin/payments"), ADMIN_ROLES);
  const [opts, pending, recentPayments, settled, byProvider] = await Promise.all([
    getPaymentOptions(),
    db.ledgerEntry.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { driver: { include: { company: true } }, booking: { select: { code: true, paymentMethod: true } } }, take: 300 }),
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { booking: { select: { code: true } } } }),
    db.ledgerEntry.aggregate({ where: { status: "SETTLED" }, _sum: { net: true } }),
    db.ledgerEntry.groupBy({ by: ["driverId"], where: { status: "PENDING" }, _sum: { net: true, gross: true, commission: true } }),
  ]);
  // Online jobs: platform owes the provider `net`. Cash jobs: provider owes the platform (gross − net).
  const owe = pending.reduce((s, e) => s + (e.booking.paymentMethod === "RAZORPAY" ? e.net : 0), 0);
  const owed = pending.reduce((s, e) => s + (e.booking.paymentMethod === "CASH" ? e.gross - e.net : 0), 0);
  const commissionPending = pending.reduce((s, e) => s + e.commission, 0);
  void byProvider;
  return (
    <>
      <PageTitle title="Payouts & ledger" sub="Provider earnings per completed job. Settle weekly after paying out via bank/UPI." />
      <Alert tone={opts.razorpay.enabled ? "ok" : "warn"} className="mb-4" title={`Razorpay: ${opts.razorpay.enabled ? `enabled (${opts.razorpay.mode})` : "coming soon (disabled at checkout)"}`}>Change the mode under Settings → Payments.</Alert>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Platform owes providers" value={formatINR(owe)} hint="online-paid jobs, pending" />
        <Stat label="Providers owe platform" value={formatINR(owed)} hint="commission + GST on cash jobs" />
        <Stat label="Commission accrued" value={formatINR(commissionPending)} hint="pending entries" />
        <Stat label="Settled to date" value={formatINR(settled._sum.net ?? 0)} />
      </div>
      <Card className="mb-8 p-5">
        <h2 className="mb-3 text-3xl font-extrabold uppercase">Pending settlements</h2>
        <SettleLedger entries={pending.map((e) => ({ id: e.id, label: `${e.booking.code} · ${e.driver.company ? (e.driver.company.tradeName || e.driver.company.legalName) + " / " : ""}${e.driver.name} · ${e.booking.paymentMethod === "CASH" ? "cash (owes " + formatINR(e.gross - e.net) + ")" : "online"}`, amount: formatINR(e.net) }))} />
      </Card>
      <h2 className="mb-3 text-3xl font-extrabold uppercase">Recent payments</h2>
      <DataTable head={["Booking", "Method", "Amount", "Status", "Provider ref", "When"]}>
        {recentPayments.map((x) => <tr key={x.id}><td className="font-mono text-xs font-bold">{x.booking.code}</td><td>{x.method}</td><td className="font-bold">{formatINR(x.amount)}</td><td><Badge tone={x.status === "PAID" ? "ok" : x.status === "FAILED" ? "danger" : "warn"}>{x.status}</Badge></td><td className="font-mono text-xs">{x.providerPaymentId ?? x.providerOrderId ?? "—"}</td><td className="text-xs">{x.createdAt.toLocaleString("en-IN")}</td></tr>)}
      </DataTable>
    </>
  );
}
