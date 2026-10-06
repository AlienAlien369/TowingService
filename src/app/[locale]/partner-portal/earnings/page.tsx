import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { formatINR } from "@/shared/lib/utils";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { Badge, Card, DataTable, EmptyState, Stat } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { PayoutForm } from "@/shared/client/provider-forms";

export default async function PartnerEarnings({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/partner-portal/earnings"));
  const { company } = await getProviderContext(user.id);
  const c = company!;
  const rows = await db.ledgerEntry.findMany({ where: { companyId: c.id }, orderBy: { createdAt: "desc" }, take: 200, include: { booking: { select: { code: true, paymentMethod: true } }, driver: { select: { name: true } } } });
  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + f(r), 0);
  return (
    <>
      <PageTitle title="Earnings" sub="Settlements are paid to the company's bank / UPI on a weekly cycle." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Total earned" value={formatINR(sum((r) => r.net))} />
        <Stat label="Awaiting settlement" value={formatINR(sum((r) => (r.status === "PENDING" ? r.net : 0)))} />
        <Stat label="Owed to platform (cash jobs)" value={formatINR(sum((r) => (r.booking.paymentMethod === "CASH" && r.status === "PENDING" ? r.gross - r.net : 0)))} />
      </div>
      {rows.length === 0 ? <EmptyState title="No completed jobs yet" /> : (
        <DataTable head={["Booking", "Driver", "Date", "Customer paid", "Commission", "Net", "Status"]}>
          {rows.map((r) => (
            <tr key={r.id}><td className="font-mono text-xs font-bold">{r.booking.code}</td><td>{r.driver.name}</td><td>{r.createdAt.toLocaleDateString("en-IN")}</td><td>{formatINR(r.gross)}</td><td>−{formatINR(r.commission)}</td><td className="font-bold">{formatINR(r.net)}</td><td><Badge tone={r.status === "SETTLED" ? "ok" : "warn"}>{r.status}</Badge></td></tr>
          ))}
        </DataTable>
      )}
      <Card className="mt-8 p-5">
        <h2 className="mb-3 text-3xl font-extrabold uppercase">Payout details</h2>
        <PayoutForm initial={{ upiId: c.upiId ?? "", bankAccountName: c.bankAccountName ?? "", bankAccountNo: c.bankAccountNo ?? "", bankIfsc: c.bankIfsc ?? "" }} />
      </Card>
    </>
  );
}
