"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addTruckAction, companyAddDriverAction, companyRemoveDriverAction, updateCapabilitiesAction, updatePayoutAction } from "@/modules/providers/actions";
import { Alert, Button, Field, Input, Select } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

function useAct() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, reset?: () => void) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.message ?? "Saved." } : { ok: false, text: r.error ?? "Failed" });
      if (r.ok) {
        reset?.();
        router.refresh();
      }
    });
  return { pending, msg, run };
}

const Msg = ({ msg }: { msg: { ok: boolean; text: string } | null }) => (msg ? <Alert tone={msg.ok ? "ok" : "danger"}>{msg.text}</Alert> : null);

export function PayoutForm({ initial }: { initial: { upiId: string; bankAccountName: string; bankAccountNo: string; bankIfsc: string } }) {
  const { pending, msg, run } = useAct();
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(() => updatePayoutAction({ upiId: String(f.get("upiId")), bankAccountName: String(f.get("bankAccountName")), bankAccountNo: String(f.get("bankAccountNo")), bankIfsc: String(f.get("bankIfsc")) })); }}>
      <Field label="UPI ID"><Input name="upiId" defaultValue={initial.upiId} placeholder="name@bank" /></Field>
      <Field label="Account holder"><Input name="bankAccountName" defaultValue={initial.bankAccountName} /></Field>
      <Field label="Account number"><Input name="bankAccountNo" defaultValue={initial.bankAccountNo} inputMode="numeric" /></Field>
      <Field label="IFSC"><Input name="bankIfsc" defaultValue={initial.bankIfsc} className="uppercase" maxLength={11} /></Field>
      <div className="space-y-3 sm:col-span-2"><Msg msg={msg} /><Button type="submit" loading={pending}>Save payout details</Button></div>
    </form>
  );
}

export function CapabilitiesForm({ vehicles, services, vehicleIds, serviceIds }: { vehicles: { id: string; name: string }[]; services: { id: string; name: string }[]; vehicleIds: string[]; serviceIds: string[] }) {
  const { pending, msg, run } = useAct();
  const [vt, setVt] = useState(vehicleIds);
  const [sv, setSv] = useState(serviceIds);
  const chips = (opts: { id: string; name: string }[], val: string[], set: (v: string[]) => void) => (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => {
        const on = val.includes(o.id);
        return (
          <label key={o.id} className={cn("cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-bold", on ? "border-ink bg-brand" : "border-line")}>
            <input type="checkbox" className="sr-only" checked={on} onChange={() => set(on ? val.filter((x) => x !== o.id) : [...val, o.id])} />
            {o.name}
          </label>
        );
      })}
    </div>
  );
  return (
    <div className="space-y-4">
      <div><p className="mb-1.5 text-sm font-bold">Vehicles I can tow</p>{chips(vehicles, vt, setVt)}</div>
      <div><p className="mb-1.5 text-sm font-bold">Services I offer</p>{chips(services, sv, setSv)}</div>
      <Msg msg={msg} />
      <Button loading={pending} onClick={() => run(() => updateCapabilitiesAction(vt, sv))}>Save</Button>
    </div>
  );
}

const KINDS = [["FLATBED", "Flatbed"], ["WHEEL_LIFT", "Wheel-lift"], ["HOOK_CRANE", "Hook / crane"], ["HYDRAULIC_HEAVY", "Hydraulic heavy recovery"], ["BIKE_CARRIER", "Bike carrier"], ["SERVICE_VAN", "Service van"]];

export function TruckForm() {
  const { pending, msg, run } = useAct();
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); run(() => addTruckAction({ registrationNo: String(f.get("registrationNo")), kind: String(f.get("kind")), make: String(f.get("make")), model: String(f.get("model")), capacityKg: f.get("capacityKg") ? Number(f.get("capacityKg")) : undefined }), () => form.reset()); }}>
      <Field label="Registration no." required><Input name="registrationNo" required className="uppercase" placeholder="DL1LAB1234" /></Field>
      <Field label="Type"><Select name="kind" defaultValue="FLATBED">{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
      <Field label="Make"><Input name="make" /></Field>
      <Field label="Model"><Input name="model" /></Field>
      <Field label="Capacity (kg)"><Input name="capacityKg" type="number" min={0} /></Field>
      <div className="space-y-3 sm:col-span-2"><Msg msg={msg} /><Button type="submit" loading={pending}>Add vehicle</Button></div>
    </form>
  );
}

export function AddDriverForm() {
  const { pending, msg, run } = useAct();
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); run(() => companyAddDriverAction({ name: String(f.get("name")), phone: String(f.get("phone")), email: String(f.get("email")), licenseNo: String(f.get("licenseNo")) }), () => form.reset()); }}>
      <Field label="Driver name" required><Input name="name" required /></Field>
      <Field label="Mobile" required><Input name="phone" type="tel" required placeholder="98XXXXXXXX" /></Field>
      <Field label="Email" required help="The driver signs in with this email (one-time code)."><Input name="email" type="email" required /></Field>
      <Field label="Licence no." required><Input name="licenseNo" required className="uppercase" /></Field>
      <div className="space-y-3 sm:col-span-2"><Msg msg={msg} /><Button type="submit" loading={pending}>Add driver & send invite</Button></div>
    </form>
  );
}

export function RemoveDriverButton({ driverId }: { driverId: string }) {
  const { pending, run } = useAct();
  return <Button size="sm" variant="outline" loading={pending} onClick={() => { if (confirm("Remove this driver from your fleet? They will no longer receive jobs.")) run(() => companyRemoveDriverAction(driverId)); }}>Remove</Button>;
}
