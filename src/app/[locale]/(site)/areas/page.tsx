import Link from "next/link";
import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { getAreas } from "@/modules/content/service";
import { Badge, Card, Container, PageHero, SectionHeading } from "@/shared/ui";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.areas.title, description: d.areas.sub };
}

export default async function AreasPage({ params }: LocaleParams) {
  const { locale, d, p } = await loadLocale(params);
  const areas = await getAreas();
  const live = areas.filter((a) => a.status === "ACTIVE");
  const soon = areas.filter((a) => a.status === "COMING_SOON");
  return (
    <>
      <PageHero title={d.areas.title} subtitle={d.areas.sub} />
      <Container className="py-12">
        <SectionHeading title={d.areas.active} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((a) => (
            <Link key={a.id} href={p(`/areas/${a.slug}`)} className="group">
              <Card className="flex h-full items-start gap-3 p-4 transition group-hover:-translate-y-0.5 group-hover:border-ink">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand"><MapPin className="size-5" /></span>
                <span>
                  <span className="block text-lg font-extrabold leading-tight">{L(a.name, locale)}</span>
                  {a.pincodes && <span className="text-xs font-semibold text-muted">PIN {a.pincodes}</span>}
                </span>
              </Card>
            </Link>
          ))}
        </div>
        {soon.length > 0 && (
          <>
            <div className="mt-12"><SectionHeading title={d.areas.soon} subtitle={d.home.coverageSub} /></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {soon.map((a) => (
                <Link key={a.id} href={p(`/areas/${a.slug}`)}>
                  <Card className="border-dashed p-4 hover:border-ink">
                    <Badge tone="warn">{d.common.comingSoon}</Badge>
                    <p className="mt-2 font-display text-3xl font-extrabold uppercase leading-none">{L(a.name, locale)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </Container>
    </>
  );
}
