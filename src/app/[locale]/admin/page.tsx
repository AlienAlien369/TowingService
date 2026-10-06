import Link from "next/link";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { dashboardStats } from "@/modules/admin/queries";
import { STATUS_LABEL } from "@/modules/bookings/state";
import { Alert, Badge, Card, DataTable, Stat } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";

export default async function AdminDashboard({ params }: LocaleParams) {
  const { p } = await loadLocale(params);
  const s = await dashboardStats();
  const max = Math.max(1, ...s.days.map((d) => d.total));
  return (
    <>
      <PageTitle title="Dashboard" sub="Live operations snapshot (India time)." />
      {s.attention > 0 && <Alert tone="warn" title={`${s.attention} booking(s) need dispatcher attention`} className="mb-4"><Link href={p("/admin/dispatch")} className="font-bold underline">Open dispatch board</Link></Alert>}
      {s.pendingProviders > 0 && <Alert tone="info" title={`${s.pendingProviders} partner application(s) awaiting review`} className="mb-4"><Link href={p("/admin/providers")} className="font-bold underline">Review applications</Link></Alert>}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Bookings today" value={s.todayBookings} hint={`${s.completedToday} completed`} />
        <Stat label="Active jobs" value={s.active} hint={`${s.online} drivers online`} />
        <Stat label="Revenue · 7 days" value={formatINR(s.gmv7._sum.total ?? 0)} hint={`${s.gmv7._count} completed jobs`} />
        <Stat label="Revenue · 30 days" value={formatINR(s.gmv30._sum.total ?? 0)} hint={`taxable ${formatINR(s.gmv30._sum.subtotal ?? 0)}`} />
      </div>
      <Card className="mb-6 p-5">
        <h2 className="mb-3 text-2xl font-extrabold uppercase">Bookings · last 14 days</h2>
        <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Bookings per day for the last 14 days">
          {s.days.map((d) => (
            <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100">{d.total}</span>
              <div className="relative w-full overflow-hidden rounded-t bg-ink-soft" style={{ height: `${Math.max(4, (d.total / max) * 100)}%` }} title={`${d.label}: ${d.total} bookings, ${d.completed} completed`}>
                <div className="absolute inset-x-0 bottom-0 bg-brand" style={{ height: `${d.total ? (d.completed / d.total) * 100 : 0}%` }} />
              </div>
              <span className="text-[10px] text-muted">{d.label.slice(3)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted"><span className="mr-1 inline-block size-2.5 rounded-sm bg-brand" /> completed · <span className="mr-1 inline-block size-2.5 rounded-sm bg-ink-soft" /> total</p>
      </Card>
      <h2 className="mb-3 text-3xl font-extrabold uppercase">Recent bookings</h2>
      <DataTable head={["Code", "Service", "Customer", "Driver", "Total", "Status"]}>
        {s.recent.map((b) => (
          <tr key={b.id}>
            <td><Link href={p(`/admin/bookings/${b.id}`)} className="font-mono text-xs font-bold underline">{b.code}</Link></td>
            <td>{L(b.service.name, "en")}</td>
            <td>{b.contactName}<span className="block text-xs text-muted">{b.contactPhone}</span></td>
            <td>{b.driver?.name ?? "—"}</td>
            <td className="font-bold">{formatINR(b.total)}</td>
            <td><Badge tone={b.status === "COMPLETED" ? "ok" : b.status === "CANCELLED" ? "danger" : b.status === "NO_DRIVER_FOUND" ? "warn" : "brand"}>{STATUS_LABEL[b.status]}</Badge></td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
