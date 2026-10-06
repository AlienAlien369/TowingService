import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { getBrand, getSettings } from "@/modules/settings/service";
import { getRateCards, getServices, getVehicleTypes } from "@/modules/catalog/service";
import { getPaymentOptions } from "@/modules/payments/service";
import { getCurrentUser } from "@/modules/auth/session";
import { Container, PageHero } from "@/shared/ui";
import { BookingWizard } from "@/shared/client/booking-wizard";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ vehicle?: string; service?: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.booking.title, description: d.booking.sub };
}

export default async function BookPage({ params, searchParams }: Props) {
  const { locale, d } = await loadLocale(params);
  const sp = await searchParams;
  const [vehicles, services, rates, pay, settings, brand, user] = await Promise.all([getVehicleTypes(), getServices(), getRateCards(), getPaymentOptions(), getSettings(), getBrand(), getCurrentUser()]);
  const combos: Record<string, string[]> = {};
  for (const r of rates) (combos[r.vehicleTypeId] ??= []).push(r.serviceId);

  return (
    <>
      <PageHero title={d.booking.title} subtitle={d.booking.sub} />
      <Container className="py-8 sm:py-10">
        <BookingWizard
          locale={locale}
          d={d}
          brandName={brand.brandName}
          vehicles={vehicles.map((v) => ({ id: v.id, slug: v.slug, name: L(v.name, locale), description: L(v.description, locale), icon: v.icon }))}
          services={services.map((s) => ({ id: s.id, slug: s.slug, name: L(s.name, locale), short: L(s.shortDescription, locale), icon: s.icon, requiresDrop: s.requiresDrop, eta: s.etaMinutes }))}
          combos={combos}
          pay={{ cash: pay.cash, razorpayEnabled: pay.razorpay.enabled }}
          allowScheduling={settings.dispatch.allowScheduling}
          map={{ tileUrl: settings.maps.tileUrl, lat: settings.maps.centerLat, lng: settings.maps.centerLng, zoom: settings.maps.zoom }}
          user={user ? { name: user.name ?? "", phone: user.phone ?? "", email: user.email ?? "" } : null}
          initial={{ vehicle: sp.vehicle, service: sp.service }}
          cancellationFee={formatINR(settings.pricing.cancellationFeeRupees * 100)}
        />
      </Container>
    </>
  );
}
