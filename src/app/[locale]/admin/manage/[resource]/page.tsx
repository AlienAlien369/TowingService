import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { loadLocale } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { formatINR } from "@/shared/lib/utils";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES } from "@/modules/auth/session";
import { resources } from "@/modules/admin/resources";
import { buttonClass, DataTable, EmptyState } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { db } from "@/shared/lib/db";

type Props = { params: Promise<{ locale: string; resource: string }> };

export default async function ResourceList({ params }: Props) {
  const { resource } = await params;
  const { locale, p } = await loadLocale(params);
  await requireUser(locale, p(`/admin/manage/${resource}`), ADMIN_ROLES);
  const res = resources[resource];
  if (!res) notFound();

  // Rate cards need joined names; everything else uses the registry columns.
  let head: string[];
  let rows: { id: string; cells: string[] }[];
  if (res.key === "rate-cards") {
    const cards = await db.rateCard.findMany({ include: { service: true, vehicleType: true }, orderBy: [{ service: { sortOrder: "asc" } }, { vehicleType: { sortOrder: "asc" } }] });
    head = ["Service", "Vehicle", "Base", "Included", "Per km", "Minimum", "Active"];
    rows = cards.map((c) => ({ id: c.id, cells: [L(c.service.name, "en"), L(c.vehicleType.name, "en").split("(")[0], formatINR(c.baseFare), `${c.includedKm} km`, formatINR(c.perKm), formatINR(c.minFare), c.isActive ? "Yes" : "No"] }));
  } else {
    const data = await res.delegate.findMany({ orderBy: res.orderBy });
    head = res.columns.map((c) => c.header);
    rows = data.map((r) => ({ id: String(r.id), cells: res.columns.map((c) => c.get(r)) }));
  }
  return (
    <>
      <PageTitle title={res.title} sub={res.description} actions={<Link href={p(`/admin/manage/${res.key}/new`)} className={buttonClass("primary", "md")}><Plus className="size-4" /> New {res.singular}</Link>} />
      {rows.length === 0 ? <EmptyState title={`No ${res.title.toLowerCase()} yet`} /> : (
        <DataTable head={[...head, ""]}>
          {rows.map((r) => (
            <tr key={r.id}>
              {r.cells.map((c, i) => <td key={i} className={i === 0 ? "font-bold" : ""}>{c}</td>)}
              <td className="text-right"><Link href={p(`/admin/manage/${res.key}/${r.id}`)} className="rounded-lg border border-line px-3 py-1.5 text-sm font-bold hover:bg-brand">Edit</Link></td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
