import "server-only";
import { cache } from "react";
import { unstable_cache, updateTag } from "next/cache";
import { db } from "@/shared/lib/db";
import { SETTING_KEYS, settingSchemas, type SettingKey, type Settings } from "./schemas";

function defaults(): Settings {
  return Object.fromEntries(SETTING_KEYS.map((k) => [k, settingSchemas[k].parse({})])) as Settings;
}

async function loadAll(): Promise<Settings> {
  const out = defaults();
  try {
    const rows = await db.siteSetting.findMany();
    for (const row of rows) {
      const key = row.key as SettingKey;
      if (!(key in settingSchemas)) continue;
      const parsed = settingSchemas[key].safeParse(row.value);
      if (parsed.success) (out as Record<string, unknown>)[key] = parsed.data;
    }
  } catch (e) {
    console.error("[settings] DB unavailable, serving defaults:", (e as Error).message);
  }
  return out;
}

const cached = unstable_cache(loadAll, ["site-settings"], { tags: ["settings"], revalidate: 120 });

/** All settings groups, cached across requests and deduped within a request. */
export const getSettings = cache(() => cached());

export async function getSetting<K extends SettingKey>(key: K): Promise<Settings[K]> {
  return (await getSettings())[key];
}

/** Brand + contact merged: what almost every page, email and invoice needs. */
export const getBrand = cache(async () => {
  const s = await getSettings();
  return { ...s.brand, ...s.contact, brandName: s.brand.name };
});
export type Brand = Awaited<ReturnType<typeof getBrand>>;

export async function updateSetting<K extends SettingKey>(key: K, input: unknown, actorId?: string) {
  const value = settingSchemas[key].parse(input);
  await db.siteSetting.upsert({
    where: { key },
    create: { key, value: value as object, updatedBy: actorId },
    update: { value: value as object, updatedBy: actorId },
  });
  updateTag("settings");
  return value;
}
