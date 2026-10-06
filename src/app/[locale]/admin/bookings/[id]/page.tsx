import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/shared/lib/db";
import { loadLocale } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { formatINR, haversineKm } from "@/shared/lib/utils";
import { canTransition, STATUS_LABEL } from "@/modules/bookings/state";
import { Badge, Card, DataTable } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { AssignDriver, BookingStatusControls } from "@/shared/client/admin-controls";
import type { BookingStatus } from "@/generated/prisma/enums";
import type { Quote } from "@/modules/pricing/engine";

type Props = { params: Promise<{ locale: string; id: string }> };
const ALL = Object.keys(STATUS_LABEL) as BookingStatus[];

export default async function AdminBookingDetail({ params }: Props) {
  const { id } = await params;
  const { p } = await loadLocale(params);
  const b = await db.booking.findUnique({
    where: { id },
    include: { service: true, vehicleType: true, customer: true, driver: { include: { company: true } }, events: { orderBy: { createdAt: "desc" } }, offers: { include: { driver: true }, orderBy: { createdAt: "desc" } }, payments: true, invoice: true, review: true, ledger: true },
  });
  if (!b) notFound();
  const q = b.fare as unknown as Quote;
  const canAssign = ["PENDING_DISPATCH", "OFFERED", "NO_DRIVER_FOUND"].includes(b.status);
  const drivers = canAssign
    ? (await db.driver.findMany({ where: { status: "ACTIVE" }, include: { company: true, vehicleTypes: { select: { id: true } }, services: { select: { id: true } } } }))
        .map((d) => {
          const dist = d.lastLat != null && d.lastLng != null ? haversineKm({ lat: b.pickupLat, lng: b.pickupLng }, { lat: d.lastLat, lng: d.lastLng }) : null;
          const ok = d.vehicleTypes.some((v) => v.id === b.vehicleTypeId) && d.services.some((s) => s.id === b.serviceId);
          return { d, dist, ok };
        })
        .sort((a, c) => Number(c.d.isOnline) - Number(a.d.isOnline) || (a.dist ?? 999) - (c.dist ?? 999))
        .map(({ d, dist, ok }) => ({ id: d.id, label: `${d.isOnline ? "● " : "○ "}${d.name}${d.company ? ` (${d.company.tradeName || d.company.legalName})` : ""}${dist != null ? ` · ${dist.toFixed(1)} km` : ""}${ok ? "" : " · ⚠ capability mismatch"}` }))
    : [];
  const allowed = ALL.filter((s) => canTransition(b.status, s));

  return (
    <>
      <PageTitle title={b.code} sub={`${L(b.service.name, "en")} · ${L(b.vehicleType.name, "en")}`} actions={<Badge tone={b.status === "COMPLETED" ? "ok" : b.status === "CANCELLED" ? "danger" : "brand"} className="!px-3 !py-1.5 text-sm">{STATUS_LABEL[b.status]}</Badge>} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="grid gap-4 p-5 text-sm sm:grid-cols-2">
            <Info k="Customer" v={`${b.contactName} · ${b.contactPhone}${b.contactEmail ? ` · ${b.contactEmail}` : ""}`} />
            <Info k="Vehicle" v={[b.vehicleNumber, b.vehicleDetails].filter(Boolean).join(" · ") || "—"} />
            <Info k="Pickup" v={b.pickupAddress} />
            <Info k="Drop" v={b.dropAddress ?? "On-spot service"} />
            <Info k="Distance" v={`${b.distanceKm} km${b.durationMin ? ` · ~${b.durationMin} min` : ""}`} />
            <Info k="Scheduled" v={b.scheduledFor ? b.scheduledFor.toLocaleString("en-IN") : "Immediate"} />
            <Info k="Trip PIN" v={b.startPin} />
            <Info k="Notes" v={b.notes ?? "—"} />
            {b.cancelReason && <Info k="Cancelled" v={`${b.cancelledBy}: ${b.cancelReason}`} />}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-2xl font-extrabold uppercase">Fare</h2>
            <dl className="space-y-1 text-sm">
              <Line k="Base fare" v={q.baseFare} />
              {q.distanceCharge > 0 && <Line k={`Distance (${q.billableKm} km)`} v={q.distanceCharge} />}
              {q.minFareTopUp > 0 && <Line k="Min-fare top-up" v={q.minFareTopUp} />}
              {q.nightSurcharge > 0 && <Line k="Night surcharge" v={q.nightSurcharge} />}
              {q.surgeSurcharge > 0 && <Line k="Surge" v={q.surgeSurcharge} />}
              <Line k="Taxable value" v={b.subtotal} bold />
              <Line k={`GST @ ${q.gstRatePct}%`} v={b.gstAmount} />
              <Line k="Total" v={b.total} bold />
            </dl>
            <p className="mt-3 text-sm">Payment: <b>{b.paymentMethod}</b> · <Badge tone={b.paymentStatus === "PAID" ? "ok" : "warn"}>{b.paymentStatus}</Badge> {b.invoice && <Link className="ml-2 font-bold underline" href={`/en/invoice/${b.code}`} target="_blank">Invoice {b.invoice.number}</Link>}</p>
            {b.ledger[0] && <p className="mt-1 text-sm text-muted">Ledger: provider net {formatINR(b.ledger[0].net)}, commission {formatINR(b.ledger[0].commission)} ({b.ledger[0].status})</p>}
          </Card>
          <section>
            <h2 className="mb-2 text-2xl font-extrabold uppercase">Dispatch offers</h2>
            {b.offers.length === 0 ? <p className="text-sm text-muted">No offers sent.</p> : (
              <DataTable head={["Round", "Driver", "Distance", "Status", "Sent"]}>
                {b.offers.map((o) => <tr key={o.id}><td>{o.round}</td><td>{o.driver.name}</td><td>{o.distanceKm} km</td><td><Badge tone={o.status === "ACCEPTED" ? "ok" : o.status === "PENDING" ? "warn" : "neutral"}>{o.status}</Badge></td><td className="text-xs">{o.createdAt.toLocaleTimeString("en-IN")}</td></tr>)}
              </DataTable>
            )}
          </section>
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-2 text-2xl font-extrabold uppercase">Driver</h2>
            {b.driver ? (
              <p className="text-sm"><b className="text-lg">{b.driver.name}</b><br />{b.driver.phone} · {b.driver.email}<br />{b.driver.company ? `Company: ${b.driver.company.tradeName || b.driver.company.legalName}` : "Independent"}{b.review && <><br />Customer rating: {"★".repeat(b.review.rating)} {b.review.comment}</>}</p>
            ) : <p className="text-sm text-muted">Not assigned.</p>}
            {canAssign && <div className="mt-3"><AssignDriver bookingId={b.id} drivers={drivers} /></div>}
          </Card>
          {allowed.length > 0 && <Card className="p-5"><h2 className="mb-2 text-2xl font-extrabold uppercase">Actions</h2><BookingStatusControls bookingId={b.id} allowed={allowed} /></Card>}
          <Card className="p-5">
            <h2 className="mb-2 text-2xl font-extrabold uppercase">Timeline</h2>
            <ol className="space-y-2 border-l-2 border-line pl-4 text-sm">
              {b.events.map((e) => <li key={e.id}><b>{STATUS_LABEL[e.status]}</b> <span className="text-muted">· {e.actorType.toLowerCase()}</span>{e.note && <span className="block text-muted">{e.note}</span>}<span className="block text-xs text-muted">{e.createdAt.toLocaleString("en-IN")}</span></li>)}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

const Info = ({ k, v }: { k: string; v: string }) => <div><p className="text-xs font-bold uppercase tracking-wider text-muted">{k}</p><p className="font-semibold">{v}</p></div>;
const Line = ({ k, v, bold }: { k: string; v: number; bold?: boolean }) => <div className={`flex justify-between ${bold ? "border-t border-line pt-1 font-extrabold" : ""}`}><dt>{k}</dt><dd>{formatINR(v, { decimals: true })}</dd></div>;
