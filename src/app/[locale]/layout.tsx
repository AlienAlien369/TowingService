import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/inter";
import "@fontsource-variable/noto-sans-devanagari";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "../globals.css";
import { env } from "@/shared/lib/env";
import { isLocale } from "@/shared/lib/localized";
import { getSettings } from "@/modules/settings/service";

// Brand, content and auth state are read per request (DB-backed, edited live from the admin panel).
export const dynamic = "force-dynamic";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const { brand, seo } = await getSettings();
  const suffix = seo.titleSuffix || brand.name;
  const description = (locale === "hi" && brand.description.hi) || brand.description.en;
  const tagline = (locale === "hi" && brand.tagline.hi) || brand.tagline.en;
  return {
    metadataBase: new URL(env.appUrl),
    title: { default: `${brand.name} – ${tagline}`, template: `%s | ${suffix}` },
    description,
    keywords: seo.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    applicationName: brand.name,
    alternates: { languages: { en: "/en", hi: "/hi" } },
    openGraph: { type: "website", siteName: brand.name, title: `${brand.name} – ${tagline}`, description, locale: locale === "hi" ? "hi_IN" : "en_IN" },
    robots: { index: true, follow: true },
    formatDetection: { telephone: true },
    icons: { icon: "/icon", apple: "/apple-icon" },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { brand } = await getSettings();
  return { themeColor: brand.inkColor, width: "device-width", initialScale: 1 };
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { brand, seo } = await getSettings();
  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <head>
        {/* Runtime theme: colors come from Admin → Settings → Brand (hex-validated). */}
        <style dangerouslySetInnerHTML={{ __html: `:root{--brand:${brand.primaryColor};--ink:${brand.inkColor}}` }} />
      </head>
      <body className="min-h-dvh">
        {children}
        {seo.googleAnalyticsId && /^[\w-]+$/.test(seo.googleAnalyticsId) && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${seo.googleAnalyticsId}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${seo.googleAnalyticsId}');` }} />
          </>
        )}
      </body>
    </html>
  );
}
