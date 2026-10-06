import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { AppShell } from "@/shared/layout/app-shell";

export const metadata: Metadata = { title: "Partner portal", robots: { index: false, follow: false } };

export default async function PartnerPortalLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/partner-portal"));
  const { company } = await getProviderContext(user.id);
  if (!company) redirect(p("/partner/apply?type=company"));
  return (
    <AppShell
      locale={locale}
      title="Partner portal"
      roleLabel="Fleet company"
      userLabel={company.tradeName || company.legalName}
      nav={[
        { href: p("/partner-portal"), label: "Overview", icon: "shield", exact: true },
        { href: p("/partner-portal/drivers"), label: "Drivers", icon: "truck" },
        { href: p("/partner-portal/fleet"), label: "Vehicles", icon: "crane" },
        { href: p("/partner-portal/earnings"), label: "Earnings", icon: "zap" },
        { href: p("/partner-portal/contract"), label: "Agreement", icon: "wrench" },
      ]}
    >
      {children}
    </AppShell>
  );
}
