import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { db } from "@/shared/lib/db";
import { formatINR } from "@/shared/lib/utils";
import { PrintButton } from "@/shared/client/print-button";
import { Container } from "@/shared/ui";
import type { InvoiceLine } from "@/modules/invoicing/service";

type Props = { params: Promise<{ locale: string; code: string }> };

export const metadata: Metadata = { title: "Tax invoice", robots: { index: false, follow: false } };

const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** GST tax invoice. The booking code acts as the bearer secret (same model as the tracking link). */
export default async function InvoicePage({ params }: Props) {
  const { code } = await params;
  await loadLocale(params);
  if (!/^[A-Za-z0-9-]{4,20}$/.test(code)) notFound();
  const booking = await db.booking.findUnique({ where: { code: code.toUpperCase() }, include: { invoice: true } });
  const inv = booking?.invoice;
  if (!booking || !inv) notFound();
  const seller = inv.seller as { legalName: string; gstin: string; pan: string; cin?: string; address: string; stateName: string; stateCode: string; phone: string; email: string; footer: string };
  const buyer = inv.buyer as { name: string; phone: string; email?: string | null; address: string; stateName: string; stateCode: string; gstin?: string };
  const lines = inv.lineItems as unknown as InvoiceLine[];
  const intra = inv.igst === 0;
  const rate = booking.subtotal > 0 ? Math.round((booking.gstAmount / booking.subtotal) * 1000) / 10 : 0;

  return (
    <Container className="max-w-4xl py-8">
      <div className="no-print mb-4 flex justify-end"><PrintButton label="Print / Save as PDF" /></div>
      <article className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10 print:border-0 print:p-0 print:shadow-none" aria-label="Tax invoice">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-5">
          <div>
            <h1 className="text-4xl font-extrabold uppercase leading-none">Tax Invoice</h1>
            <p className="mt-1 font-mono text-sm font-bold">{inv.number}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Date: {fmtDate(inv.issuedAt)}</p>
            <p>Booking: <span className="font-mono">{booking.code}</span></p>
            <p>Payment: {booking.paymentMethod === "CASH" ? "Cash / UPI to driver" : "Online"} · {booking.paymentStatus}</p>
          </div>
        </header>
        <section className="grid gap-6 py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Supplier</p>
            <p className="text-base font-extrabold">{seller.legalName}</p>
            <p>{seller.address}</p>
            <p><b>GSTIN:</b> {seller.gstin} · <b>PAN:</b> {seller.pan}</p>
            <p><b>State:</b> {seller.stateName} ({seller.stateCode})</p>
            <p>{seller.email} · {seller.phone}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Billed to</p>
            <p className="text-base font-extrabold">{buyer.name}</p>
            <p>{buyer.address}</p>
            <p>{buyer.phone}{buyer.email ? ` · ${buyer.email}` : ""}</p>
            <p><b>Place of supply:</b> {inv.placeOfSupply}</p>
          </div>
        </section>
        <table className="w-full text-left text-sm">
          <thead className="bg-ink text-xs uppercase tracking-wider text-white">
            <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Description</th><th className="px-3 py-2">SAC</th><th className="px-3 py-2 text-right">Taxable value</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {lines.map((l, i) => (
              <tr key={i}><td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2">{l.description}</td><td className="px-3 py-2">{inv.sacCode}</td><td className="px-3 py-2 text-right">{formatINR(l.amount, { decimals: true })}</td></tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt>Taxable value</dt><dd>{formatINR(inv.taxableValue, { decimals: true })}</dd></div>
          {intra ? (
            <>
              <div className="flex justify-between"><dt>CGST @ {rate / 2}%</dt><dd>{formatINR(inv.cgst, { decimals: true })}</dd></div>
              <div className="flex justify-between"><dt>SGST @ {rate / 2}%</dt><dd>{formatINR(inv.sgst, { decimals: true })}</dd></div>
            </>
          ) : (
            <div className="flex justify-between"><dt>IGST @ {rate}%</dt><dd>{formatINR(inv.igst, { decimals: true })}</dd></div>
          )}
          <div className="flex justify-between border-t-2 border-ink pt-2 text-lg font-extrabold"><dt>Total</dt><dd>{formatINR(inv.total, { decimals: true })}</dd></div>
        </dl>
        <footer className="mt-8 border-t border-line pt-4 text-xs text-muted">
          <p>{seller.footer}</p>
          <p className="mt-1">Reverse charge: No · Services provided through the {seller.legalName} platform by an independent service partner.</p>
        </footer>
      </article>
    </Container>
  );
}
