"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { requestOtpAction, verifyOtpAction } from "@/modules/auth/actions";
import { Alert, Button, Field, Input } from "@/shared/ui";
import type { Dict } from "@/i18n";
import { fmt } from "@/shared/lib/localized";

type Props = {
  locale: "en" | "hi";
  d: Dict["auth"];
  next?: string;
  /** Pre-filled & locked identifier (e.g. the phone entered during booking). */
  identifier?: string;
  /** When set, stays on the page after success instead of redirecting. */
  onVerified?: () => void;
  askName?: boolean;
};

export function OtpLogin({ locale, d, next, identifier: fixed, onVerified, askName }: Props) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(fixed ?? "");
  const [sent, setSent] = useState<{ to: string; devCode?: string } | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function send() {
    setError(null);
    start(async () => {
      const r = await requestOtpAction(identifier);
      if (!r.ok) return setError(r.error);
      setSent({ to: r.data!.identifier, devCode: r.data!.devCode });
      setCooldown(30);
    });
  }

  function verify() {
    setError(null);
    start(async () => {
      const r = await verifyOtpAction({ identifier: sent!.to, code, locale, next, name: name || undefined });
      if (!r.ok) return setError(r.error);
      if (onVerified) return onVerified();
      router.push(r.data!.redirectTo);
      router.refresh();
    });
  }

  if (!sent)
    return (
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Field label={d.idLabel}>
          <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={d.idPlaceholder} autoComplete="username" inputMode="email" required readOnly={Boolean(fixed)} autoFocus={!fixed} />
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" size="lg" loading={pending}>{d.sendCode}</Button>
      </form>
    );

  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); verify(); }}>
      <Alert tone="info">{fmt(d.sentTo, { to: sent.to })}</Alert>
      {sent.devCode && (
        <Alert tone="warn">
          {d.devHint} <b className="font-mono text-lg tracking-widest" data-testid="dev-otp">{sent.devCode}</b>
        </Alert>
      )}
      <Field label={d.codeLabel}>
        <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} className="text-center font-mono text-2xl tracking-[0.5em]" required autoFocus />
      </Field>
      {askName && (
        <Field label={d.nameLabel}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
        </Field>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" size="lg" loading={pending} disabled={code.length !== 6}>{d.verify}</Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
        <button type="button" className="underline disabled:no-underline disabled:opacity-50" disabled={cooldown > 0 || pending} onClick={send}>
          {d.resend}{cooldown > 0 ? ` (${cooldown}s)` : ""}
        </button>
        {!fixed && <button type="button" className="underline" onClick={() => { setSent(null); setCode(""); setError(null); }}>{d.change}</button>}
      </div>
    </form>
  );
}
