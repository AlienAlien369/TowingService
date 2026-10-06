"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitLeadAction } from "@/modules/content/actions";
import { Alert, Button, Field, Input, Textarea } from "@/shared/ui";

type Kind = "CONTACT" | "CALLBACK" | "PARTNER_INQUIRY" | "COMING_SOON_AREA";

/** One lead form for contact, call-back and "notify me" use-cases. */
export function LeadForm({ kind, meta, labels, withMessage, withEmail = true, compact }: {
  kind: Kind;
  meta?: Record<string, string>;
  labels: { name: string; phone: string; email: string; message: string; submit: string; sent: string };
  withMessage?: boolean;
  withEmail?: boolean;
  compact?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done)
    return (
      <Alert tone="ok" title={<span className="inline-flex items-center gap-2"><CheckCircle2 className="size-5" /> {labels.sent}</span>} />
    );

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const r = await submitLeadAction({ kind, meta, name: f.get("name"), phone: f.get("phone"), email: f.get("email") || undefined, message: f.get("message") || undefined, website: f.get("website") });
          if (r.ok) setDone(true);
          else setError(r.error);
        });
      }}
    >
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
        <Field label={labels.name}><Input name="name" autoComplete="name" required maxLength={80} /></Field>
        <Field label={labels.phone}><Input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" required={!withEmail} /></Field>
      </div>
      {withEmail && <Field label={labels.email}><Input name="email" type="email" autoComplete="email" /></Field>}
      {withMessage && <Field label={labels.message}><Textarea name="message" required minLength={5} maxLength={2000} /></Field>}
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" loading={pending}>{labels.submit}</Button>
    </form>
  );
}
