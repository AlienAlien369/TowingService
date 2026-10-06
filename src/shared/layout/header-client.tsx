"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Languages, Menu, Phone, X } from "lucide-react";
import { buttonClass } from "@/shared/ui";
import { trackClient } from "@/shared/client/track";

export function LangSwitch({ locale, label }: { locale: "en" | "hi"; label: string }) {
  const pathname = usePathname();
  const other = locale === "en" ? "hi" : "en";
  const href = pathname.replace(/^\/(en|hi)(?=\/|$)/, `/${other}`) || `/${other}`;
  return (
    <Link
      href={href}
      hrefLang={other}
      onClick={() => {
        document.cookie = `rs_locale=${other}; path=/; max-age=31536000; samesite=lax`;
        trackClient("language_changed", { to: other });
      }}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 px-2.5 text-sm font-bold text-white hover:bg-white/10"
    >
      <Languages className="size-4" aria-hidden /> {label}
    </Link>
  );
}

export function MobileMenu({ links, bookHref, bookLabel, menuLabel, closeLabel, phone, tel }: { links: { href: string; label: string }[]; bookHref: string; bookLabel: string; menuLabel: string; closeLabel: string; phone: string; tel: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button type="button" onClick={() => setOpen(true)} aria-label={menuLabel} aria-expanded={open} className="grid size-10 place-items-center rounded-lg border border-white/20 text-white hover:bg-white/10">
        <Menu className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink" role="dialog" aria-modal="true" aria-label={menuLabel}>
          <div className="flex h-16 items-center justify-between px-4">
            <span className="font-display text-2xl font-extrabold uppercase tracking-wide text-brand">{menuLabel}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label={closeLabel} className="grid size-10 place-items-center rounded-lg border border-white/20 text-white">
              <X className="size-5" />
            </button>
          </div>
          <div className="hazard h-1.5" aria-hidden />
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            {links.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="block border-b border-white/10 py-4 font-display text-3xl font-extrabold uppercase tracking-wide text-white hover:text-brand">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="grid gap-3 p-4">
            <Link href={bookHref} className={buttonClass("primary", "lg", "w-full")}>{bookLabel}</Link>
            <a href={`tel:${tel}`} onClick={() => trackClient("cta_call_click", { where: "mobile-menu" })} className={buttonClass("light", "lg", "w-full")}>
              <Phone className="size-5" /> {phone}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
