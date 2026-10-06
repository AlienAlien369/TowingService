import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { getServices, getVehicleTypes } from "@/modules/catalog/service";
import { Badge, Card, DataTable } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { CapabilitiesForm, TruckForm } from "@/shared/client/provider-forms";

export default async function DriverProfile({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/driver/profile"));
  const { driver } = await getProviderContext(user.id);
  const d = driver!;
  const [vehicles, services] = await Promise.all([getVehicleTypes(), getServices()]);
  return (
    <>
      <PageTitle title="Profile & truck" sub={`${d.name} · ${d.phone} · ${d.email}`} />
      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="mb-3 text-3xl font-extrabold uppercase">What I handle</h2>
          <CapabilitiesForm vehicles={vehicles.map((v) => ({ id: v.id, name: L(v.name, "en") }))} services={services.map((s) => ({ id: s.id, name: L(s.name, "en") }))} vehicleIds={d.vehicleTypes.map((v) => v.id)} serviceIds={d.services.map((s) => s.id)} />
        </Card>
        <section>
          <h2 className="mb-3 text-3xl font-extrabold uppercase">My vehicles</h2>
          <DataTable head={["Registration", "Type", "Make / model", "Capacity", "Status"]}>
            {d.trucks.map((t) => (
              <tr key={t.id}><td className="font-mono font-bold">{t.registrationNo}</td><td>{t.kind.replace(/_/g, " ")}</td><td>{[t.make, t.model].filter(Boolean).join(" ") || "—"}</td><td>{t.capacityKg ? `${t.capacityKg} kg` : "—"}</td><td><Badge tone={t.isActive ? "ok" : "neutral"}>{t.isActive ? "Active" : "Inactive"}</Badge></td></tr>
            ))}
          </DataTable>
        </section>
        {!d.companyId && (
          <Card className="p-5">
            <h2 className="mb-3 text-3xl font-extrabold uppercase">Add a vehicle</h2>
            <TruckForm />
          </Card>
        )}
      </div>
    </>
  );
}
