import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { Card, Container, PageHero } from "@/shared/ui";
import { TrackLookup } from "@/shared/client/track-lookup";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ code?: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.track.title, robots: { index: false } };
}

export default async function TrackIndex({ params, searchParams }: Props) {
  const { locale, d } = await loadLocale(params);
  const { code } = await searchParams;
  if (code && /^[A-Za-z0-9-]{4,20}$/.test(code)) redirect(`/${locale}/track/${code.toUpperCase()}`);
  return (
    <>
      <PageHero title={d.track.title} />
      <Container className="max-w-xl py-12">
        <Card className="p-6">
          <TrackLookup locale={locale} label={d.track.enterCode} placeholder={d.track.codePh} submit={d.track.find} />
        </Card>
      </Container>
    </>
  );
}
