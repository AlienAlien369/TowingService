import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { ContractView } from "@/shared/layout/contract-view";
import { PageTitle } from "@/shared/layout/app-shell";

export default async function DriverContractPage({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/driver/contract"));
  const { driver } = await getProviderContext(user.id);
  if (!driver) redirect(p("/partner"));
  if (driver.companyId) redirect(p("/driver"));
  const contracts = await db.providerContract.findMany({ where: { driverId: driver.id }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageTitle title="Partner agreement" sub="Your agreement with us. Signed copies are stored permanently." />
      <ContractView contracts={contracts} email={driver.email} signerName={driver.name} />
    </>
  );
}
