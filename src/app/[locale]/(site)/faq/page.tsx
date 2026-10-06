import type { Metadata } from "next";
import { toJsonLd } from "@/shared/lib/jsonld";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { getFaqs } from "@/modules/content/service";
import { Container, LinkButton, PageHero } from "@/shared/ui";
import { FaqList } from "@/shared/ui/faq-list";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.faq.title, description: d.faq.sub };
}

export default async function FaqPage({ params }: LocaleParams) {
  const { locale, d, p } = await loadLocale(params);
  const faqs = await getFaqs();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: L(f.question, locale), acceptedAnswer: { "@type": "Answer", text: L(f.answer, locale) } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
      <PageHero title={d.faq.title} subtitle={d.faq.sub} />
      <Container className="max-w-4xl py-12">
        <FaqList items={faqs.map((f) => ({ id: f.id, q: L(f.question, locale), a: L(f.answer, locale) }))} />
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="text-lg font-bold">{d.faq.stillStuck}</span>
          <LinkButton href={p("/contact")} variant="outline">{d.faq.contactUs}</LinkButton>
        </div>
      </Container>
    </>
  );
}
