import { z } from "zod";

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

/** Text stored in the DB in every supported language. Hindi falls back to English when empty. */
export type Localized = { en: string; hi: string };

export const localizedSchema = z.object({
  en: z.string().min(1, "English text is required"),
  hi: z.string().default(""),
});

export const emptyLocalized = (): Localized => ({ en: "", hi: "" });

export function L(value: unknown, locale: Locale): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const v = value as Partial<Localized>;
    return (locale === "hi" ? v.hi || v.en : v.en) ?? "";
  }
  return "";
}

/** Safe cast for Prisma Json columns that hold Localized. */
export const asLocalized = (v: unknown): Localized => {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Localized>;
  return { en: o.en ?? "", hi: o.hi ?? "" };
};

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
