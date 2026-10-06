"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileSignature } from "lucide-react";
import { requestContractOtpAction, signContractAction } from "@/modules/providers/actions";
import { Alert, Button, Field, Input } from "@/shared/ui";

/** E-signature: type your name + confirm with a one-time code emailed to the registered address. */
export function ContractSign({ contractId, email, signerName }: { contractId: string; email: string; signerName: string }) {
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState<{ devCode?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4 rounded-2xl border-2 border-ink bg-brand-faint p-5">
      <h3 className="flex items-center gap-2 text-3xl font-extrabold uppercase"><FileSignature className="size-7" /> Sign this agreement</h3>
      <label className="flex items-start gap-3 font-semibold">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-5 accent-black" />
        I have read and agree to the terms above, and I'm authorised to sign for {signerName}.
      </label>
      <Field label={`Type your full name (“${signerName}”)`} required>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={signerName} autoComplete="off" />
      </Field>
      {!sent ? (
        <Button variant="dark" disabled={!agree || name.trim().length < 3} loading={pending} onClick={() => start(async () => {
          setError(null);
          const r = await requestContractOtpAction(contractId);
          if (!r.ok) return setError(r.error);
          setSent({ devCode: r.data?.devCode });
        })}>Email me a confirmation code</Button>
      ) : (
        <div className="space-y-3">
          <Alert tone="info">We emailed a 6-digit code to <b>{email}</b>.</Alert>
          {sent.devCode && <Alert tone="warn">Demo mode: your code is <b className="font-mono text-lg tracking-widest">{sent.devCode}</b></Alert>}
          <Field label="6-digit code" required>
            <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} className="text-center font-mono text-2xl tracking-[0.5em]" />
          </Field>
          <Button size="lg" loading={pending} disabled={code.length !== 6} onClick={() => start(async () => {
            setError(null);
            const r = await signContractAction(contractId, name, code);
            if (!r.ok) return setError(r.error);
            router.refresh();
          })}>Sign & activate my account</Button>
        </div>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      <p className="text-xs text-muted">Your typed name, the time, IP address and email-OTP confirmation are recorded as your electronic signature under the Information Technology Act, 2000.</p>
    </div>
  );
}
