import en, { type Dict } from "./en";
import hi from "./hi";
import type { Locale } from "@/shared/lib/localized";

const dicts: Record<Locale, Dict> = { en, hi };
export const getDict = (locale: Locale): Dict => dicts[locale];
export type { Dict };
