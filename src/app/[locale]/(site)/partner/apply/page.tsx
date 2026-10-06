import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { requireUser } from "@/modules/auth/guards";
import { getServices, getVehicleTypes } from "@/modules/catalog/service";
import { getProviderContext } from "@/modules/providers/service";
import { homeForRole } from "@/modules/auth/routing";
import { Alert, Container, LinkButton, PageHero } from "@/shared/ui";
import { PartnerApplyForm } from "@/shared/client/partner-apply-form";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ type?: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.partner.apply, robots: { index: false } };
}

export default async function PartnerApplyPage({ params, searchParams }: Props) {
  const { locale, d, p } = await loadLocale(params);
  const sp = await searchParams;
  const type = sp.type === "company" ? "company" : "driver";
  const user = await requireUser(locale, p(`/partner/apply?type=${type}`));
  const [vehicles, services, ctx] = await Promise.all([getVehicleTypes(), getServices(), getProviderContext(user.id)]);
  const existing = ctx.company ?? ctx.driver;
  return (
    <>
      <PageHero title={type === "company" ? d.partner.applyTitleCompany : d.partner.applyTitleDriver} />
      <Container className="max-w-3xl py-10">
        {existing ? (
          <div className="space-y-4">
            <Alert tone="info" title={d.partner.applySubmitted}>Status: <b>{existing.status}</b></Alert>
            <LinkButton href={homeForRole(ctx.company ? "COMPANY_OWNER" : "DRIVER", locale)}>{d.partner.goToPortal}</LinkButton>
          </div>
        ) : (
          <PartnerApplyForm
            type={type}
            locale={locale}
            d={d}
            vehicles={vehicles.map((v) => ({ id: v.id, name: L(v.name, locale) }))}
            services={services.map((s) => ({ id: s.id, name: L(s.name, locale) }))}
            defaults={{ name: user.name ?? "", email: user.email ?? "", phone: user.phone ?? "" }}
          />
        )}
      </Container>
    </>
  );
}
