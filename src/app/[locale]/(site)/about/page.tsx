import type { Metadata } from "next";
import { HeartHandshake, ReceiptIndianRupee, ShieldCheck } from "lucide-react";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { fmt } from "@/shared/lib/localized";
import { getBrand } from "@/modules/settings/service";
import { Card, Container, LinkButton, PageHero } from "@/shared/ui";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { d } = await loadLocale(params);
  const brand = await getBrand();
  return { title: fmt(d.about.title, { brand: brand.brandName }), description: d.about.sub };
}

export default async function AboutPage({ params }: LocaleParams) {
  const { d, p } = await loadLocale(params);
  const brand = await getBrand();
  const icons = [ShieldCheck, ReceiptIndianRupee, HeartHandshake];
  return (
    <>
      <PageHero title={fmt(d.about.title, { brand: brand.brandName })} subtitle={d.about.sub} />
      <Container className="py-12">
        <div className="max-w-3xl">
          <h2 className="mb-3 text-4xl font-extrabold uppercase">{d.about.storyTitle}</h2>
          {d.about.story.map((s) => <p key={s} className="mb-4 text-lg leading-relaxed">{fmt(s, { brand: brand.brandName })}</p>)}
        </div>
        <h2 className="mb-4 mt-12 text-4xl font-extrabold uppercase">{d.about.valuesTitle}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {d.about.values.map((v, i) => {
            const I = icons[i % icons.length];
            return (
              <Card key={v.t} className="p-6">
                <span className="grid size-12 place-items-center rounded-xl bg-brand"><I className="size-6" /></span>
                <h3 className="mt-3 text-2xl font-extrabold uppercase">{v.t}</h3>
                <p className="mt-1 text-muted">{v.d}</p>
              </Card>
            );
          })}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <LinkButton href={p("/book")}>{d.nav.book}</LinkButton>
          <LinkButton href={p("/partner")} variant="outline">{d.nav.partner}</LinkButton>
        </div>
      </Container>
    </>
  );
}
