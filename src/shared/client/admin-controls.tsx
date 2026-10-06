"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Alert, Button, Input, Select, Textarea } from "@/shared/ui";
import { adminChangeStatusAction, assignDriverAction, deleteResourceAction, inviteStaffAction, retryDispatchAction, reviewProviderAction, setCommissionAction, setLeadStatusAction, setUserActiveAction, setUserRoleAction, settleLedgerAction, suspendProviderAction } from "@/modules/admin/actions";
import type { BookingStatus, Role } from "@/generated/prisma/enums";

type R = { ok: boolean; error?: string; message?: string };

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<R>) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      setMsg({ ok: r.ok, text: r.ok ? r.message ?? "Done." : r.error ?? "Failed" });
      if (r.ok) router.refresh();
    });
  return { pending, msg, run };
}
const Msg = ({ msg }: { msg: { ok: boolean; text: string } | null }) => (msg ? <Alert tone={msg.ok ? "ok" : "danger"} className="mt-2">{msg.text}</Alert> : null);

/** Re-fetches server data on an interval (live dispatch board). */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => { if (!document.hidden) router.refresh(); }, seconds * 1000);
    return () => clearInterval(id);
  }, [on, seconds, router]);
  return (
    <button type="button" onClick={() => setOn(!on)} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-bold" aria-pressed={on}>
      <RefreshCw className={on ? "size-4 animate-spin [animation-duration:3s]" : "size-4"} /> Live {on ? `(${seconds}s)` : "paused"}
    </button>
  );
}

export function DeleteButton({ resource, id, label = "Delete" }: { resource: string; id: string; label?: string }) {
  const router = useRouter();
  const { pending, msg, run } = useRun();
  return (
    <div>
      <Button type="button" variant="danger" size="sm" loading={pending} onClick={() => { if (confirm("Delete this item permanently?")) run(async () => { const r = await deleteResourceAction(resource, id); if (r.ok) router.push(`/${location.pathname.split("/")[1]}/admin/manage/${resource}`); return r; }); }}>{label}</Button>
      <Msg msg={msg} />
    </div>
  );
}

export function AssignDriver({ bookingId, drivers }: { bookingId: string; drivers: { id: string; label: string }[] }) {
  const [driverId, setDriverId] = useState("");
  const { pending, msg, run } = useRun();
  return (
    <div className="space-y-2">
      <Select value={driverId} onChange={(e) => setDriverId(e.target.value)} aria-label="Driver">
        <option value="">Select driver…</option>
        {drivers.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
      </Select>
      <Button disabled={!driverId} loading={pending} onClick={() => run(() => assignDriverAction(bookingId, driverId))}>Assign driver</Button>
      <Msg msg={msg} />
    </div>
  );
}

export function BookingStatusControls({ bookingId, allowed }: { bookingId: string; allowed: BookingStatus[] }) {
  const [note, setNote] = useState("");
  const { pending, msg, run } = useRun();
  const label: Partial<Record<BookingStatus, string>> = { CANCELLED: "Cancel booking", PENDING_DISPATCH: "Retry dispatch", EN_ROUTE: "Mark en route", ARRIVED: "Mark arrived", IN_PROGRESS: "Mark in progress", COMPLETED: "Mark completed", NO_DRIVER_FOUND: "Mark no driver" };
  return (
    <div className="space-y-2">
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note / reason (optional)" maxLength={200} />
      <div className="flex flex-wrap gap-2">
        {allowed.filter((s) => label[s] && s !== "ASSIGNED").map((s) => (
          <Button key={s} size="sm" variant={s === "CANCELLED" ? "danger" : "outline"} loading={pending} onClick={() => { if (s === "CANCELLED" && !confirm("Cancel this booking?")) return; run(() => (s === "PENDING_DISPATCH" ? retryDispatchAction(bookingId) : adminChangeStatusAction(bookingId, s, note))); }}>{label[s]}</Button>
        ))}
      </div>
      <Msg msg={msg} />
    </div>
  );
}

export function ProviderReviewControls({ kind, id, status, defaultCommission, commissionPct }: { kind: "COMPANY" | "DRIVER"; id: string; status: string; defaultCommission: number; commissionPct: number | null }) {
  const [note, setNote] = useState("");
  const [pct, setPct] = useState(String(commissionPct ?? defaultCommission));
  const { pending, msg, run } = useRun();
  const pendingReview = status === "PENDING" || status === "REJECTED";
  return (
    <div className="space-y-3">
      {pendingReview && (
        <>
          <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
            <div><label className="text-xs font-bold uppercase text-muted">Commission %</label><Input type="number" step="0.5" min={0} max={60} value={pct} onChange={(e) => setPct(e.target.value)} /></div>
            <div><label className="text-xs font-bold uppercase text-muted">Note to partner (shown on rejection)</label><Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-12" maxLength={300} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button loading={pending} onClick={() => run(() => reviewProviderAction({ kind, id, approve: true, note, commissionPct: Number(pct) }))}>Approve & send agreement</Button>
            {status === "PENDING" && <Button variant="danger" loading={pending} onClick={() => run(() => reviewProviderAction({ kind, id, approve: false, note }))}>Reject</Button>}
          </div>
        </>
      )}
      {["ACTIVE", "SUSPENDED", "APPROVED"].includes(status) && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-28"><label className="text-xs font-bold uppercase text-muted">Commission %</label><Input type="number" step="0.5" min={0} max={60} value={pct} onChange={(e) => setPct(e.target.value)} /></div>
          <Button size="sm" variant="outline" loading={pending} onClick={() => run(() => setCommissionAction(kind, id, Number(pct)))}>Update commission</Button>
          {status !== "APPROVED" && <Button size="sm" variant={status === "SUSPENDED" ? "primary" : "danger"} loading={pending} onClick={() => run(() => suspendProviderAction(kind, id, status !== "SUSPENDED"))}>{status === "SUSPENDED" ? "Reactivate" : "Suspend"}</Button>}
        </div>
      )}
      <Msg msg={msg} />
    </div>
  );
}

export function SettleLedger({ entries }: { entries: { id: string; label: string; amount: string }[] }) {
  const [sel, setSel] = useState<string[]>([]);
  const [ref, setRef] = useState("");
  const { pending, msg, run } = useRun();
  if (!entries.length) return <p className="text-muted">Nothing pending.</p>;
  return (
    <div className="space-y-3">
      <ul className="max-h-72 divide-y divide-line overflow-auto rounded-xl border border-line bg-surface">
        {entries.map((e) => (
          <li key={e.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-brand-faint">
              <input type="checkbox" className="size-4 accent-black" checked={sel.includes(e.id)} onChange={() => setSel(sel.includes(e.id) ? sel.filter((x) => x !== e.id) : [...sel, e.id])} />
              <span className="flex-1 text-sm">{e.label}</span><b>{e.amount}</b>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setSel(sel.length === entries.length ? [] : entries.map((e) => e.id))}>{sel.length === entries.length ? "Clear" : "Select all"}</Button>
        <Input className="max-w-xs" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Payout reference (UTR / batch id)" />
        <Button disabled={!sel.length} loading={pending} onClick={() => run(async () => { const r = await settleLedgerAction(sel, ref); if (r.ok) setSel([]); return r; })}>Mark {sel.length || ""} settled</Button>
      </div>
      <Msg msg={msg} />
    </div>
  );
}

export function UserControls({ userId, role, active, canChangeRole, self }: { userId: string; role: Role; active: boolean; canChangeRole: boolean; self: boolean }) {
  const { pending, run } = useRun();
  if (self) return <span className="text-xs text-muted">you</span>;
  const staffRoles: Role[] = ["CUSTOMER", "DISPATCHER", "ADMIN", "SUPER_ADMIN"];
  return (
    <div className="flex items-center gap-2">
      {canChangeRole && ["CUSTOMER", "DISPATCHER", "ADMIN", "SUPER_ADMIN"].includes(role) && (
        <Select className="!h-9 !w-36 !text-sm" value={role} disabled={pending} onChange={(e) => run(() => setUserRoleAction(userId, e.target.value as Role))} aria-label="Role">{staffRoles.map((r) => <option key={r}>{r}</option>)}</Select>
      )}
      <Button size="sm" variant="outline" loading={pending} onClick={() => run(() => setUserActiveAction(userId, !active))}>{active ? "Disable" : "Enable"}</Button>
    </div>
  );
}

export function InviteStaff() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("DISPATCHER");
  const { pending, msg, run } = useRun();
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-56 flex-1"><label className="text-xs font-bold uppercase text-muted">Staff email</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dispatcher@company.com" /></div>
      <div className="w-40"><label className="text-xs font-bold uppercase text-muted">Role</label><Select value={role} onChange={(e) => setRole(e.target.value as Role)}><option>DISPATCHER</option><option>ADMIN</option></Select></div>
      <Button loading={pending} disabled={!email} onClick={() => run(async () => { const r = await inviteStaffAction(email, role); if (r.ok) setEmail(""); return r; })}>Add staff</Button>
      <div className="w-full"><Msg msg={msg} /></div>
    </div>
  );
}

export function LeadStatus({ id, status }: { id: string; status: string }) {
  const { pending, run } = useRun();
  return (
    <Select className="!h-9 !w-36 !text-sm" value={status} disabled={pending} aria-label="Lead status" onChange={(e) => run(() => setLeadStatusAction(id, e.target.value as "NEW" | "CONTACTED" | "CLOSED"))}>
      <option>NEW</option><option>CONTACTED</option><option>CLOSED</option>
    </Select>
  );
}
