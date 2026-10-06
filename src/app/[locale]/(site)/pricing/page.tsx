import type { Metadata } from "next";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { L, fmt } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { getSettings } from "@/modules/settings/service";
import { getRateCards, getServices, getVehicleTypes } from "@/modules/catalog/service";
import { Container, DataTable, LinkButton, PageHero } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.pricing.title, description: d.pricing.sub };
}

export default async function PricingPage({ params }: LocaleParams) {
  const { locale, d, p } = await loadLocale(params);
  const [services, vehicles, rates, s] = await Promise.all([getServices(), getVehicleTypes(), getRateCards(), getSettings()]);
  const night = `+${Math.round((s.pricing.nightMultiplier - 1) * 100)}%`;
  return (
    <>
      <PageHero title={d.pricing.title} subtitle={d.pricing.sub} />
      <Container className="space-y-10 py-12">
        {services.map((svc) => {
          const rows = vehicles.map((v) => ({ v, r: rates.find((r) => r.serviceId === svc.id && r.vehicleTypeId === v.id) })).filter((x) => x.r);
          if (!rows.length) return null;
          return (
            <section key={svc.id} aria-labelledby={`svc-${svc.slug}`}>
              <h2 id={`svc-${svc.slug}`} className="mb-3 flex items-center gap-3 text-3xl font-extrabold uppercase">
                <span className="grid size-10 place-items-center rounded-xl bg-ink text-brand"><Icon name={svc.icon} className="size-5" /></span>
                {L(svc.name, locale)}
              </h2>
              <DataTable head={svc.requiresDrop ? [d.pricing.vehicle, d.pricing.base, d.pricing.includedKm, d.pricing.extra, d.pricing.minimum] : [d.pricing.vehicle, locale === "hi" ? "तय रेट" : "Flat fare"]}>
                {rows.map(({ v, r }) => (
                  <tr key={v.id}>
                    <td className="font-bold">{L(v.name, locale)}</td>
                    <td className="font-bold">{formatINR(r!.baseFare)}</td>
                    {svc.requiresDrop && (
                      <>
                        <td>{r!.includedKm} {d.common.km}</td>
                        <td>{formatINR(r!.perKm)} {d.common.perKm}</td>
                        <td>{formatINR(r!.minFare)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </DataTable>
            </section>
          );
        })}
        <section className="grid gap-6 rounded-2xl bg-ink p-6 text-white lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="mb-3 text-3xl font-extrabold uppercase text-brand">{d.pricing.notes}</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-white/85">
              {d.pricing.noteList.map((n) => (
                <li key={n}>{fmt(n, { start: s.pricing.nightStartHour, end: s.pricing.nightEndHour, night, gst: s.business.gstRatePct, wait: s.pricing.freeWaitingMinutes })}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-brand p-5 text-ink">
            <p className="font-display text-3xl font-extrabold uppercase leading-none">{d.pricing.estimate}</p>
            <p className="mt-1 text-ink/80">{d.pricing.estimateSub}</p>
            <LinkButton href={p("/book")} variant="dark" className="mt-4">{d.nav.book}</LinkButton>
          </div>
        </section>
      </Container>
    </>
  );
}
