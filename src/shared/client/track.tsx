"use client";

import type { ComponentProps } from "react";

export function trackClient(name: string, props?: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ name, props, path: location.pathname });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/event", new Blob([body], { type: "application/json" }));
    else void fetch("/api/event", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  } catch {
    /* never break the UI for analytics */
  }
}

/** <a> that reports a click event (call / WhatsApp CTAs) before following the link. */
export function TrackedLink({ event, props, onClick, ...rest }: ComponentProps<"a"> & { event: string; props?: Record<string, unknown> }) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        trackClient(event, props);
        onClick?.(e);
      }}
    />
  );
}
