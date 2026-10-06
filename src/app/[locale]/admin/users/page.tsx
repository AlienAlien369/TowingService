import { db } from "@/shared/lib/db";
import { loadLocale } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES } from "@/modules/auth/session";
import { Badge, Card, DataTable } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { InviteStaff, UserControls } from "@/shared/client/admin-controls";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; role?: string }> };

export default async function AdminUsers({ params, searchParams }: Props) {
  const { locale, p } = await loadLocale(params);
  const me = await requireUser(locale, p("/admin/users"), ADMIN_ROLES);
  const sp = await searchParams;
  const q = sp.q?.trim();
  const users = await db.user.findMany({
    where: { ...(sp.role ? { role: sp.role as never } : {}), ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { name: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { bookings: true } } },
  });
  const isSuper = me.role === "SUPER_ADMIN";
  return (
    <>
      <PageTitle title="Users & staff" sub="Customers, partners and back-office staff. Staff sign in with an email code like everyone else." />
      {isSuper && <Card className="mb-6 p-5"><h2 className="mb-3 text-2xl font-extrabold uppercase">Add staff</h2><InviteStaff /></Card>}
      <form className="mb-4 flex flex-wrap gap-2" action={p("/admin/users")}>
        <input name="q" defaultValue={q} placeholder="Search name, email or phone" className="h-11 min-w-64 flex-1 rounded-xl border-2 border-line bg-surface px-3.5" />
        <select name="role" defaultValue={sp.role ?? ""} className="h-11 rounded-xl border-2 border-line bg-surface px-3" aria-label="Role">
          <option value="">All roles</option>
          {["CUSTOMER", "DRIVER", "COMPANY_OWNER", "DISPATCHER", "ADMIN", "SUPER_ADMIN"].map((r) => <option key={r}>{r}</option>)}
        </select>
        <button className="h-11 rounded-xl bg-ink px-5 font-bold text-white">Filter</button>
      </form>
      <DataTable head={["User", "Role", "Bookings", "Joined", "Status", "Actions"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="font-bold">{u.name ?? "—"}<span className="block text-xs font-normal text-muted">{u.email ?? ""} {u.phone ?? ""}</span></td>
            <td><Badge tone={["ADMIN", "SUPER_ADMIN", "DISPATCHER"].includes(u.role) ? "dark" : "neutral"}>{u.role}</Badge></td>
            <td>{u._count.bookings}</td>
            <td className="text-xs">{u.createdAt.toLocaleDateString("en-IN")}</td>
            <td><Badge tone={u.isActive ? "ok" : "danger"}>{u.isActive ? "active" : "disabled"}</Badge></td>
            <td><UserControls userId={u.id} role={u.role} active={u.isActive} canChangeRole={isSuper && !["DRIVER", "COMPANY_OWNER"].includes(u.role)} self={u.id === me.id} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
