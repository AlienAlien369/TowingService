"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import en from "@/i18n/en";
import hi from "@/i18n/hi";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = usePathname().startsWith("/hi") ? "hi" : "en";
  const d = (locale === "hi" ? hi : en).errors;
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center bg-ink p-6 text-center text-white">
      <div>
        <div className="hazard mx-auto mb-4 h-2 w-40 rounded-full" aria-hidden />
        <h1 className="text-5xl font-extrabold uppercase">{d.errorTitle}</h1>
        <p className="mx-auto mt-2 max-w-md text-white/70">{d.errorBody}</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-white/40">ref: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="h-12 rounded-xl bg-brand px-6 font-bold text-ink">{d.retry}</button>
          <a href={`/${locale}`} className="inline-flex h-12 items-center rounded-xl border border-white/30 px-6 font-bold">{d.goHome}</a>
        </div>
      </div>
    </main>
  );
}
