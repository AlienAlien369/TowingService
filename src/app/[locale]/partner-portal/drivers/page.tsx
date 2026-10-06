import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { getProviderContext } from "@/modules/providers/service";
import { Alert, Badge, Card, DataTable } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { AddDriverForm, RemoveDriverButton } from "@/shared/client/provider-forms";

export default async function PartnerDrivers({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/partner-portal/drivers"));
  const { company } = await getProviderContext(user.id);
  const c = company!;
  const drivers = await db.driver.findMany({ where: { companyId: c.id }, orderBy: { createdAt: "desc" }, include: { trucks: true } });
  const canAdd = ["APPROVED", "ACTIVE"].includes(c.status);
  return (
    <>
      <PageTitle title="Drivers" sub="Drivers in your fleet sign in with their email and use the driver app. Bookings assigned to them are emailed to you as well." />
      <DataTable head={["Driver", "Contact", "Vehicle", "Rating", "Status", ""]}>
        {drivers.map((d) => (
          <tr key={d.id}>
            <td className="font-bold">{d.name}<span className="block text-xs font-normal text-muted">Licence {d.licenseNo}</span></td>
            <td>{d.phone}<span className="block text-xs text-muted">{d.email}</span></td>
            <td>{d.trucks.map((t) => t.registrationNo).join(", ") || "—"}</td>
            <td>{d.ratingCount ? `★ ${d.ratingAvg.toFixed(1)} (${d.ratingCount})` : "—"}</td>
            <td><Badge tone={d.status === "ACTIVE" ? "ok" : d.status === "SUSPENDED" ? "danger" : "warn"}>{d.status}</Badge>{d.isOnline && <Badge tone="ok" className="ml-1">online</Badge>}</td>
            <td>{d.status !== "SUSPENDED" && <RemoveDriverButton driverId={d.id} />}</td>
          </tr>
        ))}
      </DataTable>
      <Card className="mt-8 p-5">
        <h2 className="mb-3 text-3xl font-extrabold uppercase">Add a driver</h2>
        {canAdd ? <AddDriverForm /> : <Alert tone="info">Available once your company is approved.</Alert>}
      </Card>
    </>
  );
}
