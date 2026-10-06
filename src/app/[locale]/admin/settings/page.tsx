import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES } from "@/modules/auth/session";
import { settingMeta } from "@/modules/settings/fields";
import { SETTING_KEYS } from "@/modules/settings/schemas";
import { Card } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";

export default async function SettingsIndex({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  await requireUser(locale, p("/admin/settings"), ADMIN_ROLES);
  return (
    <>
      <PageTitle title="Settings" sub="Everything below is editable live — no redeploy needed." />
      <div className="grid gap-4 sm:grid-cols-2">
        {SETTING_KEYS.map((k) => (
          <Link key={k} href={p(`/admin/settings/${k}`)} className="group">
            <Card className="h-full p-5 transition group-hover:border-ink">
              <h2 className="text-3xl font-extrabold uppercase">{settingMeta[k].title}</h2>
              <p className="mt-1 text-sm text-muted">{settingMeta[k].description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold group-hover:gap-2">Edit <ArrowRight className="size-4" /></span>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
