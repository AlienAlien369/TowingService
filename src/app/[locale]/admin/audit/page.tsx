import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES } from "@/modules/auth/session";
import { DataTable } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";

export default async function AdminAudit({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  await requireUser(locale, p("/admin/audit"), ADMIN_ROLES);
  const rows = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const actors = await db.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.actorId).filter(Boolean) as string[])] } }, select: { id: true, email: true, name: true } });
  const who = new Map(actors.map((a) => [a.id, a.email ?? a.name ?? a.id]));
  return (
    <>
      <PageTitle title="Audit log" sub="Immutable trail of privileged actions: approvals, settings, role changes, settlements, contract signatures." />
      <DataTable head={["When", "Actor", "Action", "Entity", "Details", "IP"]}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="whitespace-nowrap text-xs">{r.createdAt.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}</td>
            <td className="text-xs">{(r.actorId && who.get(r.actorId)) ?? "system"}{r.actorRole && <span className="block text-muted">{r.actorRole}</span>}</td>
            <td className="font-mono text-xs font-bold">{r.action}</td>
            <td className="text-xs">{r.entity}{r.entityId && <span className="block font-mono text-muted">{r.entityId.slice(0, 12)}</span>}</td>
            <td className="max-w-xs truncate font-mono text-[11px] text-muted">{r.meta ? JSON.stringify(r.meta) : ""}</td>
            <td className="font-mono text-xs">{r.ip}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
