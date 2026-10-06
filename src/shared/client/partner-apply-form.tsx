"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { applyCompanyAction, applyDriverAction } from "@/modules/providers/actions";
import { Alert, Button, Card, Field, Input, Select, Textarea } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import type { Dict } from "@/i18n";
import { trackClient } from "./track";

type Opt = { id: string; name: string };
const KINDS = [["FLATBED", "Flatbed"], ["WHEEL_LIFT", "Wheel-lift"], ["HOOK_CRANE", "Hook / crane"], ["HYDRAULIC_HEAVY", "Hydraulic heavy recovery"], ["BIKE_CARRIER", "Bike carrier"], ["SERVICE_VAN", "Service van"]];

function Checks({ options, value, onChange, legend }: { options: Opt[]; value: string[]; onChange: (v: string[]) => void; legend: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">{legend} <span className="text-danger">*</span></legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <label key={o.id} className={cn("cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-bold transition", on ? "border-ink bg-brand" : "border-line hover:border-ink/40")}>
              <input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== o.id) : [...value, o.id])} />
              {o.name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PartnerApplyForm({ type, locale, d, vehicles, services, defaults }: { type: "driver" | "company"; locale: string; d: Dict; vehicles: Opt[]; services: Opt[]; defaults: { name: string; email: string; phone: string } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [vt, setVt] = useState<string[]>([]);
  const [sv, setSv] = useState<string[]>([]);
  useEffect(() => trackClient("partner_apply_started", { type }), [type]);

  if (done)
    return (
      <Card className="p-8 text-center">
        <h2 className="text-5xl font-extrabold uppercase">{d.partner.applySubmitted}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">{d.partner.applySubmittedSub}</p>
        <Button size="lg" className="mt-5" onClick={() => router.push(`/${locale}/${type === "company" ? "partner-portal" : "driver"}`)}>{d.partner.goToPortal}</Button>
      </Card>
    );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const g = (k: string) => String(f.get(k) ?? "").trim();
        setError(null);
        start(async () => {
          const payout = { upiId: g("upiId"), bankAccountName: g("bankAccountName"), bankAccountNo: g("bankAccountNo"), bankIfsc: g("bankIfsc") };
          const r = type === "driver"
            ? await applyDriverAction({ name: g("name"), phone: g("phone"), email: g("email"), licenseNo: g("licenseNo"), licenseExpiry: g("licenseExpiry") || undefined, pan: g("pan"), address: g("address"), vehicleTypeIds: vt, serviceIds: sv, truck: { registrationNo: g("registrationNo"), kind: g("kind"), make: g("make"), model: g("model"), capacityKg: g("capacityKg") || undefined }, ...payout })
            : await applyCompanyAction({ legalName: g("legalName"), tradeName: g("tradeName"), gstin: g("gstin"), pan: g("pan"), address: g("address"), contactEmail: g("email"), contactPhone: g("phone"), ...payout });
          if (r.ok) setDone(true);
          else setError(r.error);
        });
      }}
    >
      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="text-3xl font-extrabold uppercase">{type === "driver" ? "Your details" : "Company details"}</h2>
        {type === "company" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company legal name" required><Input name="legalName" required maxLength={120} /></Field>
              <Field label="Trade / brand name"><Input name="tradeName" maxLength={120} /></Field>
              <Field label="GSTIN" help="15 characters, if registered"><Input name="gstin" maxLength={15} className="uppercase" /></Field>
              <Field label="Company PAN"><Input name="pan" maxLength={10} className="uppercase" /></Field>
            </div>
            <Field label="Registered address" required><Textarea name="address" required maxLength={300} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Contact email" required><Input name="email" type="email" defaultValue={defaults.email} required /></Field>
              <Field label="Contact mobile" required><Input name="phone" type="tel" defaultValue={defaults.phone} placeholder="98XXXXXXXX" required /></Field>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={d.common.name} required><Input name="name" defaultValue={defaults.name} required maxLength={80} /></Field>
              <Field label={d.common.phone} required><Input name="phone" type="tel" defaultValue={defaults.phone} placeholder="98XXXXXXXX" required /></Field>
              <Field label={d.common.email} required><Input name="email" type="email" defaultValue={defaults.email} required /></Field>
              <Field label="PAN"><Input name="pan" maxLength={10} className="uppercase" /></Field>
              <Field label="Driving licence no." required><Input name="licenseNo" required maxLength={25} className="uppercase" /></Field>
              <Field label="Licence expiry"><Input name="licenseExpiry" type="date" /></Field>
            </div>
            <Field label={d.common.address} required><Textarea name="address" required maxLength={300} /></Field>
          </>
        )}
      </Card>

      {type === "driver" && (
        <>
          <Card className="space-y-4 p-5 sm:p-6">
            <h2 className="text-3xl font-extrabold uppercase">Your tow truck</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Registration number" required><Input name="registrationNo" required placeholder="DL1LAB1234" className="uppercase" maxLength={14} /></Field>
              <Field label="Type" required>
                <Select name="kind" defaultValue="FLATBED">{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
              </Field>
              <Field label="Make"><Input name="make" placeholder="Tata" /></Field>
              <Field label="Model"><Input name="model" placeholder="LPT 407" /></Field>
              <Field label="Capacity (kg)"><Input name="capacityKg" type="number" min={0} max={100000} /></Field>
            </div>
            <Checks legend="Vehicles you can tow" options={vehicles} value={vt} onChange={setVt} />
            <Checks legend="Services you offer" options={services} value={sv} onChange={setSv} />
          </Card>
        </>
      )}

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="text-3xl font-extrabold uppercase">Payouts</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="UPI ID"><Input name="upiId" placeholder="name@bank" /></Field>
          <Field label="Account holder name"><Input name="bankAccountName" /></Field>
          <Field label="Bank account number"><Input name="bankAccountNo" inputMode="numeric" /></Field>
          <Field label="IFSC"><Input name="bankIfsc" className="uppercase" maxLength={11} /></Field>
        </div>
        <p className="text-xs text-muted">You can add or change payout details later from your dashboard.</p>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" size="lg" loading={pending} disabled={type === "driver" && (!vt.length || !sv.length)} className="w-full sm:w-auto">{d.common.submit}</Button>
    </form>
  );
}
