import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { Badge, Card, DataTable } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { TruckForm } from "@/shared/client/provider-forms";

export default async function PartnerFleet({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/partner-portal/fleet"));
  const { company } = await getProviderContext(user.id);
  const trucks = await db.truck.findMany({ where: { OR: [{ companyId: company!.id }, { driver: { companyId: company!.id } }] }, include: { driver: true }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageTitle title="Vehicles" sub="All trucks registered under your company." />
      <DataTable head={["Registration", "Type", "Make / model", "Capacity", "Assigned driver", "Status"]}>
        {trucks.map((t) => (
          <tr key={t.id}><td className="font-mono font-bold">{t.registrationNo}</td><td>{t.kind.replace(/_/g, " ")}</td><td>{[t.make, t.model].filter(Boolean).join(" ") || "—"}</td><td>{t.capacityKg ? `${t.capacityKg} kg` : "—"}</td><td>{t.driver?.name ?? "—"}</td><td><Badge tone={t.isActive ? "ok" : "neutral"}>{t.isActive ? "Active" : "Inactive"}</Badge></td></tr>
        ))}
      </DataTable>
      <Card className="mt-8 p-5"><h2 className="mb-3 text-3xl font-extrabold uppercase">Add a vehicle</h2><TruckForm /></Card>
    </>
  );
}
