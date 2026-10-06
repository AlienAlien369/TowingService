import { notFound } from "next/navigation";
import { loadLocale } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES } from "@/modules/auth/session";
import { settingMeta } from "@/modules/settings/fields";
import { SETTING_KEYS, type SettingKey } from "@/modules/settings/schemas";
import { getSettings } from "@/modules/settings/service";
import { saveSettingsAction } from "@/modules/admin/actions";
import { Alert, Card } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { FieldsForm } from "@/shared/client/fields-form";
import { env } from "@/shared/lib/env";

type Props = { params: Promise<{ locale: string; group: string }> };

export default async function SettingsGroup({ params }: Props) {
  const { group } = await params;
  const { locale, p } = await loadLocale(params);
  await requireUser(locale, p(`/admin/settings/${group}`), ADMIN_ROLES);
  if (!SETTING_KEYS.includes(group as SettingKey)) notFound();
  const key = group as SettingKey;
  const meta = settingMeta[key];
  const settings = await getSettings();
  const action = saveSettingsAction.bind(null, key);
  const razorpayKeys = Boolean(env.razorpay.keyId && env.razorpay.keySecret);
  return (
    <>
      <PageTitle title={meta.title} sub={meta.description} />
      {key === "payments" && (
        <Alert tone={razorpayKeys ? "ok" : "warn"} title={razorpayKeys ? "Razorpay keys detected" : "Razorpay keys not set"} className="mb-4">
          {razorpayKeys ? "Set the mode to Test or Live to enable online payments at checkout." : "Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (and RAZORPAY_WEBHOOK_SECRET) to the environment. Until then the option stays visible but disabled as “Coming soon”."}
          <span className="mt-1 block text-xs">Webhook URL: <code>{env.appUrl}/api/webhooks/razorpay</code> (events: payment.captured, order.paid, payment.failed)</span>
        </Alert>
      )}
      {key === "maps" && <Alert tone="info" className="mb-4">Active provider right now: <b>{settings.maps.provider === "env" ? env.mapProvider : settings.maps.provider}</b>{env.googleMapsKey ? " · Google key present" : " · no Google key set (GOOGLE_MAPS_API_KEY)"}.</Alert>}
      {key === "notifications" && <Alert tone="info" className="mb-4">SMS provider: <b>{env.smsProvider}</b> · SMTP host: <b>{env.smtp.host}:{env.smtp.port}</b>. Credentials are environment variables.</Alert>}
      <Card className="p-5 sm:p-6">
        <FieldsForm fields={meta.fields} values={settings[key] as Record<string, unknown>} action={action} submitLabel="Save settings" />
      </Card>
    </>
  );
}
