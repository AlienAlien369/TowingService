import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, MapPinned, Phone, ReceiptIndianRupee, ShieldCheck, Star, Truck } from "lucide-react";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { L, fmt } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { getBrand } from "@/modules/settings/service";
import { getServices, getStartingPrices, getVehicleTypes } from "@/modules/catalog/service";
import { getAreas, getFaqs, getTestimonials } from "@/modules/content/service";
import { Card, Container, LinkButton, SectionHeading, Badge } from "@/shared/ui";
import { Icon } from "@/shared/ui/icons";
import { TruckArt } from "@/shared/ui/truck-art";
import { TrackedLink } from "@/shared/client/track";
import { FaqList } from "@/shared/ui/faq-list";

export default async function HomePage({ params }: LocaleParams) {
  const { locale, d, p } = await loadLocale(params);
  const [brand, services, vehicles, prices, areas, faqs, testimonials] = await Promise.all([getBrand(), getServices(), getVehicleTypes(), getStartingPrices(), getAreas(), getFaqs(), getTestimonials()]);
  const tel = brand.emergencyPhone.replace(/[^\d+]/g, "");
  const featured = services.filter((s) => s.isFeatured).concat(services.filter((s) => !s.isFeatured)).slice(0, 6);
  const live = areas.filter((a) => a.status === "ACTIVE");
  const soon = areas.filter((a) => a.status === "COMING_SOON");
  const whyIcons = [BadgeCheck, ReceiptIndianRupee, MapPinned, Truck, ShieldCheck, Clock];

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "22px 22px" }} aria-hidden />
        <Container className="relative grid gap-10 pb-16 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-6 lg:pb-24 lg:pt-16">
          <div>
            <Badge tone="brand" className="mb-5 !px-3 !py-1 text-[13px] uppercase tracking-wider"><span className="relative inline-block size-2 rounded-full bg-ink pulse-ring" /> {d.home.eyebrow}</Badge>
            <h1 className="text-[3.1rem] font-extrabold uppercase leading-[0.92] sm:text-7xl lg:text-[5.4rem]">{d.home.heroTitle}</h1>
            <p className="mt-6 max-w-xl text-lg text-white/75 sm:text-xl">{fmt(d.home.heroSub, { brand: brand.brandName })}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href={p("/book")} size="lg" className="sm:min-w-56">
                {d.home.heroCta} <ArrowRight className="size-5" />
              </LinkButton>
              <TrackedLink event="cta_call_click" props={{ where: "hero" }} href={`tel:${tel}`} className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-white/25 px-7 text-base font-bold text-white hover:bg-white/10">
                <Phone className="size-5" /> {fmt(d.home.heroCall, { phone: brand.emergencyPhone })}
              </TrackedLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white/80">
              {d.home.chips.map((c) => (
                <li key={c} className="inline-flex items-center gap-1.5"><BadgeCheck className="size-4 text-brand" /> {c}</li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <TruckArt className="mx-auto -mb-3 w-full max-w-xl lg:absolute lg:-top-24 lg:right-0 lg:mb-0 lg:max-w-none lg:translate-x-6 lg:opacity-95" />
            <Card className="relative mt-3 border-0 bg-white p-5 text-ink shadow-lift lg:mt-52">
              <p className="font-display text-2xl font-extrabold uppercase">{d.home.quickTitle}</p>
              <p className="mb-3 text-sm text-muted">{d.home.quickSub}</p>
              <div className="grid grid-cols-2 gap-2">
                {vehicles.map((v) => (
                  <Link key={v.id} href={p(`/book?vehicle=${v.slug}`)} className="group flex items-center gap-2.5 rounded-xl border-2 border-line p-2.5 transition hover:border-ink hover:bg-brand-faint">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-ink"><Icon name={v.icon} className="size-5" /></span>
                    <span className="text-[13px] font-bold leading-tight">{L(v.name, locale).split("(")[0].trim()}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </Container>
        <div className="hazard h-2.5" aria-hidden />
      </section>

      {/* ───────── Stats ───────── */}
      <section className="border-b border-line bg-surface">
        <Container className="grid grid-cols-2 gap-px bg-line py-0 sm:grid-cols-4">
          {[[d.home.statsEta, d.home.statsEtaVal], [d.home.statsHours, d.home.statsHoursVal], [d.home.statsFleet, d.home.statsFleetVal], [d.home.statsPay, d.home.statsPayVal]].map(([k, v]) => (
            <div key={k} className="bg-surface px-3 py-5 text-center">
              <p className="font-display text-3xl font-extrabold sm:text-4xl">{v}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{k}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* ───────── Services ───────── */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow={d.home.servicesEyebrow} title={d.home.servicesTitle} subtitle={d.home.servicesSub} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((s) => (
              <Link key={s.id} href={p(`/services/${s.slug}`)} className="group">
                <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-1 group-hover:shadow-lift">
                  <span className="grid size-14 place-items-center rounded-2xl bg-ink text-brand"><Icon name={s.icon} className="size-7" /></span>
                  <h3 className="mt-4 text-3xl font-extrabold uppercase leading-none">{L(s.name, locale)}</h3>
                  <p className="mt-2 flex-1 text-muted">{L(s.shortDescription, locale)}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                    <span className="font-bold">{prices[s.id] ? <>{d.common.from} {formatINR(prices[s.id])}</> : null}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-ink group-hover:gap-2">{d.common.learnMore} <ArrowRight className="size-4" /></span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center"><LinkButton href={p("/services")} variant="outline">{d.common.viewAll}</LinkButton></div>
        </Container>
      </section>

      {/* ───────── How it works ───────── */}
      <section className="bg-ink py-16 text-white sm:py-24">
        <Container>
          <SectionHeading light eyebrow={d.home.howEyebrow} title={d.home.howTitle} />
          <ol className="grid gap-4 md:grid-cols-4">
            {d.home.howSteps.map((s, i) => (
              <li key={s.t} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <span className="font-display text-7xl font-extrabold leading-none text-brand/90">{i + 1}</span>
                <h3 className="mt-2 text-2xl font-extrabold uppercase">{s.t}</h3>
                <p className="mt-1 text-white/70">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center"><LinkButton href={p("/book")} size="lg">{d.home.heroCta} <ArrowRight className="size-5" /></LinkButton></div>
        </Container>
      </section>

      {/* ───────── Vehicles ───────── */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow={d.home.vehiclesEyebrow} title={d.home.vehiclesTitle} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <Link key={v.id} href={p(`/book?vehicle=${v.slug}`)} className="group flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-ink hover:shadow-card">
                <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-brand text-ink"><Icon name={v.icon} className="size-7" /></span>
                <span>
                  <span className="block text-xl font-extrabold leading-tight">{L(v.name, locale)}</span>
                  <span className="mt-0.5 block text-sm text-muted">{L(v.description, locale)}</span>
                  {v.maxWeightKg && <span className="mt-1.5 block text-xs font-bold text-ink/60">≤ {v.maxWeightKg.toLocaleString("en-IN")} kg</span>}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ───────── Why ───────── */}
      <section className="bg-brand-faint py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow={fmt(d.home.whyEyebrow, { brand: brand.brandName })} title={d.home.whyTitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.home.why.map((w, i) => {
              const I = whyIcons[i % whyIcons.length];
              return (
                <Card key={w.t} className="p-5">
                  <I className="size-8 text-ink" />
                  <h3 className="mt-3 text-2xl font-extrabold uppercase">{w.t}</h3>
                  <p className="mt-1 text-muted">{w.d}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ───────── Coverage ───────── */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow={d.home.coverageEyebrow} title={d.home.coverageTitle} subtitle={d.home.coverageSub} />
          <div className="flex flex-wrap gap-2">
            {live.map((a) => (
              <Link key={a.id} href={p(`/areas/${a.slug}`)} className="rounded-full border-2 border-line bg-surface px-4 py-2 text-sm font-bold transition hover:border-ink hover:bg-brand">
                {L(a.name, locale)}
              </Link>
            ))}
            {soon.map((a) => (
              <Link key={a.id} href={p(`/areas/${a.slug}`)} className="inline-flex items-center gap-2 rounded-full border-2 border-dashed border-ink/25 px-4 py-2 text-sm font-bold text-ink/70 hover:border-ink">
                {L(a.name, locale)} <Badge tone="warn">{d.home.soon}</Badge>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ───────── Testimonials (only when admin has activated real ones) ───────── */}
      {testimonials.length > 0 && (
        <section className="bg-ink py-16 text-white sm:py-24">
          <Container>
            <SectionHeading light eyebrow={d.home.testimonialsEyebrow} title={d.home.testimonialsTitle} />
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => (
                <figure key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                  <div className="flex gap-0.5 text-brand" aria-label={`${t.rating} / 5`}>
                    {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="size-5 fill-current" />)}
                  </div>
                  <blockquote className="mt-3 text-lg">“{L(t.text, locale)}”</blockquote>
                  <figcaption className="mt-3 text-sm font-bold text-white/70">{t.name}{t.locality ? ` · ${t.locality}` : ""}</figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ───────── FAQ ───────── */}
      <section className="py-16 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading eyebrow={d.home.faqEyebrow} title={d.home.faqTitle} />
            <LinkButton href={p("/faq")} variant="outline">{d.common.viewAll}</LinkButton>
          </div>
          <FaqList items={faqs.slice(0, 6).map((f) => ({ id: f.id, q: L(f.question, locale), a: L(f.answer, locale) }))} />
        </Container>
      </section>

      {/* ───────── Partner CTA ───────── */}
      <section className="pb-16 sm:pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-brand p-8 sm:p-12">
            <div className="hazard-soft absolute inset-y-0 right-0 hidden w-1/3 opacity-60 sm:block" aria-hidden />
            <div className="relative max-w-2xl">
              <h2 className="text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl">{d.home.partnerTitle}</h2>
              <p className="mt-3 text-lg text-ink/80">{fmt(d.home.partnerSub, { brand: brand.brandName })}</p>
              <LinkButton href={p("/partner")} variant="dark" size="lg" className="mt-6">{d.home.partnerCta} <ArrowRight className="size-5" /></LinkButton>
            </div>
          </div>
        </Container>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="bg-ink text-white">
        <div className="hazard h-2" aria-hidden />
        <Container className="flex flex-col items-center gap-4 py-14 text-center">
          <h2 className="text-5xl font-extrabold uppercase sm:text-6xl">{d.home.finalTitle}</h2>
          <p className="text-lg text-white/75">{d.home.finalSub}</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <LinkButton href={p("/book")} size="lg">{d.nav.book}</LinkButton>
            <TrackedLink event="cta_call_click" props={{ where: "final" }} href={`tel:${tel}`} className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-extrabold text-ink">
              <Phone className="size-5" /> {brand.emergencyPhone}
            </TrackedLink>
          </div>
        </Container>
      </section>
    </>
  );
}
