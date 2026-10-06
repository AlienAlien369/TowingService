import { notFound } from "next/navigation";
import { getDict } from "@/i18n";
import { isLocale, type Locale } from "./localized";

export type LocaleParams = { params: Promise<{ locale: string }> };

/** Resolves + validates the locale segment and loads its dictionary. */
export async function loadLocale(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale: locale as Locale, d: getDict(locale as Locale), p: (path: string) => `/${locale}${path}` };
}
