"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, MapPinned, Navigation, Phone, Power, Radio, Wallet, X } from "lucide-react";
import type { DriverState } from "@/modules/dispatch/driver-state";
import { acceptOfferAction, declineOfferAction, driverAdvanceAction, toggleOnlineAction } from "@/modules/providers/actions";
import { Alert, Badge, Button, Card, Input, Select } from "@/shared/ui";
import { cn, formatINR } from "@/shared/lib/utils";
import { DRIVER_NEXT } from "@/modules/bookings/state";
import { Map, type MapMarker } from "./map";

const DEMO_SPOTS: Record<string, [number, number]> = {
  "Connaught Place": [28.6315, 77.2167],
  Saket: [28.5355, 77.21],
  Dwarka: [28.58, 77.05],
  Rohini: [28.73, 77.11],
  "Lajpat Nagar": [28.5677, 77.2433],
  "Noida border": [28.5801, 77.3207],
};

export function DriverConsole({ initial, tileUrl, demoTools, center }: { initial: DriverState; tileUrl: string; demoTools: boolean; center: [number, number] }) {
  const [state, setState] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [geo, setGeo] = useState<"idle" | "ok" | "denied">("idle");
  const [pin, setPin] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const watchId = useRef<number | null>(null);
  const lastSent = useRef(0);
  const online = state.driver.isOnline;
  const knownOffers = useRef(new Set(initial.offers.map((o) => o.id)));
  const active = state.driver.status === "ACTIVE";

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/driver/state", { cache: "no-store" });
      if (r.ok) {
        const s = (await r.json()) as DriverState;
        // buzz the phone when a fresh offer arrives
        if (s.offers.some((o) => !knownOffers.current.has(o.id))) {
          navigator.vibrate?.([200, 100, 200, 100, 400]);
          s.offers.forEach((o) => knownOffers.current.add(o.id));
        }
        setState(s);
      }
    } catch {
      /* offline – keep last state */
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const send = useCallback(async (lat: number, lng: number) => {
    if (Date.now() - lastSent.current < 8000) return;
    lastSent.current = Date.now();
    await fetch("/api/driver/location", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lat, lng }) }).catch(() => {});
  }, []);

  // Share live GPS while online.
  useEffect(() => {
    if (!online) return;
    if (!navigator.geolocation) return setGeo("denied");
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setGeo("ok");
        void send(p.coords.latitude, p.coords.longitude);
      },
      () => setGeo("denied"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [online, send]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Failed");
      await refresh();
    });

  const job = state.job;
  const next = job ? DRIVER_NEXT[job.status as keyof typeof DRIVER_NEXT] : undefined;
  const target = job ? (["ASSIGNED", "EN_ROUTE", "ARRIVED"].includes(job.status) ? { lat: job.pickupLat, lng: job.pickupLng, label: "pickup" } : job.dropLat != null ? { lat: job.dropLat, lng: job.dropLng!, label: "drop" } : null) : null;

  const markers: MapMarker[] = [];
  if (state.driver.lat != null && state.driver.lng != null) markers.push({ id: "me", lat: state.driver.lat, lng: state.driver.lng, kind: "me" });
  if (job) {
    markers.push({ id: "pickup", lat: job.pickupLat, lng: job.pickupLng, kind: "pickup" });
    if (job.dropLat != null) markers.push({ id: "drop", lat: job.dropLat, lng: job.dropLng!, kind: "drop" });
  } else state.offers.forEach((o) => markers.push({ id: o.id, lat: o.pickupLat, lng: o.pickupLng, kind: "job" }));

  return (
    <div className="space-y-4">
      {/* Online switch */}
      <Card className={cn("flex items-center justify-between gap-4 p-4", online ? "border-ok" : "")}>
        <div className="flex items-center gap-3">
          <span className={cn("relative grid size-12 place-items-center rounded-full", online ? "bg-ok text-white" : "bg-ink-soft text-muted")}><Power className="size-6" /></span>
          <div>
            <p className="font-display text-3xl font-extrabold uppercase leading-none">{online ? "You're online" : "You're offline"}</p>
            <p className="text-sm text-muted">{online ? (geo === "denied" ? "Location blocked — allow GPS to get jobs" : "Sharing live location · receiving jobs") : "Go online to receive job offers"}</p>
          </div>
        </div>
        <Button variant={online ? "outline" : "primary"} size="lg" disabled={!active || (!!job && online)} loading={pending} onClick={() => run(async () => { const r = await toggleOnlineAction(!online); return r; })}>
          {online ? "Go offline" : "Go online"}
        </Button>
      </Card>
      {error && <Alert tone="danger">{error}</Alert>}
      {geo === "denied" && online && <Alert tone="warn">Location permission is blocked. Enable it in your browser settings so customers can see you and nearby jobs reach you.</Alert>}

      {/* Active job */}
      {job && (
        <Card className="overflow-hidden border-2 border-ink">
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-white">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">Active job</p>
              <p className="font-mono text-lg font-bold tracking-wider">{job.code}</p>
            </div>
            <Badge tone="brand" className="!px-3 !py-1.5">{job.status.replace(/_/g, " ")}</Badge>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-2xl font-extrabold leading-tight">{job.service} · {job.vehicle}</p>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <Info label="Pickup" value={job.pickup} />
              {job.drop && <Info label="Drop" value={job.drop} />}
              <Info label="Customer" value={`${job.customerName}`} />
              {(job.vehicleNumber || job.vehicleDetails) && <Info label="Vehicle" value={[job.vehicleNumber, job.vehicleDetails].filter(Boolean).join(" · ")} />}
              {job.notes && <Info label="Notes" value={job.notes} />}
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${job.customerPhone}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white"><Phone className="size-4" /> Call customer</a>
              {target && <a href={`https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-ink/15 px-4 text-sm font-bold hover:border-ink"><Navigation className="size-4" /> Navigate to {target.label}</a>}
            </div>
            {job.status === "ARRIVED" && (
              <div className="rounded-xl bg-brand p-3">
                <label className="text-sm font-extrabold uppercase tracking-wider" htmlFor="pin">Ask customer for the 4-digit trip PIN</label>
                <Input id="pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" maxLength={4} placeholder="••••" className="mt-1 text-center font-mono text-3xl tracking-[0.6em]" />
              </div>
            )}
            {job.status === "IN_PROGRESS" && job.collectCash && job.paymentStatus !== "PAID" && (
              <Alert tone="warn"><span className="inline-flex items-center gap-2 text-base font-extrabold"><Wallet className="size-5" /> Collect {formatINR(job.total)} (cash / UPI) from the customer</span></Alert>
            )}
            {next && (
              <Button size="lg" className="w-full" loading={pending} disabled={job.status === "ARRIVED" && pin.length !== 4} onClick={() => run(async () => {
                const pos = state.driver.lat != null ? { lat: state.driver.lat, lng: state.driver.lng! } : undefined;
                const r = await driverAdvanceAction(job.id, pin || undefined, pos);
                if (r.ok) setPin("");
                return r;
              })}>
                <Check className="size-5" /> {next.label}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Offers */}
      {!job && online && (
        <section aria-label="Job offers" className="space-y-3">
          <h2 className="flex items-center gap-2 text-3xl font-extrabold uppercase"><Radio className="size-6 animate-pulse text-danger" /> Job offers</h2>
          {state.offers.length === 0 && <Card className="p-6 text-center text-muted">Waiting for jobs near you…</Card>}
          {state.offers.map((o) => {
            const left = Math.max(0, Math.round((new Date(o.expiresAt).getTime() - now) / 1000));
            return (
              <Card key={o.id} className="border-2 border-brand p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-extrabold leading-tight">{o.service} · {o.vehicle.split("(")[0]}</p>
                    <p className="mt-1 text-sm"><MapPinned className="mr-1 inline size-4" />{o.pickup}</p>
                    {o.drop && <p className="text-sm text-muted">→ {o.drop}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-extrabold leading-none">{formatINR(o.fare)}</p>
                    <p className="text-xs text-muted">fare excl. GST</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  <Badge>{o.distanceKm} km to pickup</Badge>
                  {o.tripKm > 0 && <Badge>{o.tripKm} km trip</Badge>}
                  <Badge tone={left < 20 ? "danger" : "warn"}>{left}s left</Badge>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <Button size="lg" loading={pending} disabled={left === 0} onClick={() => run(() => acceptOfferAction(o.id))}><Check className="size-5" /> Accept job</Button>
                  <Button size="lg" variant="outline" aria-label="Decline" disabled={pending} onClick={() => run(() => declineOfferAction(o.id))}><X className="size-5" /></Button>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {markers.length > 0 && <Map className="h-72 w-full rounded-2xl border border-line" center={center} zoom={12} tileUrl={tileUrl} markers={markers} fitKey={`${markers.map((m) => m.id).join()}|${job?.status}`} />}

      {demoTools && (
        <Card className="border-dashed p-4">
          <p className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted">Demo tools — simulate GPS</p>
          <div className="flex gap-2">
            <Select aria-label="Demo location" defaultValue="" onChange={(e) => { const c = DEMO_SPOTS[e.target.value]; if (c) { lastSent.current = 0; void send(c[0], c[1]).then(refresh); } }}>
              <option value="" disabled>Set my location to…</option>
              {Object.keys(DEMO_SPOTS).map((k) => <option key={k}>{k}</option>)}
            </Select>
          </div>
          <p className="mt-1 text-xs text-muted">Only visible when EXPOSE_DEV_OTP is on. Real GPS overrides this when allowed.</p>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-soft p-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
