import { notFound } from "next/navigation";
import { isLocale } from "@/shared/lib/localized";
import { SiteHeader } from "@/shared/layout/header";
import { SiteFooter } from "@/shared/layout/footer";
import { ActionBar } from "@/shared/layout/action-bar";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:font-bold">
        Skip to content
      </a>
      <SiteHeader locale={locale} />
      <main id="main">{children}</main>
      <SiteFooter locale={locale} />
      <ActionBar locale={locale} />
    </>
  );
}
