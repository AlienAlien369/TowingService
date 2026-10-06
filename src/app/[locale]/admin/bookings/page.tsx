import Link from "next/link";
import { db } from "@/shared/lib/db";
import { loadLocale } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { STATUS_LABEL } from "@/modules/bookings/state";
import { Badge, DataTable, EmptyState } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import type { BookingStatus } from "@/generated/prisma/enums";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string; q?: string; page?: string }> };
const STATUSES = Object.keys(STATUS_LABEL) as BookingStatus[];
const PAGE = 25;

export default async function AdminBookings({ params, searchParams }: Props) {
  const { p } = await loadLocale(params);
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as BookingStatus) ? (sp.status as BookingStatus) : undefined;
  const q = sp.q?.trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const where = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ code: { contains: q.toUpperCase() } }, { contactPhone: { contains: q } }, { contactName: { contains: q, mode: "insensitive" as const } }, { vehicleNumber: { contains: q.toUpperCase() } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.booking.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { service: true, vehicleType: true, driver: true } }),
    db.booking.count({ where }),
  ]);
  const href = (over: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const m = { status, q, page: String(page), ...over };
    for (const [k, v] of Object.entries(m)) if (v) u.set(k, v);
    return `${p("/admin/bookings")}?${u}`;
  };
  return (
    <>
      <PageTitle title="Bookings" sub={`${total} found`} />
      <form className="mb-4 flex flex-wrap gap-2" action={p("/admin/bookings")}>
        <input name="q" defaultValue={q} placeholder="Search code, phone, name, vehicle no." className="h-11 min-w-64 flex-1 rounded-xl border-2 border-line bg-surface px-3.5" />
        <select name="status" defaultValue={status ?? ""} className="h-11 rounded-xl border-2 border-line bg-surface px-3" aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]} ({s})</option>)}
        </select>
        <button className="h-11 rounded-xl bg-ink px-5 font-bold text-white">Filter</button>
      </form>
      {rows.length === 0 ? <EmptyState title="No bookings match" /> : (
        <DataTable head={["Code", "When", "Service", "Customer", "Driver", "Total", "Pay", "Status"]}>
          {rows.map((b) => (
            <tr key={b.id}>
              <td><Link href={p(`/admin/bookings/${b.id}`)} className="font-mono text-xs font-bold underline">{b.code}</Link></td>
              <td className="whitespace-nowrap text-xs">{b.createdAt.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}{b.scheduledFor && <Badge tone="info" className="ml-1">sched</Badge>}</td>
              <td>{L(b.service.name, "en")}<span className="block text-xs text-muted">{L(b.vehicleType.name, "en").split("(")[0]}</span></td>
              <td>{b.contactName}<span className="block text-xs text-muted">{b.contactPhone}</span></td>
              <td>{b.driver?.name ?? "—"}</td>
              <td className="font-bold">{formatINR(b.total)}</td>
              <td><Badge tone={b.paymentStatus === "PAID" ? "ok" : "neutral"}>{b.paymentMethod === "CASH" ? "cash" : "online"} · {b.paymentStatus.toLowerCase()}</Badge></td>
              <td><Badge tone={b.status === "COMPLETED" ? "ok" : b.status === "CANCELLED" ? "danger" : b.status === "NO_DRIVER_FOUND" ? "warn" : "brand"}>{STATUS_LABEL[b.status]}</Badge></td>
            </tr>
          ))}
        </DataTable>
      )}
      <div className="mt-4 flex items-center justify-between text-sm font-bold">
        <span>Page {page} of {Math.max(1, Math.ceil(total / PAGE))}</span>
        <span className="flex gap-2">
          {page > 1 && <Link className="rounded-lg border border-line bg-surface px-3 py-1.5" href={href({ page: String(page - 1) })}>← Prev</Link>}
          {page * PAGE < total && <Link className="rounded-lg border border-line bg-surface px-3 py-1.5" href={href({ page: String(page + 1) })}>Next →</Link>}
        </span>
      </div>
    </>
  );
}
