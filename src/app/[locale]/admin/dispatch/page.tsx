import Link from "next/link";
import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { getSetting } from "@/modules/settings/service";
import { STATUS_LABEL } from "@/modules/bookings/state";
import { Badge, Card, EmptyState } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { AutoRefresh } from "@/shared/client/admin-controls";
import { Map } from "@/shared/client/map";
import type { MapMarker } from "@/shared/client/map";

export default async function DispatchBoard({ params }: LocaleParams) {
  const { p } = await loadLocale(params);
  const [maps, bookings, drivers] = await Promise.all([
    getSetting("maps"),
    db.booking.findMany({ where: { status: { in: ["PENDING_DISPATCH", "OFFERED", "NO_DRIVER_FOUND", "ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"] } }, orderBy: { createdAt: "asc" }, include: { service: true, vehicleType: true, driver: true, offers: { where: { status: "PENDING" } } } }),
    db.driver.findMany({ where: { status: "ACTIVE", isOnline: true }, include: { company: true } }),
  ]);
  const cols = [
    { title: "Needs attention", tone: "danger" as const, items: bookings.filter((b) => b.status === "NO_DRIVER_FOUND" || (b.status === "PENDING_DISPATCH" && !b.scheduledFor)) },
    { title: "Offered", tone: "warn" as const, items: bookings.filter((b) => b.status === "OFFERED") },
    { title: "Scheduled", tone: "info" as const, items: bookings.filter((b) => b.status === "PENDING_DISPATCH" && b.scheduledFor) },
    { title: "In flight", tone: "ok" as const, items: bookings.filter((b) => ["ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(b.status)) },
  ];
  const markers: MapMarker[] = [
    ...drivers.filter((d) => d.lastLat != null).map((d) => ({ id: d.id, lat: d.lastLat!, lng: d.lastLng!, kind: "driver" as const, label: d.name })),
    ...bookings.filter((b) => ["PENDING_DISPATCH", "OFFERED", "NO_DRIVER_FOUND"].includes(b.status)).map((b) => ({ id: b.id, lat: b.pickupLat, lng: b.pickupLng, kind: "job" as const, label: b.code })),
  ];
  return (
    <>
      <PageTitle title="Dispatch board" sub={`${drivers.length} drivers online · ${bookings.length} open bookings`} actions={<AutoRefresh seconds={8} />} />
      <Map className="mb-6 h-80 w-full rounded-2xl border border-line" center={[maps.centerLat, maps.centerLng]} zoom={11} tileUrl={maps.tileUrl} markers={markers} fitKey={`${markers.length}`} />
      <div className="grid gap-4 lg:grid-cols-4">
        {cols.map((c) => (
          <section key={c.title} aria-label={c.title}>
            <h2 className="mb-2 flex items-center justify-between text-xl font-extrabold uppercase">{c.title} <Badge tone={c.tone}>{c.items.length}</Badge></h2>
            <div className="space-y-2">
              {c.items.length === 0 && <EmptyState title="—" />}
              {c.items.map((b) => (
                <Link key={b.id} href={p(`/admin/bookings/${b.id}`)} className="block">
                  <Card className="p-3 transition hover:border-ink">
                    <div className="flex items-center justify-between"><span className="font-mono text-xs font-bold">{b.code}</span><Badge>{STATUS_LABEL[b.status]}</Badge></div>
                    <p className="mt-1 font-bold leading-tight">{L(b.service.name, "en")} · {L(b.vehicleType.name, "en").split("(")[0]}</p>
                    <p className="line-clamp-2 text-xs text-muted">{b.pickupAddress}</p>
                    <div className="mt-1 flex items-center justify-between text-xs"><span>{b.driver?.name ?? (b.offers.length ? `${b.offers.length} offer(s) out` : "unassigned")}</span><b>{formatINR(b.total)}</b></div>
                    {b.scheduledFor && <p className="mt-1 text-xs font-bold text-info">⏰ {b.scheduledFor.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</p>}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
