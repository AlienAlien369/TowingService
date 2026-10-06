import type { Metadata } from "next";
import { ArrowRight, Building2, Check, FileSignature, User } from "lucide-react";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { fmt } from "@/shared/lib/localized";
import { getBrand, getSetting } from "@/modules/settings/service";
import { getCurrentUser } from "@/modules/auth/session";
import { getProviderContext } from "@/modules/providers/service";
import { Card, Container, LinkButton, PageHero, SectionHeading } from "@/shared/ui";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { d } = await loadLocale(params);
  const brand = await getBrand();
  return { title: fmt(d.partner.title, { brand: brand.brandName }), description: d.partner.sub };
}

export default async function PartnerPage({ params }: LocaleParams) {
  const { d, p } = await loadLocale(params);
  const [brand, pricing, user] = await Promise.all([getBrand(), getSetting("pricing"), getCurrentUser()]);
  const ctx = user ? await getProviderContext(user.id) : null;
  const dash = ctx?.company ? p("/partner-portal") : ctx?.driver ? p("/driver") : null;
  return (
    <>
      <PageHero title={fmt(d.partner.title, { brand: brand.brandName })} subtitle={d.partner.sub}>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={p("/partner/apply?type=driver")} size="lg">{d.partner.apply} <ArrowRight className="size-5" /></LinkButton>
          {dash && <LinkButton href={dash} variant="light" size="lg">{d.partner.already}</LinkButton>}
        </div>
      </PageHero>
      <Container className="py-12 sm:py-16">
        <SectionHeading title={d.partner.typesTitle} />
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { icon: User, t: d.partner.individual, s: d.partner.individualSub, href: p("/partner/apply?type=driver") },
            { icon: Building2, t: d.partner.company, s: d.partner.companySub, href: p("/partner/apply?type=company") },
          ].map((x) => (
            <Card key={x.t} className="flex flex-col p-6">
              <span className="grid size-14 place-items-center rounded-2xl bg-brand"><x.icon className="size-7" /></span>
              <h3 className="mt-3 text-3xl font-extrabold uppercase">{x.t}</h3>
              <p className="mt-1 flex-1 text-muted">{x.s}</p>
              <LinkButton href={x.href} variant="dark" className="mt-4 self-start">{d.partner.apply} <ArrowRight className="size-4" /></LinkButton>
            </Card>
          ))}
        </div>

        <div className="mt-16"><SectionHeading title={d.partner.whyTitle} /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.partner.why.map((w) => (
            <Card key={w.t} className="p-5">
              <Check className="size-7 rounded-full bg-ok p-1 text-white" />
              <h3 className="mt-3 text-2xl font-extrabold uppercase">{w.t}</h3>
              <p className="mt-1 text-muted">{w.d}</p>
            </Card>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-ink p-6 text-white sm:p-10">
          <SectionHeading light title={d.partner.howTitle} />
          <ol className="grid gap-4 md:grid-cols-4">
            {d.partner.how.map((s, i) => (
              <li key={s.t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="font-display text-6xl font-extrabold leading-none text-brand">{i + 1}</span>
                <h3 className="mt-2 text-2xl font-extrabold uppercase">{s.t}</h3>
                <p className="mt-1 text-white/70">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-3 text-3xl font-extrabold uppercase">{d.partner.requirements}</h3>
            <ul className="space-y-2">
              {d.partner.reqList.map((r) => <li key={r} className="flex items-center gap-2 font-semibold"><Check className="size-5 text-ok" /> {r}</li>)}
            </ul>
          </Card>
          <Card className="flex flex-col justify-between bg-brand p-6">
            <div>
              <FileSignature className="size-10" />
              <h3 className="mt-2 text-3xl font-extrabold uppercase">{d.partner.agreement}</h3>
              <p className="mt-1 text-ink/80">Platform commission: {pricing.platformCommissionPct}% (default, stated in your personal agreement).</p>
            </div>
            <LinkButton href={p("/legal/partner-agreement")} variant="dark" className="mt-4 self-start">{d.partner.agreement}</LinkButton>
          </Card>
        </div>
      </Container>
    </>
  );
}
