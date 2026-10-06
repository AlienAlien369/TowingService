import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES } from "@/modules/auth/session";
import { funnel } from "@/modules/admin/queries";
import { Card, Stat } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export default async function AdminAnalytics({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  await requireUser(locale, p("/admin/analytics"), ADMIN_ROLES);
  const { counts: c } = await funnel(30);
  const steps = [["Started booking", c.booking_started ?? 0], ["Saw a quote", c.quote_viewed ?? 0], ["Submitted booking", c.booking_submitted ?? 0], ["Completed (paid job)", c.booking_completed ?? 0]] as const;
  const top = Math.max(1, steps[0][1]);
  return (
    <>
      <PageTitle title="Analytics" sub="Last 30 days · first-party event tracking (see docs/tracking-plan.md)." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Call-button taps" value={c.cta_call_click ?? 0} />
        <Stat label="OTPs requested" value={c.otp_requested ?? 0} hint={`${c.login_success ?? 0} successful sign-ins`} />
        <Stat label="Partner applications" value={c.partner_apply_submitted ?? 0} hint={`${c.partner_apply_started ?? 0} started · ${c.contract_signed ?? 0} signed`} />
        <Stat label="Coming-soon leads" value={c.coming_soon_lead ?? 0} hint={`${c.razorpay_interest_clicked ?? 0} tapped “online pay”`} />
      </div>
      <Card className="p-5">
        <h2 className="mb-4 text-3xl font-extrabold uppercase">Booking funnel</h2>
        <ol className="space-y-3">
          {steps.map(([label, n], i) => (
            <li key={label}>
              <div className="mb-1 flex justify-between text-sm font-bold"><span>{label}</span><span>{n} {i > 0 && <span className="font-normal text-muted">· {pct(n, steps[i - 1][1])} of previous</span>}</span></div>
              <div className="h-7 overflow-hidden rounded-lg bg-ink-soft"><div className="h-full rounded-lg bg-brand" style={{ width: `${Math.max(2, (n / top) * 100)}%` }} /></div>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
