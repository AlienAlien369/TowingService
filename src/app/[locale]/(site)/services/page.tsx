import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { getServices, getStartingPrices } from "@/modules/catalog/service";
import { Card, Container, PageHero, Badge } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.services.title, description: d.services.sub };
}

export default async function ServicesPage({ params }: LocaleParams) {
  const { locale, d, p } = await loadLocale(params);
  const [services, prices] = await Promise.all([getServices(), getStartingPrices()]);
  return (
    <>
      <PageHero title={d.services.title} subtitle={d.services.sub} />
      <Container className="grid gap-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Link key={s.id} href={p(`/services/${s.slug}`)} className="group">
            <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-1 group-hover:shadow-lift">
              <div className="flex items-start justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-ink text-brand"><Icon name={s.icon} className="size-7" /></span>
                {!s.requiresDrop && <Badge tone="info">{locale === "hi" ? "मौके पर" : "On-spot"}</Badge>}
              </div>
              <h2 className="mt-4 text-3xl font-extrabold uppercase leading-none">{L(s.name, locale)}</h2>
              <p className="mt-2 flex-1 text-muted">{L(s.shortDescription, locale)}</p>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="font-bold">{prices[s.id] ? <>{d.services.from} {formatINR(prices[s.id])}</> : null}</span>
                <span className="inline-flex items-center gap-1 font-bold group-hover:gap-2">{d.common.learnMore} <ArrowRight className="size-4" /></span>
              </div>
            </Card>
          </Link>
        ))}
      </Container>
    </>
  );
}
