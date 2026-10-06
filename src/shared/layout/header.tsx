import Link from "next/link";
import { Phone, User } from "lucide-react";
import type { Locale } from "@/shared/lib/localized";
import { getDict } from "@/i18n";
import { getBrand } from "@/modules/settings/service";
import { getCurrentUser } from "@/modules/auth/session";
import { homeForRole } from "@/modules/auth/routing";
import { Logo } from "@/shared/ui/logo";
import { buttonClass } from "@/shared/ui";
import { TrackedLink } from "@/shared/client/track";
import { LangSwitch, MobileMenu } from "./header-client";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const [brand, user] = await Promise.all([getBrand(), getCurrentUser()]);
  const d = getDict(locale);
  const p = (path: string) => `/${locale}${path}`;
  const tel = brand.emergencyPhone.replace(/[^\d+]/g, "");
  const links = [
    { href: p("/services"), label: d.nav.services },
    { href: p("/pricing"), label: d.nav.pricing },
    { href: p("/areas"), label: d.nav.coverage },
    { href: p("/partner"), label: d.nav.partner },
    { href: p("/about"), label: d.nav.about },
    { href: p("/contact"), label: d.nav.contact },
  ];
  const accountHref = user ? homeForRole(user.role, locale) : p("/login");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white">
      <div className="hidden bg-brand text-ink sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-[13px] font-bold lg:px-8">
          <span>{d.common.emergency} · {brand.hours}</span>
          <TrackedLink event="cta_call_click" props={{ where: "topbar" }} href={`tel:${tel}`} className="inline-flex items-center gap-1.5 hover:underline">
            <Phone className="size-3.5" /> {brand.emergencyPhone}
          </TrackedLink>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo name={brand.brandName} logoUrl={brand.logoUrl || undefined} href={p("")} light />
        <nav className="ml-6 hidden items-center gap-1 xl:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-[15px] font-semibold text-white/85 transition hover:bg-white/10 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LangSwitch locale={locale} label={d.nav.language} />
          <Link href={accountHref} className="hidden items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 md:inline-flex">
            <User className="size-4" /> {user ? d.nav.account : d.nav.login}
          </Link>
          <div className="hidden sm:block">
            <Link href={p("/book")} className={buttonClass("primary", "md")}>
              {d.nav.book}
            </Link>
          </div>
          <MobileMenu
            links={[...links, { href: p("/track"), label: d.nav.track }, { href: p("/faq"), label: d.nav.faq }, { href: accountHref, label: user ? d.nav.account : d.nav.login }]}
            bookHref={p("/book")}
            bookLabel={d.nav.book}
            menuLabel={d.nav.menu}
            closeLabel={d.nav.close}
            phone={brand.emergencyPhone}
            tel={tel}
          />
        </div>
      </div>
    </header>
  );
}
