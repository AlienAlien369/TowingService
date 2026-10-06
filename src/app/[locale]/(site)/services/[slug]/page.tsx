import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Check, Clock } from "lucide-react";
import { toJsonLd } from "@/shared/lib/jsonld";
import { loadLocale } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { getBrand } from "@/modules/settings/service";
import { getRateCards, getServiceBySlug, getServices, getVehicleTypes } from "@/modules/catalog/service";
import { Badge, Card, Container, LinkButton, PageHero } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await loadLocale(params);
  const s = await getServiceBySlug(slug);
  if (!s) return {};
  return { title: L(s.name, locale), description: L(s.shortDescription, locale), alternates: { canonical: `/${locale}/services/${slug}` } };
}

export default async function ServiceDetail({ params }: Props) {
  const { slug } = await params;
  const { locale, d, p } = await loadLocale(params);
  const [service, services, vehicles, rates, brand] = await Promise.all([getServiceBySlug(slug), getServices(), getVehicleTypes(), getRateCards(), getBrand()]);
  if (!service) notFound();
  const rows = vehicles
    .map((v) => ({ v, r: rates.find((r) => r.serviceId === service.id && r.vehicleTypeId === v.id) }))
    .filter((x) => x.r);
  const others = services.filter((s) => s.id !== service.id).slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: L(service.name, "en"),
    description: L(service.description, "en"),
    provider: { "@type": "LocalBusiness", name: brand.brandName, telephone: brand.emergencyPhone, areaServed: "Delhi" },
    areaServed: { "@type": "City", name: "Delhi" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
      <PageHero title={L(service.name, locale)} subtitle={L(service.shortDescription, locale)} eyebrow={<span className="inline-flex items-center gap-2"><Icon name={service.icon} className="size-4" /> {d.nav.services}</span>}>
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href={p(`/book?service=${service.slug}`)} size="lg">{d.services.bookService} <ArrowRight className="size-5" /></LinkButton>
          <Badge tone="brand" className="!px-3 !py-1.5 text-sm"><Clock className="size-4" /> {d.services.eta}: ~{service.etaMinutes} {d.common.min}</Badge>
        </div>
      </PageHero>
      <Container className="grid gap-8 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="max-w-3xl text-lg leading-relaxed">{L(service.description, locale)}</p>
          {!service.requiresDrop && <Badge tone="info" className="mt-4">{d.services.onSpot}</Badge>}
          <h2 className="mb-3 mt-10 text-3xl font-extrabold uppercase">{d.services.whatsIncluded}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {d.services.included.map((i) => (
              <li key={i} className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 font-semibold"><Check className="size-5 text-ok" /> {i}</li>
            ))}
          </ul>
          <h2 className="mb-3 mt-10 text-3xl font-extrabold uppercase">{d.services.pricingFor}</h2>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {rows.map(({ v, r }) => (
              <Link key={v.id} href={p(`/book?service=${service.slug}&vehicle=${v.slug}`)} className="flex items-center justify-between gap-4 p-4 transition hover:bg-brand-faint">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-brand"><Icon name={v.icon} className="size-5" /></span>
                  <span className="font-bold">{L(v.name, locale)}</span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-2xl font-extrabold leading-none">{formatINR(r!.minFare)}</span>
                  <span className="text-xs text-muted">{d.common.exclGst}{service.requiresDrop && r!.perKm ? ` · +${formatINR(r!.perKm)}/${d.common.km} after ${r!.includedKm} ${d.common.km}` : ""}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <Card className="bg-brand p-5">
            <p className="font-display text-3xl font-extrabold uppercase leading-none">{d.home.finalTitle}</p>
            <p className="mt-1 text-ink/80">{d.home.finalSub}</p>
            <LinkButton href={p(`/book?service=${service.slug}`)} variant="dark" className="mt-4 w-full">{d.nav.book}</LinkButton>
          </Card>
          <Card className="p-5">
            <p className="mb-2 text-sm font-extrabold uppercase tracking-wider text-muted">{d.services.otherServices}</p>
            {others.map((o) => (
              <Link key={o.id} href={p(`/services/${o.slug}`)} className="flex items-center gap-3 rounded-lg p-2 font-bold hover:bg-brand-faint">
                <Icon name={o.icon} className="size-5" /> {L(o.name, locale)}
              </Link>
            ))}
          </Card>
        </aside>
      </Container>
    </>
  );
}
