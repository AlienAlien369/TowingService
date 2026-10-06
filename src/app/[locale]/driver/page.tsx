import Link from "next/link";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { getDriverState } from "@/modules/dispatch/driver-state";
import { getSetting } from "@/modules/settings/service";
import { env } from "@/shared/lib/env";
import { Alert } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { DriverConsole } from "@/shared/client/driver-console";

export default async function DriverHome({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/driver"));
  const { driver } = await getProviderContext(user.id);
  const [state, maps] = await Promise.all([getDriverState(driver!.id), getSetting("maps")]);
  const d = driver!;
  return (
    <>
      <PageTitle title={`Hi, ${d.name.split(" ")[0]}`} sub={d.ratingCount ? `★ ${d.ratingAvg.toFixed(1)} from ${d.ratingCount} rides` : "Welcome to your driver app"} />
      {d.status === "PENDING" && <Alert tone="info" title="Application under review" className="mb-4">Our team is verifying your documents (usually 1–2 working days). You'll get an email once approved.</Alert>}
      {d.status === "APPROVED" && !d.companyId && <Alert tone="warn" title="One last step: sign your partner agreement" className="mb-4">You're approved! <Link className="font-bold underline" href={p("/driver/contract")}>Review & sign the agreement</Link> to go online.</Alert>}
      {d.status === "APPROVED" && d.companyId && <Alert tone="warn" title="Waiting for your company" className="mb-4">Your company's agreement must be signed before you can go online.</Alert>}
      {d.status === "REJECTED" && <Alert tone="danger" title="Application not approved" className="mb-4">{d.reviewNote ?? "Please contact support."}</Alert>}
      {d.status === "SUSPENDED" && <Alert tone="danger" title="Account suspended" className="mb-4">Contact support to reactivate.</Alert>}
      <DriverConsole initial={state} tileUrl={maps.tileUrl} center={[maps.centerLat, maps.centerLng]} demoTools={env.exposeDevOtp} />
    </>
  );
}
