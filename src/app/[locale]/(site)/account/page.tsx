import Link from "next/link";
import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { db } from "@/shared/lib/db";
import { requireUser } from "@/modules/auth/guards";
import { homeForRole } from "@/modules/auth/routing";
import { logoutAction } from "@/modules/auth/actions";
import { STATUS_LABEL } from "@/modules/bookings/state";
import { Badge, Button, Card, Container, EmptyState, LinkButton, PageHero } from "@/shared/ui";
import { ProfileForm } from "@/shared/client/profile-form";
import type { Tone } from "@/shared/ui";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.account.title, robots: { index: false } };
}

const tone = (s: string): Tone => (s === "COMPLETED" ? "ok" : s === "CANCELLED" ? "danger" : s === "NO_DRIVER_FOUND" ? "warn" : "brand");

export default async function AccountPage({ params }: Props) {
  const { locale, d, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/account"));
  const bookings = await db.booking.findMany({ where: { customerId: user.id }, orderBy: { createdAt: "desc" }, take: 30, include: { service: true, vehicleType: true } });
  const home = homeForRole(user.role, locale);
  return (
    <>
      <PageHero title={d.account.title} subtitle={user.name ?? user.email ?? user.phone ?? ""} />
      <Container className="grid gap-8 py-10 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="my-bookings">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="my-bookings" className="text-4xl font-extrabold uppercase">{d.account.bookings}</h2>
            <LinkButton href={p("/book")} size="sm">{d.nav.book}</LinkButton>
          </div>
          {bookings.length === 0 ? (
            <EmptyState title={d.account.none}><LinkButton href={p("/book")} className="mt-3">{d.account.bookFirst}</LinkButton></EmptyState>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Link key={b.id} href={p(`/track/${b.code}`)} className="block">
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-ink">
                    <div>
                      <p className="font-mono text-sm font-bold tracking-wider">{b.code}</p>
                      <p className="text-lg font-extrabold leading-tight">{L(b.service.name, locale)} · {L(b.vehicleType.name, locale).split("(")[0]}</p>
                      <p className="text-sm text-muted">{b.createdAt.toLocaleString(locale === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                    <div className="text-right">
                      <Badge tone={tone(b.status)}>{STATUS_LABEL[b.status]}</Badge>
                      <p className="mt-1 font-display text-2xl font-extrabold">{formatINR(b.total)}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 text-3xl font-extrabold uppercase">{d.account.profile}</h2>
            <ProfileForm name={user.name ?? ""} email={user.email ?? ""} phone={user.phone ?? ""} labels={{ name: d.common.name, email: d.common.email, phone: d.common.phone, save: d.common.save, saved: d.account.saved }} />
          </Card>
          {home !== p("/account") && <LinkButton href={home} variant="dark" className="w-full">{user.role === "DRIVER" ? d.nav.driver : user.role === "COMPANY_OWNER" ? d.nav.partnerPortal : d.nav.admin}</LinkButton>}
          {user.role === "CUSTOMER" && (
            <Card className="bg-brand p-5">
              <p className="font-display text-3xl font-extrabold uppercase leading-none">{d.account.become}</p>
              <p className="mt-1 text-ink/80">{d.account.becomeSub}</p>
              <LinkButton href={p("/partner")} variant="dark" className="mt-3">{d.nav.partner}</LinkButton>
            </Card>
          )}
          <form action={logoutAction.bind(null, locale)}><Button variant="outline" className="w-full">{d.nav.logout}</Button></form>
        </aside>
      </Container>
    </>
  );
}
