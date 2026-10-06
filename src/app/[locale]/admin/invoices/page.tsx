import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { formatINR } from "@/shared/lib/utils";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES } from "@/modules/auth/session";
import { DataTable, EmptyState } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";

export default async function AdminInvoices({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  await requireUser(locale, p("/admin/invoices"), ADMIN_ROLES);
  const rows = await db.invoice.findMany({ orderBy: { issuedAt: "desc" }, take: 200, include: { booking: { select: { code: true } } } });
  const sum = rows.reduce((a, r) => ({ t: a.t + r.taxableValue, c: a.c + r.cgst, s: a.s + r.sgst, i: a.i + r.igst, tot: a.tot + r.total }), { t: 0, c: 0, s: 0, i: 0, tot: 0 });
  return (
    <>
      <PageTitle title="GST invoices" sub={`Latest ${rows.length} invoices · taxable ${formatINR(sum.t)} · CGST ${formatINR(sum.c)} · SGST ${formatINR(sum.s)} · IGST ${formatINR(sum.i)} · total ${formatINR(sum.tot)}`} />
      {rows.length === 0 ? <EmptyState title="No invoices yet">Invoices are generated automatically when a booking is completed.</EmptyState> : (
        <DataTable head={["Invoice", "Date", "Booking", "Customer", "Taxable", "CGST", "SGST", "IGST", "Total", ""]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="font-mono text-xs font-bold">{r.number}</td><td className="text-xs">{r.issuedAt.toLocaleDateString("en-IN")}</td><td className="font-mono text-xs">{r.booking.code}</td>
              <td>{(r.buyer as { name: string }).name}</td><td>{formatINR(r.taxableValue)}</td><td>{formatINR(r.cgst)}</td><td>{formatINR(r.sgst)}</td><td>{formatINR(r.igst)}</td><td className="font-bold">{formatINR(r.total)}</td>
              <td><a className="font-bold underline" href={`/en/invoice/${r.booking.code}`} target="_blank">Open</a></td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
