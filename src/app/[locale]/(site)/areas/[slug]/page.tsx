import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { toJsonLd } from "@/shared/lib/jsonld";
import { loadLocale } from "@/shared/lib/page";
import { L, fmt } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { getBrand } from "@/modules/settings/service";
import { getAreaBySlug, getAreas } from "@/modules/content/service";
import { getServices, getStartingPrices } from "@/modules/catalog/service";
import { Badge, Card, Container, LinkButton, PageHero } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import { LeadForm } from "@/shared/client/lead-form";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale, d } = await loadLocale(params);
  const a = await getAreaBySlug(slug);
  if (!a) return {};
  const name = L(a.name, locale);
  return { title: fmt(d.areas.pageTitle, { area: name }), description: L(a.description, locale), alternates: { canonical: `/${locale}/areas/${slug}` } };
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  const { locale, d, p } = await loadLocale(params);
  const [area, areas, services, prices, brand] = await Promise.all([getAreaBySlug(slug), getAreas(), getServices(), getStartingPrices(), getBrand()]);
  if (!area) notFound();
  const name = L(area.name, locale);
  const soon = area.status === "COMING_SOON";
  const nearby = areas.filter((a) => a.id !== area.id && a.status === area.status).slice(0, 6);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoTowing",
    name: `${brand.brandName} – ${L(area.name, "en")}`,
    telephone: brand.emergencyPhone,
    areaServed: { "@type": "Place", name: L(area.name, "en") },
    openingHours: "Mo-Su 00:00-23:59",
    geo: { "@type": "GeoCoordinates", latitude: area.lat, longitude: area.lng },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
      <PageHero eyebrow={area.city} title={fmt(d.areas.pageTitle, { area: name })} subtitle={fmt(d.areas.pageSub, { area: name, city: area.city })}>
        {soon ? <Badge tone="brand" className="!px-3 !py-1.5 text-sm">{d.common.comingSoon}</Badge> : <LinkButton href={p("/book")} size="lg">{fmt(d.areas.bookIn, { area: name })} <ArrowRight className="size-5" /></LinkButton>}
      </PageHero>
      <Container className="grid gap-8 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="max-w-3xl text-lg leading-relaxed">{L(area.description, locale)}</p>
          {soon ? (
            <Card className="mt-8 max-w-xl p-6">
              <h2 className="text-3xl font-extrabold uppercase">{d.areas.notifyMe}</h2>
              <p className="mb-4 mt-1 text-muted">{fmt(d.areas.ctaSoon, { area: name })}</p>
              <LeadForm kind="COMING_SOON_AREA" meta={{ area: area.slug }} withEmail labels={{ name: d.common.name, phone: d.common.phone, email: d.common.email, message: d.common.message, submit: d.areas.notifyMe, sent: d.common.sent }} />
            </Card>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
                <Badge tone="ok" className="!px-3 !py-1.5"><Clock className="size-4" /> {d.common.open247}</Badge>
                <Badge tone="info" className="!px-3 !py-1.5"><ShieldCheck className="size-4" /> {d.home.chips[0]}</Badge>
              </div>
              <h2 className="mb-3 mt-10 text-3xl font-extrabold uppercase">{d.nav.services}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {services.slice(0, 6).map((s) => (
                  <Link key={s.id} href={p(`/services/${s.slug}`)} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition hover:border-ink">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink text-brand"><Icon name={s.icon} className="size-5" /></span>
                    <span className="flex-1 font-bold leading-tight">{L(s.name, locale)}</span>
                    {prices[s.id] && <span className="text-sm font-bold">{formatINR(prices[s.id])}+</span>}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
        <aside>
          <Card className="p-5">
            <p className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted">{d.areas.nearby}</p>
            {nearby.map((a) => (
              <Link key={a.id} href={p(`/areas/${a.slug}`)} className="block rounded-lg p-2 font-bold hover:bg-brand-faint">{L(a.name, locale)}</Link>
            ))}
            <Link href={p("/areas")} className="mt-2 block p-2 text-sm font-bold underline">{d.areas.otherAreas}</Link>
          </Card>
        </aside>
      </Container>
    </>
  );
}
