import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { ContractView } from "@/shared/layout/contract-view";
import { PageTitle } from "@/shared/layout/app-shell";

export default async function PartnerContract({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/partner-portal/contract"));
  const { company } = await getProviderContext(user.id);
  const c = company!;
  const contracts = await db.providerContract.findMany({ where: { companyId: c.id }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageTitle title="Fleet agreement" sub="Covers your company and every driver you add to the platform." />
      <ContractView contracts={contracts} email={c.contactEmail} signerName={c.legalName} />
    </>
  );
}
