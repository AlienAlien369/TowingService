"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, CreditCard, Lock, Pencil, Wallet } from "lucide-react";
import { createBookingAction, createPaymentOrderAction, quoteAction, verifyPaymentAction } from "@/modules/bookings/actions";
import type { QuoteResult } from "@/modules/pricing/service";
import { Alert, Badge, Button, Card, Field, Input, Select, Textarea } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import { cn, formatINR } from "@/shared/lib/utils";
import { fmt } from "@/shared/lib/localized";
import type { Dict } from "@/i18n";
import { Map, type MapMarker } from "./map";
import { PlaceSearch, type PickedPlace } from "./place-search";
import { OtpLogin } from "./otp-login";
import { LeadForm } from "./lead-form";
import { trackClient } from "./track";
import { openRazorpay } from "./razorpay";

type VehicleOpt = { id: string; slug: string; name: string; description: string; icon: string };
type ServiceOpt = { id: string; slug: string; name: string; short: string; icon: string; requiresDrop: boolean; eta: number };

export type WizardProps = {
  locale: "en" | "hi";
  d: Dict;
  brandName: string;
  vehicles: VehicleOpt[];
  services: ServiceOpt[];
  combos: Record<string, string[]>;
  pay: { cash: boolean; razorpayEnabled: boolean };
  allowScheduling: boolean;
  map: { tileUrl: string; lat: number; lng: number; zoom: number };
  user: { name: string; phone: string; email: string } | null;
  initial: { vehicle?: string; service?: string };
  cancellationFee: string;
};

export function BookingWizard(p: WizardProps) {
  const { d, locale } = p;
  const b = d.booking;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [vehicleId, setVehicleId] = useState(p.vehicles.find((v) => v.slug === p.initial.vehicle)?.id ?? "");
  const [serviceId, setServiceId] = useState(p.services.find((s) => s.slug === p.initial.service)?.id ?? "");
  const [pickup, setPickup] = useState<PickedPlace | null>(null);
  const [drop, setDrop] = useState<PickedPlace | null>(null);
  const [target, setTarget] = useState<"pickup" | "drop">("pickup");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoting, setQuoting] = useState(false);

  const [name, setName] = useState(p.user?.name ?? "");
  const [phone, setPhone] = useState(p.user?.phone ?? "");
  const [email, setEmail] = useState(p.user?.email ?? "");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduled, setScheduled] = useState("");
  const [method, setMethod] = useState<"CASH" | "RAZORPAY">(p.pay.cash ? "CASH" : "RAZORPAY");
  const [authed, setAuthed] = useState(Boolean(p.user));
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const started = useRef(false);

  const service = p.services.find((s) => s.id === serviceId);
  const vehicle = p.vehicles.find((v) => v.id === vehicleId);
  const needsDrop = service?.requiresDrop ?? true;
  const availableServices = useMemo(() => (vehicleId ? p.services.filter((s) => p.combos[vehicleId]?.includes(s.id)) : p.services), [vehicleId, p.services, p.combos]);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      trackClient("booking_started", { vehicle: p.initial.vehicle, service: p.initial.service });
    }
  }, [p.initial.vehicle, p.initial.service]);

  // reset a service that isn't offered for the chosen vehicle
  useEffect(() => {
    if (serviceId && vehicleId && !p.combos[vehicleId]?.includes(serviceId)) setServiceId("");
  }, [vehicleId, serviceId, p.combos]);

  const goto = (n: number) => {
    setError(null);
    setStep(n);
  };
  const done = (n: number) => {
    trackClient("booking_step_completed", { step: n });
    goto(n + 1);
  };

  // ── quote (step 2) ──
  const scheduledISO = when === "later" && scheduled ? new Date(scheduled).toISOString() : null;
  const fetchQuote = useCallback(async () => {
    if (!vehicleId || !serviceId || !pickup || (needsDrop && !drop)) return;
    setQuoting(true);
    setQuote(null);
    const r = await quoteAction({ vehicleTypeId: vehicleId, serviceId, pickup: { lat: pickup.lat, lng: pickup.lng }, drop: needsDrop && drop ? { lat: drop.lat, lng: drop.lng } : null, scheduledFor: scheduledISO });
    setQuote(r);
    setQuoting(false);
  }, [vehicleId, serviceId, pickup, drop, needsDrop, scheduledISO]);

  useEffect(() => {
    if (step === 2) void fetchQuote();
  }, [step, fetchQuote]);

  // ── map interaction ──
  async function onMapClick(lat: number, lng: number) {
    let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    try {
      const r = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
      address = ((await r.json()) as { label: string }).label ?? address;
    } catch {
      /* keep coordinates */
    }
    const place = { address, lat, lng };
    if (target === "pickup") {
      setPickup(place);
      if (needsDrop && !drop) setTarget("drop");
    } else setDrop(place);
  }

  const markers: MapMarker[] = [];
  if (pickup) markers.push({ id: "pickup", lat: pickup.lat, lng: pickup.lng, kind: "pickup", label: b.pickup });
  if (needsDrop && drop) markers.push({ id: "drop", lat: drop.lat, lng: drop.lng, kind: "drop", label: b.drop });
  const route = quote && quote.ok ? quote.route?.geometry ?? null : null;

  // ── submit ──
  function submit() {
    setError(null);
    if (!pickup || !vehicleId || !serviceId) return;
    if (!authed) return setError(b.needsLogin);
    startSubmit(async () => {
      const r = await createBookingAction({
        vehicleTypeId: vehicleId, serviceId,
        pickup, drop: needsDrop ? drop : null,
        contactName: name, contactPhone: phone, contactEmail: email || "",
        vehicleNumber, vehicleDetails, notes,
        scheduledFor: scheduledISO, paymentMethod: method,
      });
      if (!r.ok) return setError(r.error);
      const { id, code, payOnline } = r.data!;
      if (payOnline) {
        const order = await createPaymentOrderAction(id);
        if (order.ok) {
          const paid = await openRazorpay(order.data!, p.brandName);
          if (paid) await verifyPaymentAction(paid);
        }
      }
      router.push(`/${locale}/track/${code}?new=1`);
    });
  }

  // ── step guards ──
  const step0ok = Boolean(vehicleId && serviceId);
  const step1ok = Boolean(pickup && (!needsDrop || drop));
  const phoneOk = /^(\+?91)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ""));
  const scheduleOk = when === "now" || (scheduled && new Date(scheduled).getTime() > Date.now() + 30 * 60_000);
  const step3ok = name.trim().length >= 2 && phoneOk && scheduleOk && (method === "CASH" ? p.pay.cash : p.pay.razorpayEnabled);
  const minSchedule = useMemo(() => {
    const t = new Date(Date.now() + 35 * 60_000);
    t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
    return t.toISOString().slice(0, 16);
  }, []);

  const q = quote && quote.ok ? quote.quote : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
      <div className="min-w-0">
        {/* Stepper */}
        <ol className="mb-6 flex items-center gap-1.5" aria-label="Progress">
          {b.steps.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-1.5">
              <button type="button" disabled={i >= step} onClick={() => goto(i)} className={cn("flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-extrabold transition", i === step ? "bg-brand text-ink ring-2 ring-ink" : i < step ? "bg-ink text-white" : "bg-ink-soft text-muted")} aria-current={i === step ? "step" : undefined}>
                {i < step ? <Check className="size-4" /> : i + 1}
                <span className={cn("hidden sm:inline", i !== step && "sm:hidden md:inline")}>{s}</span>
              </button>
              {i < b.steps.length - 1 && <span className={cn("h-0.5 flex-1 rounded", i < step ? "bg-ink" : "bg-line")} />}
            </li>
          ))}
        </ol>

        {/* STEP 0 — vehicle & service */}
        {step === 0 && (
          <Card className="p-5 sm:p-6">
            <h2 className="text-4xl font-extrabold uppercase">{b.s1Title}</h2>
            <p className="mb-2 mt-4 text-sm font-extrabold uppercase tracking-wider text-muted">{b.vehicle}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {p.vehicles.map((v) => (
                <button key={v.id} type="button" onClick={() => setVehicleId(v.id)} aria-pressed={vehicleId === v.id} className={cn("flex items-center gap-3 rounded-xl border-2 p-3 text-left transition", vehicleId === v.id ? "border-ink bg-brand shadow-card" : "border-line hover:border-ink/50")}>
                  <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg", vehicleId === v.id ? "bg-ink text-brand" : "bg-brand-soft")}><Icon name={v.icon} className="size-6" /></span>
                  <span className="font-bold leading-tight">{v.name}</span>
                </button>
              ))}
            </div>
            <p className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-wider text-muted">{b.service}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {availableServices.map((s) => (
                <button key={s.id} type="button" onClick={() => setServiceId(s.id)} aria-pressed={serviceId === s.id} className={cn("flex items-center gap-3 rounded-xl border-2 p-3 text-left transition", serviceId === s.id ? "border-ink bg-brand shadow-card" : "border-line hover:border-ink/50")}>
                  <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg", serviceId === s.id ? "bg-ink text-brand" : "bg-brand-soft")}><Icon name={s.icon} className="size-6" /></span>
                  <span>
                    <span className="block font-bold leading-tight">{s.name}</span>
                    <span className="text-xs text-muted">{s.short}</span>
                  </span>
                </button>
              ))}
            </div>
            <Button className="mt-6 w-full sm:w-auto" size="lg" disabled={!step0ok} onClick={() => done(0)}>{d.common.continue} <ArrowRight className="size-5" /></Button>
          </Card>
        )}

        {/* STEP 1 — locations */}
        {step === 1 && (
          <Card className="space-y-4 p-5 sm:p-6">
            <h2 className="text-4xl font-extrabold uppercase">{b.s2Title}</h2>
            <div onFocusCapture={() => setTarget("pickup")}>
              <PlaceSearch id="pickup" label={b.pickup} placeholder={b.pickupPh} value={pickup} onPick={(v) => { setPickup(v); if (v && needsDrop && !drop) setTarget("drop"); }} withLocate locateLabel={b.useMyLocation} locatingLabel={b.locating} />
            </div>
            {needsDrop ? (
              <div onFocusCapture={() => setTarget("drop")}>
                <PlaceSearch id="drop" label={b.drop} placeholder={b.dropPh} value={drop} onPick={setDrop} />
              </div>
            ) : (
              <Alert tone="info">{b.onSpotNote}</Alert>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-muted">{b.tapMap}</span>
              {needsDrop && (
                <span className="ml-auto inline-flex rounded-lg border border-line p-0.5" role="group">
                  {(["pickup", "drop"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTarget(t)} aria-pressed={target === t} className={cn("rounded-md px-3 py-1 text-xs font-extrabold uppercase", target === t ? "bg-ink text-white" : "text-muted")}>{t === "pickup" ? b.pickup : b.drop}</button>
                  ))}
                </span>
              )}
            </div>
            <div className="lg:hidden">
              <Map center={[p.map.lat, p.map.lng]} zoom={p.map.zoom} tileUrl={p.map.tileUrl} markers={markers} onMapClick={onMapClick} fitKey={markers.map((m) => m.id + m.lat).join()} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="lg" onClick={() => goto(0)}><ArrowLeft className="size-5" /> {d.common.back}</Button>
              <Button size="lg" className="flex-1 sm:flex-none" disabled={!step1ok} onClick={() => done(1)}>{d.common.continue} <ArrowRight className="size-5" /></Button>
            </div>
          </Card>
        )}

        {/* STEP 2 — fare */}
        {step === 2 && (
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-4xl font-extrabold uppercase">{b.s3Title}</h2>
            {quoting && <div className="space-y-2" role="status"><div className="h-6 w-1/2 animate-pulse rounded bg-ink-soft" /><div className="h-24 animate-pulse rounded-xl bg-ink-soft" /></div>}
            {quote && !quote.ok && (
              <div className="space-y-3">
                <Alert tone={quote.code === "COMING_SOON" ? "warn" : "danger"} title={quote.code === "OUT_OF_AREA" ? b.outOfArea : quote.code === "COMING_SOON" ? fmt(b.comingSoonArea, { area: quote.areaName ?? quote.city ?? "" }) : b.noQuote}>{quote.code === "OUT_OF_AREA" || quote.code === "COMING_SOON" ? null : quote.error}</Alert>
                {quote.code === "COMING_SOON" && (
                  <Card className="p-4">
                    <p className="mb-3 font-semibold">{b.leaveNumber}</p>
                    <LeadForm kind="COMING_SOON_AREA" meta={{ area: quote.areaName ?? quote.city ?? "" }} compact labels={{ name: d.common.name, phone: d.common.phone, email: d.common.email, message: d.common.message, submit: d.areas.notifyMe, sent: d.common.sent }} withEmail={false} />
                  </Card>
                )}
                <Button variant="outline" onClick={() => goto(1)}><Pencil className="size-4" /> {b.changeStep}</Button>
              </div>
            )}
            {q && quote?.ok && (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  {needsDrop && <div className="rounded-xl bg-ink-soft p-3"><p className="text-xs font-bold uppercase text-muted">{b.distance}</p><p className="font-display text-3xl font-extrabold leading-none">{q.distanceKm} {d.common.km}</p></div>}
                  <div className="rounded-xl bg-ink-soft p-3"><p className="text-xs font-bold uppercase text-muted">{b.eta}</p><p className="font-display text-3xl font-extrabold leading-none">~{quote.etaMinutes} {d.common.min}</p></div>
                </div>
                <dl className="mt-4 divide-y divide-line rounded-xl border border-line text-[15px]">
                  <Row k={b.base} v={formatINR(q.baseFare)} />
                  {q.distanceCharge > 0 && <Row k={`${b.distanceCharge} (${q.billableKm} ${d.common.km})`} v={formatINR(q.distanceCharge)} />}
                  {q.minFareTopUp > 0 && <Row k={b.minTopUp} v={formatINR(q.minFareTopUp)} />}
                  {q.nightSurcharge > 0 && <Row k={b.night} v={formatINR(q.nightSurcharge)} />}
                  {q.surgeSurcharge > 0 && <Row k={b.surge} v={formatINR(q.surgeSurcharge)} />}
                  <Row k={`${b.fare} (${d.common.exclGst})`} v={formatINR(q.subtotal)} strong />
                  <Row k={fmt(b.gst, { pct: q.gstRatePct })} v={formatINR(q.gstAmount)} />
                  <div className="flex items-center justify-between bg-ink px-4 py-3 text-white"><dt className="font-display text-2xl font-extrabold uppercase">{b.total}</dt><dd className="font-display text-4xl font-extrabold text-brand">{formatINR(q.total)}</dd></div>
                </dl>
                {quote.route?.approximate && <p className="mt-2 text-xs text-muted">{b.approx}</p>}
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" size="lg" onClick={() => goto(1)}><ArrowLeft className="size-5" /> {d.common.back}</Button>
                  <Button size="lg" className="flex-1 sm:flex-none" onClick={() => done(2)}>{d.common.continue} <ArrowRight className="size-5" /></Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* STEP 3 — confirm */}
        {step === 3 && (
          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="text-4xl font-extrabold uppercase">{b.s4Title}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={b.contactName} required><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} /></Field>
              <Field label={b.contactPhone} required>
                <Input value={phone} onChange={(e) => { setPhone(e.target.value); if (!p.user) setAuthed(false); }} type="tel" inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" readOnly={authed && Boolean(p.user?.phone)} />
              </Field>
              <Field label={b.contactEmail} className="sm:col-span-2"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" /></Field>
              <Field label={b.vehicleNumber}><Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="DL 1C AB 1234" maxLength={20} /></Field>
              <Field label={b.vehicleDetails}><Input value={vehicleDetails} onChange={(e) => setVehicleDetails(e.target.value)} placeholder="Swift, white" maxLength={160} /></Field>
              <Field label={b.notes} className="sm:col-span-2"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className="min-h-20" /></Field>
            </div>

            {p.allowScheduling && (
              <fieldset>
                <legend className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted">{b.when}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["now", "later"] as const).map((w) => (
                    <label key={w} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 font-bold", when === w ? "border-ink bg-brand" : "border-line")}>
                      <input type="radio" name="when" checked={when === w} onChange={() => setWhen(w)} className="accent-black" />
                      {w === "now" ? <><Clock className="size-4" /> {b.now}</> : b.later}
                    </label>
                  ))}
                </div>
                {when === "later" && <Input type="datetime-local" min={minSchedule} value={scheduled} onChange={(e) => setScheduled(e.target.value)} className="mt-2" aria-label={b.later} />}
              </fieldset>
            )}

            <fieldset>
              <legend className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted">{b.payment}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3", method === "CASH" ? "border-ink bg-brand" : "border-line", !p.pay.cash && "pointer-events-none opacity-50")}>
                  <input type="radio" name="pay" checked={method === "CASH"} onChange={() => setMethod("CASH")} disabled={!p.pay.cash} className="mt-1 accent-black" />
                  <span><b className="flex items-center gap-1.5"><Wallet className="size-4" /> {b.payCash}</b><span className="text-sm text-ink/70">{b.payCashSub}</span></span>
                </label>
                <label className={cn("flex items-start gap-3 rounded-xl border-2 p-3", p.pay.razorpayEnabled ? "cursor-pointer" : "cursor-not-allowed border-dashed bg-ink-soft", method === "RAZORPAY" && p.pay.razorpayEnabled ? "border-ink bg-brand" : "border-line")} onClick={() => { if (!p.pay.razorpayEnabled) trackClient("razorpay_interest_clicked"); }}>
                  <input type="radio" name="pay" checked={method === "RAZORPAY"} onChange={() => setMethod("RAZORPAY")} disabled={!p.pay.razorpayEnabled} className="mt-1 accent-black" />
                  <span><b className="flex flex-wrap items-center gap-1.5"><CreditCard className="size-4" /> {b.payOnline} {!p.pay.razorpayEnabled && <Badge tone="warn">{d.common.comingSoon}</Badge>}</b><span className="text-sm text-ink/70">{b.payOnlineSub}</span></span>
                </label>
              </div>
            </fieldset>

            {!authed && (
              <div className="rounded-xl border-2 border-dashed border-ink/30 bg-brand-faint p-4">
                <p className="flex items-center gap-2 font-extrabold"><Lock className="size-4" /> {b.verifyPhone}</p>
                <p className="mb-3 text-sm text-muted">{b.verifyPhoneSub}</p>
                {!showOtp ? (
                  <Button variant="dark" disabled={!phoneOk} onClick={() => setShowOtp(true)}>{b.verifyPhone}</Button>
                ) : (
                  <OtpLogin locale={locale} d={d.auth} identifier={phone} askName={false} onVerified={() => { setAuthed(true); setShowOtp(false); router.refresh(); }} />
                )}
              </div>
            )}
            {authed && !p.user && <Alert tone="ok"><span className="inline-flex items-center gap-1.5 font-bold"><Check className="size-4" /> {b.verified}</span></Alert>}

            {error && <Alert tone="danger">{error}</Alert>}
            <p className="text-xs text-muted">{b.agree}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="lg" onClick={() => goto(2)}><ArrowLeft className="size-5" /> {d.common.back}</Button>
              <Button size="lg" className="flex-1" loading={submitting} disabled={!step3ok || !authed} onClick={submit}>{submitting ? b.confirming : <>{b.confirm}{q ? ` · ${formatINR(q.total)}` : ""}</>}</Button>
            </div>
          </Card>
        )}
      </div>

      {/* Right rail: map + summary */}
      <aside className="hidden lg:block">
        <div className="sticky top-28 space-y-4">
          <Map className="h-[360px] w-full rounded-2xl border border-line shadow-card" center={[p.map.lat, p.map.lng]} zoom={p.map.zoom} tileUrl={p.map.tileUrl} markers={markers} route={route} onMapClick={step === 1 ? onMapClick : undefined} fitKey={`${markers.map((m) => m.id + m.lat + m.lng).join()}|${route?.length ?? 0}`} />
          <Card className="p-4 text-sm">
            <Summary icon={vehicle?.icon} label={b.vehicle} value={vehicle?.name} />
            <Summary icon={service?.icon} label={b.service} value={service?.name} />
            <Summary label={b.pickup} value={pickup?.address} />
            {needsDrop && <Summary label={b.drop} value={drop?.address} />}
            {q && <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3"><span className="font-bold uppercase">{b.total}</span><span className="font-display text-3xl font-extrabold">{formatINR(q.total)}</span></div>}
          </Card>
        </div>
      </aside>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-2.5", strong && "bg-brand-faint font-bold")}>
      <dt>{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}

function Summary({ icon, label, value }: { icon?: string; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      {icon ? <Icon name={icon} className="mt-0.5 size-4 shrink-0" /> : <span className="size-4 shrink-0" />}
      <span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wider text-muted">{label}</span><span className="block truncate font-semibold">{value || "—"}</span></span>
    </div>
  );
}
