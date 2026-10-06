"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import en from "@/i18n/en";
import hi from "@/i18n/hi";

export default function NotFound() {
  const locale = usePathname().startsWith("/hi") ? "hi" : "en";
  const d = (locale === "hi" ? hi : en).errors;
  return (
    <main className="grid min-h-dvh place-items-center bg-ink p-6 text-center text-white">
      <div>
        <p className="font-display text-[8rem] font-extrabold leading-none text-brand sm:text-[12rem]">404</p>
        <div className="hazard mx-auto my-4 h-2 w-40 rounded-full" aria-hidden />
        <h1 className="text-5xl font-extrabold uppercase">{d.notFoundTitle}</h1>
        <p className="mx-auto mt-2 max-w-md text-white/70">{d.notFoundBody}</p>
        <Link href={`/${locale}`} className="mt-6 inline-flex h-12 items-center rounded-xl bg-brand px-6 font-bold text-ink">{d.goHome}</Link>
      </div>
    </main>
  );
}
