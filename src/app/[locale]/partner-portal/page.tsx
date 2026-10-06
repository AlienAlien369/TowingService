import Link from "next/link";
import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { formatINR } from "@/shared/lib/utils";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { Alert, Badge, DataTable, Stat } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";

export default async function PartnerHome({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/partner-portal"));
  const { company } = await getProviderContext(user.id);
  const c = company!;
  const [drivers, trucks, ledger, live] = await Promise.all([
    db.driver.findMany({ where: { companyId: c.id } }),
    db.truck.count({ where: { companyId: c.id } }),
    db.ledgerEntry.aggregate({ where: { companyId: c.id }, _sum: { net: true, gross: true }, _count: true }),
    db.booking.findMany({ where: { driver: { companyId: c.id }, status: { in: ["ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"] } }, include: { driver: true, service: true }, take: 20 }),
  ]);
  return (
    <>
      <PageTitle title={c.tradeName || c.legalName} sub={`Status: ${c.status} · Commission ${((c.commissionBp ?? 2000) / 100).toFixed(0)}%`} />
      {c.status === "PENDING" && <Alert tone="info" title="Application under review" className="mb-4">We'll email you when your company is approved.</Alert>}
      {c.status === "APPROVED" && <Alert tone="warn" title="Sign your fleet agreement to go live" className="mb-4"><Link href={p("/partner-portal/contract")} className="font-bold underline">Review & sign</Link> — your drivers can't receive jobs until then.</Alert>}
      {c.status === "REJECTED" && <Alert tone="danger" title="Application not approved" className="mb-4">{c.reviewNote ?? "Please contact partners support."}</Alert>}
      {c.status === "SUSPENDED" && <Alert tone="danger" title="Account suspended" className="mb-4">Contact partners support.</Alert>}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Drivers" value={drivers.length} hint={`${drivers.filter((d) => d.isOnline).length} online now`} />
        <Stat label="Vehicles" value={trucks} />
        <Stat label="Jobs completed" value={ledger._count} />
        <Stat label="Total earned" value={formatINR(ledger._sum.net ?? 0)} hint="after commission" />
      </div>
      <h2 className="mb-3 text-3xl font-extrabold uppercase">Live jobs</h2>
      {live.length === 0 ? <p className="text-muted">No active jobs right now.</p> : (
        <DataTable head={["Booking", "Service", "Driver", "Status"]}>
          {live.map((b) => <tr key={b.id}><td className="font-mono text-xs font-bold">{b.code}</td><td>{(b.service.name as { en: string }).en}</td><td>{b.driver?.name}</td><td><Badge tone="brand">{b.status.replace(/_/g, " ")}</Badge></td></tr>)}
        </DataTable>
      )}
    </>
  );
}
