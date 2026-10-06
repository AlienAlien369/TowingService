import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { AppShell } from "@/shared/layout/app-shell";

export const metadata: Metadata = { title: "Driver app", robots: { index: false, follow: false } };

export default async function DriverLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/driver"));
  const { driver } = await getProviderContext(user.id);
  if (!driver) redirect(p("/partner"));
  return (
    <AppShell
      locale={locale}
      title="Driver app"
      roleLabel={driver.company ? `Driver · ${driver.company.tradeName || driver.company.legalName}` : "Independent driver"}
      userLabel={driver.name}
      nav={[
        { href: p("/driver"), label: "Jobs", icon: "truck", exact: true },
        { href: p("/driver/earnings"), label: "Earnings", icon: "zap" },
        { href: p("/driver/profile"), label: "Profile & truck", icon: "wrench" },
        ...(driver.companyId ? [] : [{ href: p("/driver/contract"), label: "Agreement", icon: "shield" }]),
      ]}
    >
      {children}
    </AppShell>
  );
}
