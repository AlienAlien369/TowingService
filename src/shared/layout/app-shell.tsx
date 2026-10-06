import Link from "next/link";
import { LogOut, Globe } from "lucide-react";
import type { ReactNode } from "react";
import { getBrand } from "@/modules/settings/service";
import { logoutAction } from "@/modules/auth/actions";
import { Logo } from "@/shared/ui/logo";
import { Badge } from "@/shared/ui";
import { SideNav, TopTabs, type NavItem } from "./nav-links";

/** Chrome shared by the admin, driver and partner portals: charcoal sidebar on desktop, scrollable tabs on mobile. */
export async function AppShell({ locale, title, roleLabel, userLabel, nav, children }: { locale: string; title: string; roleLabel: string; userLabel: string; nav: NavItem[]; children: ReactNode }) {
  const brand = await getBrand();
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden bg-ink p-4 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto">
        <Logo name={brand.brandName} logoUrl={brand.logoUrl || undefined} href={`/${locale}`} light />
        <div className="hazard my-4 h-1.5 rounded-full" aria-hidden />
        <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-[0.14em] text-white/50">{title}</p>
        <SideNav items={nav} />
        <div className="mt-auto space-y-2 border-t border-white/10 pt-4 text-sm">
          <p className="truncate font-semibold text-white/85">{userLabel}</p>
          <Badge tone="brand">{roleLabel}</Badge>
          <div className="flex gap-2 pt-1">
            <Link href={`/${locale}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 px-2 py-2 font-bold hover:bg-white/10"><Globe className="size-4" /> Site</Link>
            <form action={logoutAction.bind(null, locale)} className="flex-1">
              <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/20 px-2 py-2 font-bold hover:bg-white/10"><LogOut className="size-4" /> Sign out</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="bg-ink px-4 pb-1 pt-3 text-white lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <Logo name={brand.brandName} logoUrl={brand.logoUrl || undefined} href={`/${locale}`} light />
            <form action={logoutAction.bind(null, locale)}><button aria-label="Sign out" className="grid size-10 place-items-center rounded-lg border border-white/20"><LogOut className="size-4" /></button></form>
          </div>
          <TopTabs items={nav} />
        </header>
        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-5xl font-extrabold uppercase leading-none">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {actions}
    </div>
  );
}
