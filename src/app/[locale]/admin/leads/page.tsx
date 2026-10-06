import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { Badge, DataTable, EmptyState } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { LeadStatus } from "@/shared/client/admin-controls";

export default async function AdminLeads({ params }: LocaleParams) {
  await loadLocale(params);
  const rows = await db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageTitle title="Leads" sub="Contact forms, call-back requests and “notify me” sign-ups for coming-soon areas." />
      {rows.length === 0 ? <EmptyState title="No leads yet" /> : (
        <DataTable head={["Received", "Type", "Name", "Contact", "Message / area", "Status"]}>
          {rows.map((l) => (
            <tr key={l.id}>
              <td className="whitespace-nowrap text-xs">{l.createdAt.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
              <td><Badge tone={l.kind === "COMING_SOON_AREA" ? "info" : l.kind === "CALLBACK" ? "warn" : "neutral"}>{l.kind.replace(/_/g, " ")}</Badge></td>
              <td className="font-bold">{l.name ?? "—"}</td>
              <td>{l.phone && <a className="block underline" href={`tel:${l.phone}`}>{l.phone}</a>}{l.email && <a className="block text-xs underline" href={`mailto:${l.email}`}>{l.email}</a>}</td>
              <td className="max-w-sm text-sm">{l.message ?? (l.meta ? JSON.stringify(l.meta) : "—")}</td>
              <td><LeadStatus id={l.id} status={l.status} /></td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
