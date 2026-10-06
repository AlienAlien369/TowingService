import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { formatINR } from "@/shared/lib/utils";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { Badge, Card, DataTable, EmptyState, Stat } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { PayoutForm } from "@/shared/client/provider-forms";

export default async function DriverEarnings({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/driver/earnings"));
  const { driver } = await getProviderContext(user.id);
  const d = driver!;
  const rows = await db.ledgerEntry.findMany({ where: { driverId: d.id }, orderBy: { createdAt: "desc" }, take: 100, include: { booking: { select: { code: true, paymentMethod: true, completedAt: true } } } });
  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + f(r), 0);
  const earned = sum((r) => r.net);
  const pending = sum((r) => (r.status === "PENDING" ? r.net : 0));
  // Cash jobs: the provider already holds the customer's money and owes the platform its commission + GST share.
  const owed = sum((r) => (r.booking.paymentMethod === "CASH" && r.status === "PENDING" ? r.gross - r.net : 0));
  return (
    <>
      <PageTitle title="Earnings" sub="Your take-home per job, after platform commission." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Total earned" value={formatINR(earned)} hint={`${rows.length} jobs`} />
        <Stat label="Awaiting settlement" value={formatINR(pending)} hint="Settled weekly" />
        <Stat label="Owed to platform (cash jobs)" value={formatINR(owed)} hint="Commission + GST on cash collected" />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No completed jobs yet">Your earnings will appear here after your first job.</EmptyState>
      ) : (
        <DataTable head={["Booking", "Date", "Customer paid", "Commission", "You earn", "Status"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="font-mono text-xs font-bold">{r.booking.code}<span className="block font-sans font-normal text-muted">{r.booking.paymentMethod === "CASH" ? "cash" : "online"}</span></td>
              <td>{r.createdAt.toLocaleDateString("en-IN")}</td>
              <td>{formatINR(r.gross)}</td>
              <td>−{formatINR(r.commission)}</td>
              <td className="font-bold">{formatINR(r.net)}</td>
              <td><Badge tone={r.status === "SETTLED" ? "ok" : "warn"}>{r.status}</Badge></td>
            </tr>
          ))}
        </DataTable>
      )}
      <Card className="mt-8 p-5">
        <h2 className="mb-3 text-3xl font-extrabold uppercase">Payout details</h2>
        <PayoutForm initial={{ upiId: d.upiId ?? "", bankAccountName: d.bankAccountName ?? "", bankAccountNo: d.bankAccountNo ?? "", bankIfsc: d.bankIfsc ?? "" }} />
      </Card>
    </>
  );
}
