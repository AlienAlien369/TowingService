"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { firebaseConfigAction, firebaseLoginAction, requestOtpAction, verifyOtpAction, type FirebaseWebConfig } from "@/modules/auth/actions";
import { Alert, Button, Field, Input } from "@/shared/ui";
import type { Dict } from "@/i18n";
import { fmt } from "@/shared/lib/localized";
import { normalizePhone } from "@/shared/lib/utils";

type Props = {
  locale: "en" | "hi";
  d: Dict["auth"];
  next?: string;
  /** Pre-filled & locked identifier (e.g. the phone entered during booking). */
  identifier?: string;
  /** When set, stays on the page after success instead of redirecting. */
  onVerified?: () => void;
  askName?: boolean;
  /** Optional fallback address (e.g. the booking email) the code can be sent to instead. */
  altIdentifier?: string;
  altLabel?: string;
};

type Sent = { to: string; devCode?: string; via: "server" | "firebase" };

/**
 * One-time-code sign-in. Phone numbers go through Firebase Phone Auth when it's configured;
 * if that can't deliver an SMS (or isn't configured) the code is emailed instead when an email is available.
 */
export function OtpLogin({ locale, d, next, identifier: fixed, onVerified, askName, altIdentifier, altLabel }: Props) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(fixed ?? "");
  const [sent, setSent] = useState<Sent | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [cooldown, setCooldown] = useState(0);
  const [fb, setFb] = useState<FirebaseWebConfig | null>(null);
  const confirmation = useRef<ConfirmationResult | null>(null);
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const captchaHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    firebaseConfigAction().then((c) => live && setFb(c)).catch(() => undefined);
    return () => {
      live = false;
      verifier.current?.clear();
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendViaFirebase(cfg: FirebaseWebConfig, e164: string) {
    const [{ getApp, getApps, initializeApp }, { getAuth, RecaptchaVerifier: Recaptcha, signInWithPhoneNumber }] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
    const auth = getAuth(getApps().length ? getApp() : initializeApp(cfg));
    auth.languageCode = locale;
    verifier.current?.clear();
    const host = captchaHost.current;
    if (!host) throw new Error("captcha host missing");
    host.innerHTML = "";
    const el = document.createElement("div");
    host.appendChild(el);
    verifier.current = new Recaptcha(auth, el, { size: "invisible" });
    confirmation.current = await signInWithPhoneNumber(auth, e164, verifier.current);
  }

  async function sendViaServer(to: string, notif?: string) {
    const r = await requestOtpAction(to);
    if (!r.ok) return setError(r.error);
    setIdentifier(to);
    setSent({ to: r.data!.identifier, devCode: r.data!.devCode, via: "server" });
    setNotice(notif ?? null);
    setCooldown(30);
  }

  function send(to = identifier) {
    setError(null);
    setNotice(null);
    start(async () => {
      const e164 = fb && !to.includes("@") ? normalizePhone(to) : null;
      if (fb && e164) {
        try {
          await sendViaFirebase(fb, e164);
          setSent({ to: e164, via: "firebase" });
          setCooldown(30);
          return;
        } catch {
          // Firebase couldn't deliver (quota, billing, reCAPTCHA, network…): fall back to an emailed code.
          if (altIdentifier) return sendViaServer(altIdentifier, d.smsFailedEmailSent);
          return setError(d.smsFailed);
        }
      }
      await sendViaServer(to);
    });
  }

  function sendAlt() {
    setCode("");
    send(altIdentifier);
  }

  function verify() {
    setError(null);
    start(async () => {
      let r;
      if (sent!.via === "firebase") {
        try {
          const cred = await confirmation.current!.confirm(code);
          r = await firebaseLoginAction({ idToken: await cred.user.getIdToken(), locale, next, name: name || undefined });
        } catch {
          return setError(d.wrongCode);
        }
      } else {
        r = await verifyOtpAction({ identifier: sent!.to, code, locale, next, name: name || undefined });
      }
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
        {altIdentifier && <button type="button" className="text-sm font-semibold underline" disabled={pending} onClick={sendAlt}>{altLabel}</button>}
        <div ref={captchaHost} />
      </form>
    );

  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); verify(); }}>
      <Alert tone="info">{fmt(d.sentTo, { to: sent.to })}</Alert>
      {notice && <Alert tone="warn">{notice}</Alert>}
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
        <button type="button" className="underline disabled:no-underline disabled:opacity-50" disabled={cooldown > 0 || pending} onClick={() => send(sent.to)}>
          {d.resend}{cooldown > 0 ? ` (${cooldown}s)` : ""}
        </button>
        {altIdentifier && sent.to !== altIdentifier && <button type="button" className="underline" disabled={pending} onClick={sendAlt}>{altLabel}</button>}
        {!fixed && <button type="button" className="underline" onClick={() => { setSent(null); setCode(""); setError(null); setNotice(null); }}>{d.change}</button>}
      </div>
      <div ref={captchaHost} />
    </form>
  );
}
