import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { L, type Locale } from "@/shared/lib/localized";
import { getDict } from "@/i18n";
import { getBrand } from "@/modules/settings/service";
import { getServices } from "@/modules/catalog/service";
import { listLegalPages } from "@/modules/content/service";
import { Logo } from "@/shared/ui/logo";
import { Container } from "@/shared/ui";
import { TrackedLink } from "@/shared/client/track";

export async function SiteFooter({ locale }: { locale: Locale }) {
  const [brand, services, legal] = await Promise.all([getBrand(), getServices(), listLegalPages()]);
  const d = getDict(locale);
  const p = (path: string) => `/${locale}${path}`;
  const tel = brand.emergencyPhone.replace(/[^\d+]/g, "");
  const tagline = L(brand.tagline, locale);
  const social = [
    ["Facebook", brand.facebook],
    ["Instagram", brand.instagram],
    ["X", brand.x],
    ["YouTube", brand.youtube],
    ["LinkedIn", brand.linkedin],
  ].filter(([, v]) => v);
  const col = "mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-brand";
  const link = "block py-1 text-white/75 transition hover:text-white";

  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="hazard h-2" aria-hidden />
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] [&>div]:min-w-0">
        <div>
          <Logo name={brand.brandName} logoUrl={brand.logoUrl || undefined} href={p("")} light />
          <p className="mt-4 max-w-sm text-white/70">{tagline}</p>
          <TrackedLink event="cta_call_click" props={{ where: "footer" }} href={`tel:${tel}`} className="mt-5 inline-flex items-center gap-3 rounded-xl bg-brand px-4 py-3 text-ink">
            <Phone className="size-5" />
            <span>
              <span className="block text-xs font-bold uppercase tracking-wider">{d.footer.emergencyLine}</span>
              <span className="font-display text-2xl font-extrabold leading-none">{brand.emergencyPhone}</span>
            </span>
          </TrackedLink>
          {social.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {social.map(([name, url]) => (
                <li key={name}>
                  <a href={url} rel="noopener noreferrer" target="_blank" className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/10">{name}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className={col}>{d.nav.services}</h3>
          {services.slice(0, 8).map((s) => (
            <Link key={s.id} href={p(`/services/${s.slug}`)} className={link}>{L(s.name, locale)}</Link>
          ))}
        </div>
        <div>
          <h3 className={col}>{d.footer.company}</h3>
          <Link href={p("/about")} className={link}>{d.nav.about}</Link>
          <Link href={p("/pricing")} className={link}>{d.nav.pricing}</Link>
          <Link href={p("/areas")} className={link}>{d.nav.coverage}</Link>
          <Link href={p("/track")} className={link}>{d.nav.track}</Link>
          <Link href={p("/faq")} className={link}>{d.nav.faq}</Link>
          <Link href={p("/contact")} className={link}>{d.nav.contact}</Link>
          <h3 className={`${col} mt-6`}>{d.footer.partnerLinks}</h3>
          <Link href={p("/partner")} className={link}>{d.nav.partner}</Link>
          <Link href={p("/legal/partner-agreement")} className={link}>{d.partner.agreement}</Link>
        </div>
        <div>
          <h3 className={col}>{d.footer.legal}</h3>
          {legal.filter((pg) => pg.slug !== "partner-agreement").map((pg) => (
            <Link key={pg.id} href={p(`/legal/${pg.slug}`)} className={link}>{L(pg.title, locale)}</Link>
          ))}
          <h3 className={`${col} mt-6`}>{d.contact.office}</h3>
          <p className="flex gap-2 py-1 text-sm text-white/75"><MapPin className="mt-0.5 size-4 shrink-0" />{brand.addressLine}, {brand.city} {brand.pincode}</p>
          <a href={`mailto:${brand.email}`} className="flex gap-2 py-1 text-sm text-white/75 hover:text-white"><Mail className="mt-0.5 size-4 shrink-0" />{brand.email}</a>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 pb-24 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
          <p>© {new Date().getFullYear()} {brand.legalName || brand.brandName}. {d.common.rights}</p>
          <p>{d.footer.made}</p>
        </Container>
      </div>
    </footer>
  );
}
