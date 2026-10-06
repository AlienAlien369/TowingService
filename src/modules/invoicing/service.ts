import "server-only";
import { db } from "@/shared/lib/db";
import { indianFinancialYear } from "@/shared/lib/utils";
import { getBrand, getSetting } from "@/modules/settings/service";
import { splitGst, type Quote } from "@/modules/pricing/engine";

/** State where the service is performed (Delhi). Seller in Delhi => CGST+SGST, otherwise IGST. */
const PLACE_OF_SUPPLY = { name: "Delhi", code: "07" };

export type InvoiceLine = { description: string; amount: number }; // paise, taxable

/** Idempotent: returns the existing invoice if one was already issued for the booking. */
export async function issueInvoice(bookingId: string) {
  const existing = await db.invoice.findUnique({ where: { bookingId } });
  if (existing) return existing;

  const [booking, biz, brand] = await Promise.all([
    db.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { service: true, vehicleType: true } }),
    getSetting("business"),
    getBrand(),
  ]);
  const q = booking.fare as unknown as Quote;
  const fy = indianFinancialYear();
  const svc = (booking.service.name as { en: string }).en;
  const veh = (booking.vehicleType.name as { en: string }).en;

  const lines: InvoiceLine[] = [{ description: `${svc} – ${veh}: base fare`, amount: q.baseFare }];
  if (q.distanceCharge) lines.push({ description: `Distance charge (${q.billableKm} km beyond included)`, amount: q.distanceCharge });
  if (q.minFareTopUp) lines.push({ description: "Minimum fare adjustment", amount: q.minFareTopUp });
  if (q.nightSurcharge) lines.push({ description: "Night service surcharge", amount: q.nightSurcharge });
  if (q.surgeSurcharge) lines.push({ description: "High-demand surcharge", amount: q.surgeSurcharge });
  const diff = booking.subtotal - lines.reduce((s, l) => s + l.amount, 0);
  if (diff !== 0) lines.push({ description: "Rounding", amount: diff });

  const intra = biz.stateCode === PLACE_OF_SUPPLY.code;
  const tax = splitGst(booking.gstAmount, intra);

  return db.$transaction(async (tx) => {
    const counter = await tx.invoiceCounter.upsert({ where: { fy }, create: { fy, seq: 1 }, update: { seq: { increment: 1 } } });
    const number = `${biz.invoicePrefix}/${fy}/${String(counter.seq).padStart(6, "0")}`;
    return tx.invoice.create({
      data: {
        number,
        bookingId,
        sacCode: biz.sacCode,
        placeOfSupply: `${PLACE_OF_SUPPLY.name} (${PLACE_OF_SUPPLY.code})`,
        seller: { legalName: biz.legalName || brand.name, gstin: biz.gstin, pan: biz.pan, cin: biz.cin, address: `${brand.addressLine}, ${brand.city}, ${brand.state} ${brand.pincode}`, stateName: biz.stateName, stateCode: biz.stateCode, phone: brand.phone, email: brand.email, footer: biz.invoiceFooter, brand: brand.name },
        buyer: { name: booking.contactName, phone: booking.contactPhone, email: booking.contactEmail, address: booking.pickupAddress, stateName: PLACE_OF_SUPPLY.name, stateCode: PLACE_OF_SUPPLY.code },
        lineItems: lines,
        taxableValue: booking.subtotal,
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        total: booking.total,
      },
    });
  });
}
