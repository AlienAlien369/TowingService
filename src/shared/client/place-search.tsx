"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, X } from "lucide-react";
import { Input } from "@/shared/ui";

export type PickedPlace = { address: string; lat: number; lng: number };

/** Debounced address search (OSM/Google behind /api/geo) with an optional "use my location" action. */
export function PlaceSearch({ value, onPick, placeholder, withLocate, locateLabel, locatingLabel, label, id }: {
  value: PickedPlace | null;
  onPick: (p: PickedPlace | null) => void;
  placeholder: string;
  withLocate?: boolean;
  locateLabel?: string;
  locatingLabel?: string;
  label: string;
  id: string;
}) {
  const [q, setQ] = useState(value?.address ?? "");
  const [results, setResults] = useState<PickedPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skip = useRef(false);

  // keep the box in sync when the parent changes the value (map click, geolocation)
  useEffect(() => {
    skip.current = true;
    setQ(value?.address ?? "");
  }, [value?.address]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`);
        const j = (await r.json()) as { results: { label: string; lat: number; lng: number }[] };
        setResults(j.results.map((x) => ({ address: x.label, lat: x.lat, lng: x.lng })));
        setOpen(true);
        setMsg(j.results.length ? null : "No matches — try a landmark or tap the map.");
      } catch {
        setMsg("Search unavailable — tap the map to drop a pin.");
      } finally {
        setBusy(false);
      }
    }, 450);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  function locate() {
    if (!navigator.geolocation) return setMsg("Location isn't supported on this device.");
    setLocating(true);
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const r = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
          const j = (await r.json()) as { label: string };
          onPick({ address: j.label, lat, lng });
        } catch {
          onPick({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
        setMsg("Couldn't get your location. Allow location access or search below.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <Input id={id} value={q} onChange={(e) => { setQ(e.target.value); if (value) onPick(null); }} onFocus={() => results.length && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder={placeholder} className="pl-11 pr-10" autoComplete="off" role="combobox" aria-expanded={open} aria-controls={`${id}-list`} />
        {q && (
          <button type="button" aria-label="Clear" onClick={() => { setQ(""); setResults([]); onPick(null); }} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-ink-soft">
            <X className="size-4" />
          </button>
        )}
      </div>
      {withLocate && (
        <button type="button" onClick={locate} disabled={locating} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold underline-offset-2 hover:underline disabled:opacity-60">
          <LocateFixed className={locating ? "size-4 animate-pulse" : "size-4"} /> {locating ? locatingLabel : locateLabel}
        </button>
      )}
      {busy && <p className="mt-1 text-xs text-muted" role="status">…</p>}
      {msg && !open && <p className="mt-1 text-xs text-muted" role="status">{msg}</p>}
      {open && results.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface shadow-lift">
          {results.map((r, i) => (
            <li key={i} role="option" aria-selected={false}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(r); setOpen(false); }} className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-brand-faint">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
                <span>{r.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
