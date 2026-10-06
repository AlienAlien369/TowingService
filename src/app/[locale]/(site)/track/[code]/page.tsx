import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { getBrand, getSetting } from "@/modules/settings/service";
import { getCurrentUser } from "@/modules/auth/session";
import { buildTrackData } from "@/modules/bookings/track-data";
import { Alert, Container, LinkButton, PageHero } from "@/shared/ui";
import { TrackView } from "@/shared/client/track-view";

type Props = { params: Promise<{ locale: string; code: string }>; searchParams: Promise<{ new?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.track.title, robots: { index: false, follow: false } };
}

export default async function TrackPage({ params, searchParams }: Props) {
  const { code } = await params;
  const { locale, d, p } = await loadLocale(params);
  const sp = await searchParams;
  if (!/^[A-Za-z0-9-]{4,20}$/.test(code)) notFound();
  const [user, brand, maps] = await Promise.all([getCurrentUser(), getBrand(), getSetting("maps")]);
  const data = await buildTrackData(code, user);
  if (!data)
    return (
      <>
        <PageHero title={d.track.title} />
        <Container className="max-w-xl py-12">
          <Alert tone="danger">{d.track.notFound}</Alert>
          <LinkButton href={p("/track")} className="mt-4">{d.track.find}</LinkButton>
        </Container>
      </>
    );
  return (
    <>
      <PageHero title={d.track.title} />
      <Container className="py-8">
        <TrackView initial={data} d={d} locale={locale} isNew={sp.new === "1"} loginHref={p(`/login?next=${encodeURIComponent(p(`/track/${code}`))}`)} brandName={brand.brandName} map={{ tileUrl: maps.tileUrl }} />
      </Container>
    </>
  );
}
