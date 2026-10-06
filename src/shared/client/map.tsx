"use client";

import dynamic from "next/dynamic";

/** Leaflet touches `window`, so it is client-only. */
export const Map = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => <div className="grid h-72 w-full animate-pulse place-items-center rounded-2xl bg-ink-soft text-sm font-semibold text-muted">Loading map…</div>,
});
export type { MapMarker } from "./map-view";
