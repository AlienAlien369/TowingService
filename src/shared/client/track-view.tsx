"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, CircleDot, FileText, Phone, ShieldCheck, Star, Truck, XCircle } from "lucide-react";
import type { TrackData } from "@/modules/bookings/track-data";
import { cancelBookingAction, createPaymentOrderAction, reviewAction, verifyPaymentAction } from "@/modules/bookings/actions";
import { Alert, Badge, Button, Card, Textarea } from "@/shared/ui";
import { cn, formatINR } from "@/shared/lib/utils";
import { fmt } from "@/shared/lib/localized";
import type { Dict } from "@/i18n";
import { Map, type MapMarker } from "./map";
import { openRazorpay } from "./razorpay";

const FLOW = ["PENDING_DISPATCH", "ASSIGNED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS", "COMPLETED"] as const;
const stepIndex = (s: string) => (s === "OFFERED" || s === "NO_DRIVER_FOUND" ? 0 : Math.max(0, FLOW.indexOf(s as (typeof FLOW)[number])));

export function TrackView({ initial, d, locale, isNew, loginHref, brandName, map }: { initial: TrackData; d: Dict; locale: "en" | "hi"; isNew: boolean; loginHref: string; brandName: string; map: { tileUrl: string } }) {
  const t = d.track;
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const terminal = data.status === "COMPLETED" || data.status === "CANCELLED";

  // Poll for live updates (status + driver location). Pauses when the tab is hidden or the job is over.
  useEffect(() => {
    if (terminal) return;
    let stop = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/track/${data.code}`, { cache: "no-store" });
        if (r.ok && !stop) setData((await r.json()) as TrackData);
      } catch {
        /* transient */
      }
    };
    const id = setInterval(tick, 5000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [data.code, terminal]);

  const idx = stepIndex(data.status);
  const svc = locale === "hi" ? data.service.hi || data.service.en : data.service.en;
  const veh = locale === "hi" ? data.vehicle.hi || data.vehicle.en : data.vehicle.en;
  const markers = useMemo(() => {
    const m: MapMarker[] = [{ id: "pickup", lat: data.pickup.lat, lng: data.pickup.lng, kind: "pickup", label: t.pickup }];
    if (data.drop) m.push({ id: "drop", lat: data.drop.lat, lng: data.drop.lng, kind: "drop", label: t.drop });
    if (data.driver?.lat != null && data.driver.lng != null) m.push({ id: "driver", lat: data.driver.lat, lng: data.driver.lng, kind: "driver", label: data.driver.name });
    return m;
  }, [data, t.pickup, t.drop]);

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? d.common.error);
      else {
        router.refresh();
        const res = await fetch(`/api/track/${data.code}`, { cache: "no-store" });
        if (res.ok) setData((await res.json()) as TrackData);
      }
    });

  const statusTitle = t.steps[data.status];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
      <div className="space-y-4">
        {isNew && <Alert tone="ok" title={d.booking.successTitle}>{d.booking.successSub}</Alert>}

        <Card className="overflow-hidden">
          <div className={cn("flex flex-wrap items-center justify-between gap-3 px-5 py-4", data.status === "CANCELLED" ? "bg-danger text-white" : data.status === "COMPLETED" ? "bg-ok text-white" : "bg-ink text-white")}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/70">{d.booking.codeLabel}</p>
              <p className="font-display text-4xl font-extrabold leading-none tracking-wider">{data.code}</p>
            </div>
            <Badge tone={data.status === "COMPLETED" ? "ok" : data.status === "CANCELLED" ? "danger" : "brand"} className="!px-3 !py-1.5 text-sm">{statusTitle}</Badge>
          </div>
          {!["CANCELLED"].includes(data.status) && (
            <ol className="grid grid-cols-6 gap-1 p-4" aria-label={t.timeline}>
              {FLOW.map((s, i) => (
                <li key={s} className="text-center">
                  <span className={cn("mx-auto grid size-8 place-items-center rounded-full text-xs font-extrabold", i < idx ? "bg-ink text-white" : i === idx ? "bg-brand text-ink ring-2 ring-ink" : "bg-ink-soft text-muted")} aria-current={i === idx ? "step" : undefined}>
                    {i < idx || data.status === "COMPLETED" ? <CheckCircle2 className="size-4" /> : i + 1}
                  </span>
                  <span className={cn("mt-1 block text-[10px] font-bold leading-tight sm:text-xs", i === idx ? "text-ink" : "text-muted")}>{t.steps[s]}</span>
                </li>
              ))}
            </ol>
          )}
          {["PENDING_DISPATCH", "OFFERED"].includes(data.status) && <p className="border-t border-line px-5 py-3 text-sm font-semibold"><span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-brand ring-2 ring-ink" />{data.scheduledFor ? `${locale === "hi" ? "शेड्यूल" : "Scheduled"}: ${new Date(data.scheduledFor).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short" })}` : t.searching}</p>}
          {data.status === "NO_DRIVER_FOUND" && <Alert tone="warn" className="m-4">{t.noDriver}</Alert>}
        </Card>

        {data.driver && (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-14 place-items-center rounded-full bg-brand text-ink"><Truck className="size-7" /></span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{t.driver}</p>
                  <p className="text-2xl font-extrabold leading-tight">{data.driver.name}</p>
                  <p className="flex items-center gap-1 text-sm text-muted">
                    {data.driver.ratingCount > 0 && <><Star className="size-4 fill-brand text-brand" /> <b className="text-ink">{data.driver.rating.toFixed(1)}</b> ({data.driver.ratingCount}) · </>}
                    {data.driver.truck && <>{t.truck}: <b className="text-ink">{data.driver.truck}</b></>}
                  </p>
                  {data.driver.company && <p className="text-xs text-muted">{data.driver.company}</p>}
                </div>
              </div>
              {!terminal && <a href={`tel:${data.driver.phone}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white"><Phone className="size-4" /> {t.callDriver}</a>}
            </div>
            {data.pin && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-brand p-4">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider"><ShieldCheck className="size-4" /> {t.pin}</p>
                  <p className="font-mono text-4xl font-extrabold tracking-[0.4em]">{data.pin}</p>
                </div>
                <p className="max-w-[14rem] text-xs font-semibold text-ink/80">{t.pinHint}</p>
              </div>
            )}
          </Card>
        )}

        <Card className="p-5">
          <h2 className="mb-3 text-3xl font-extrabold uppercase">{svc} · {veh}</h2>
          <dl className="space-y-3 text-sm">
            <Detail icon={<CircleDot className="size-4" />} label={t.pickup} value={data.pickup.address} />
            {data.drop && <Detail icon={<CircleDot className="size-4 text-brand-strong" />} label={t.drop} value={data.drop.address} />}
            <div className="flex items-center justify-between border-t border-line pt-3">
              <dt className="font-bold">{t.fare} <span className="font-normal text-muted">({d.common.gstIncl})</span></dt>
              <dd className="font-display text-3xl font-extrabold">{formatINR(data.total)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-bold">{t.payment}</dt>
              <dd><Badge tone={data.paymentStatus === "PAID" ? "ok" : "warn"}>{data.paymentStatus === "PAID" ? t.paid : data.paymentMethod === "CASH" ? t.unpaid : t.pending}</Badge></dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.invoiceNumber && <Link href={`/${locale}/invoice/${data.code}`} className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-ink/15 px-4 text-sm font-bold hover:border-ink"><FileText className="size-4" /> {t.invoice} · {data.invoiceNumber}</Link>}
            {data.payOnlineEnabled && data.isOwner && (
              <Button onClick={() => act(async () => {
                const o = await createPaymentOrderAction(data.id);
                if (!o.ok) return { ok: false, error: o.error };
                const paid = await openRazorpay(o.data!, brandName);
                if (!paid) return { ok: false, error: d.common.error };
                const v = await verifyPaymentAction(paid);
                return v.ok ? { ok: true } : { ok: false, error: v.error };
              })} loading={pending}>{t.payOnline}</Button>
            )}
          </div>
        </Card>

        {data.status === "COMPLETED" && data.isOwner && !data.reviewed && (
          <Card className="p-5">
            <h2 className="text-3xl font-extrabold uppercase">{t.rate}</h2>
            <div className="my-3 flex gap-1" role="radiogroup" aria-label={t.rating}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}`} onClick={() => setRating(n)} className="rounded p-1">
                  <Star className={cn("size-9 transition", n <= rating ? "fill-brand text-brand" : "text-line")} />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.comment} maxLength={500} />
            <Button className="mt-3" disabled={!rating} loading={pending} onClick={() => act(() => reviewAction(data.id, rating, comment))}>{t.submitReview}</Button>
          </Card>
        )}
        {data.status === "COMPLETED" && data.reviewed && <Alert tone="ok">{t.rateThanks}</Alert>}

        {error && <Alert tone="danger">{error}</Alert>}

        {data.canCancel && (
          data.isOwner ? (
            <Card className="p-5">
              {!confirmCancel ? (
                <Button variant="outline" onClick={() => setConfirmCancel(true)}><XCircle className="size-4" /> {t.cancel}</Button>
              ) : (
                <div className="space-y-3">
                  <p className="font-bold">{t.cancelConfirm}</p>
                  {["EN_ROUTE", "ARRIVED"].includes(data.status) && <p className="text-sm text-muted">{fmt(t.cancelFee, { fee: formatINR(data.cancelFee) })}</p>}
                  <div className="flex gap-2">
                    <Button variant="danger" loading={pending} onClick={() => act(() => cancelBookingAction(data.id))}>{t.cancel}</Button>
                    <Button variant="ghost" onClick={() => setConfirmCancel(false)}>{d.common.back}</Button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Alert tone="info"><Link href={loginHref} className="font-bold underline">{d.nav.login}</Link> — {t.cancel}</Alert>
          )
        )}
      </div>

      <aside className="space-y-4">
        <div className="sticky top-28 space-y-4">
          <Map className="h-[340px] w-full rounded-2xl border border-line shadow-card" center={[data.pickup.lat, data.pickup.lng]} zoom={14} tileUrl={map.tileUrl} markers={markers} fitKey={`${markers.length}|${data.driver?.lat?.toFixed(3)}|${data.status}`} />
          <Card className="p-4">
            <h3 className="mb-2 text-xl font-extrabold uppercase">{t.timeline}</h3>
            <ol className="space-y-2.5 border-l-2 border-line pl-4">
              {[...data.events].reverse().map((e, i) => (
                <li key={i} className="relative text-sm">
                  <span className={cn("absolute -left-[1.4rem] top-1 size-3 rounded-full border-2 border-surface", i === 0 ? "bg-brand ring-2 ring-ink" : "bg-ink/30")} />
                  <p className="font-bold">{t.steps[e.status]}</p>
                  {e.note && <p className="text-muted">{e.note}</p>}
                  <p className="text-xs text-muted">{new Date(e.at).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </aside>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5">{icon}</span>
      <div>
        <dt className="text-xs font-bold uppercase tracking-wider text-muted">{label}</dt>
        <dd className="font-semibold">{value}</dd>
      </div>
    </div>
  );
}
