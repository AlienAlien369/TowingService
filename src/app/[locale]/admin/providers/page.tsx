import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { L } from "@/shared/lib/localized";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES, STAFF_ROLES } from "@/modules/auth/session";
import { getSetting } from "@/modules/settings/service";
import { Badge, Card, EmptyState, type Tone } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { ProviderReviewControls } from "@/shared/client/admin-controls";

const tone = (s: string): Tone => (s === "ACTIVE" ? "ok" : s === "PENDING" ? "warn" : s === "APPROVED" ? "info" : "danger");

export default async function AdminProviders({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  const staff = await requireUser(locale, p("/admin/providers"), STAFF_ROLES);
  const canAct = ADMIN_ROLES.includes(staff.role);
  const [pricing, companies, drivers] = await Promise.all([
    getSetting("pricing"),
    db.company.findMany({ orderBy: { createdAt: "desc" }, include: { drivers: true, trucks: true, contracts: { orderBy: { createdAt: "desc" }, take: 1 } } }),
    db.driver.findMany({ where: { companyId: null }, orderBy: { createdAt: "desc" }, include: { trucks: true, vehicleTypes: true, services: true, contracts: { orderBy: { createdAt: "desc" }, take: 1 } } }),
  ]);
  const order = (s: string) => ({ PENDING: 0, APPROVED: 1, ACTIVE: 2, SUSPENDED: 3, REJECTED: 4 })[s] ?? 9;
  const cs = [...companies].sort((a, b) => order(a.status) - order(b.status));
  const ds = [...drivers].sort((a, b) => order(a.status) - order(b.status));
  return (
    <>
      <PageTitle title="Partners" sub="Review applications, set commission, send agreements and manage access." />
      <h2 className="mb-3 text-3xl font-extrabold uppercase">Fleet companies ({cs.length})</h2>
      <div className="mb-10 space-y-3">
        {cs.length === 0 && <EmptyState title="No company applications yet" />}
        {cs.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xl font-extrabold">{c.legalName}{c.tradeName && <span className="font-normal text-muted"> · {c.tradeName}</span>}</p>
                <p className="text-sm text-muted">{c.contactEmail} · {c.contactPhone}{c.gstin ? ` · GSTIN ${c.gstin}` : ""}</p>
                <p className="text-sm text-muted">{c.address}</p>
                <p className="mt-1 text-xs">{c.drivers.length} drivers · {c.trucks.length} vehicles · contract: {c.contracts[0] ? c.contracts[0].status : "none"}{c.upiId ? ` · UPI ${c.upiId}` : ""}</p>
              </div>
              <Badge tone={tone(c.status)}>{c.status}</Badge>
            </div>
            {c.reviewNote && <p className="mt-2 text-sm italic text-muted">Note: {c.reviewNote}</p>}
            {canAct && <div className="mt-3 border-t border-line pt-3"><ProviderReviewControls kind="COMPANY" id={c.id} status={c.status} defaultCommission={pricing.platformCommissionPct} commissionPct={c.commissionBp != null ? c.commissionBp / 100 : null} /></div>}
          </Card>
        ))}
      </div>
      <h2 className="mb-3 text-3xl font-extrabold uppercase">Independent drivers ({ds.length})</h2>
      <div className="space-y-3">
        {ds.length === 0 && <EmptyState title="No driver applications yet" />}
        {ds.map((d) => (
          <Card key={d.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xl font-extrabold">{d.name} {d.isOnline && <Badge tone="ok">online</Badge>}</p>
                <p className="text-sm text-muted">{d.email} · {d.phone} · Licence {d.licenseNo ?? "—"}{d.licenseExpiry ? ` (exp ${d.licenseExpiry.toLocaleDateString("en-IN")})` : ""}</p>
                <p className="text-sm text-muted">{d.address}</p>
                <p className="mt-1 text-xs">Trucks: {d.trucks.map((t) => `${t.registrationNo} (${t.kind.toLowerCase().replace("_", " ")})`).join(", ") || "—"} · Handles: {d.vehicleTypes.map((v) => L(v.name, "en").split("(")[0].trim()).join(", ")} · contract: {d.contracts[0]?.status ?? "none"}</p>
              </div>
              <Badge tone={tone(d.status)}>{d.status}</Badge>
            </div>
            {d.reviewNote && <p className="mt-2 text-sm italic text-muted">Note: {d.reviewNote}</p>}
            {canAct && <div className="mt-3 border-t border-line pt-3"><ProviderReviewControls kind="DRIVER" id={d.id} status={d.status} defaultCommission={pricing.platformCommissionPct} commissionPct={d.commissionBp != null ? d.commissionBp / 100 : null} /></div>}
          </Card>
        ))}
      </div>
    </>
  );
}
