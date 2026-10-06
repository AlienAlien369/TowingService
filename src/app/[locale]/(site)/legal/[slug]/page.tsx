import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { renderMarkdown } from "@/shared/lib/markdown";
import { getRenderedPage } from "@/modules/content/service";
import { Container, PageHero } from "@/shared/ui";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await loadLocale(params);
  const page = await getRenderedPage(slug, locale);
  return page ? { title: page.title, alternates: { canonical: `/${locale}/legal/${slug}` } } : {};
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const { locale, d } = await loadLocale(params);
  const page = await getRenderedPage(slug, locale);
  if (!page) notFound();
  return (
    <>
      <PageHero eyebrow={d.legal.title} title={page.title} subtitle={`${d.legal.updated}: ${page.updatedAt.toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" })} · ${d.legal.version} ${page.version}`} />
      <Container className="py-12">
        <article className="prose-doc" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />
      </Container>
    </>
  );
}
