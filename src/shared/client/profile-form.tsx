"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/modules/auth/actions";
import { Alert, Button, Field, Input } from "@/shared/ui";

export function ProfileForm({ name, email, phone, labels }: { name: string; email: string; phone: string; labels: { name: string; email: string; phone: string; save: string; saved: string } }) {
  const [value, setValue] = useState(name);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await updateProfileAction({ name: value }); setMsg(r.ok ? { ok: true, text: labels.saved } : { ok: false, text: r.error }); }); }}>
      <Field label={labels.name}><Input value={value} onChange={(e) => setValue(e.target.value)} required minLength={2} maxLength={80} /></Field>
      <Field label={labels.email}><Input value={email} readOnly disabled /></Field>
      <Field label={labels.phone}><Input value={phone} readOnly disabled /></Field>
      {msg && <Alert tone={msg.ok ? "ok" : "danger"}>{msg.text}</Alert>}
      <Button type="submit" loading={pending} className="justify-self-start">{labels.save}</Button>
    </form>
  );
}
