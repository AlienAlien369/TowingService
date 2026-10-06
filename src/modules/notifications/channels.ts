import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { db } from "@/shared/lib/db";
import { env } from "@/shared/lib/env";
import { getSettings } from "@/modules/settings/service";

// ─────────────────────────── EMAIL (SMTP; Mailpit locally) ───────────────────────────
let transporter: Transporter | null = null;
function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    connectionTimeout: 8000,
    socketTimeout: 12000,
  });
  return transporter;
}

export type EmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  template: string;
  bookingId?: string;
};

export async function sendEmail(input: EmailInput): Promise<boolean> {
  const s = await getSettings();
  const fromName = s.notifications.fromName || s.brand.name;
  const fromAddr = s.notifications.fromEmail || env.smtp.from || s.contact.email;
  const recipients = (Array.isArray(input.to) ? input.to : [input.to]).filter(Boolean);
  let ok = true;
  for (const to of recipients) {
    let error: string | undefined;
    try {
      await getTransporter().sendMail({
        from: `"${fromName.replace(/"/g, "")}" <${fromAddr}>`,
        to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
    } catch (e) {
      ok = false;
      error = (e as Error).message;
      console.error(`[email] failed to ${to}:`, error);
    }
    await db.notificationLog
      .create({
        data: {
          channel: "EMAIL",
          to,
          template: input.template,
          subject: input.subject,
          body: input.template === "otp" ? "[redacted verification code]" : input.text.slice(0, 4000),
          status: error ? "FAILED" : "SENT",
          provider: "smtp",
          error,
          bookingId: input.bookingId,
        },
      })
      .catch(() => {});
  }
  return ok;
}

// ─────────────────────────── SMS (mock | MSG91) ───────────────────────────
export type SmsInput = { to: string; text: string; template: string; otp?: string; bookingId?: string };

async function sendViaMsg91(input: SmsInput): Promise<void> {
  const { authKey, senderId, otpTemplateId } = env.msg91;
  if (!authKey) throw new Error("MSG91_AUTH_KEY missing");
  const mobile = input.to.replace(/^\+/, "");
  if (input.otp) {
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("template_id", otpTemplateId);
    url.searchParams.set("mobile", mobile);
    url.searchParams.set("authkey", authKey);
    url.searchParams.set("otp", input.otp);
    if (senderId) url.searchParams.set("sender", senderId);
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    if (!res.ok) throw new Error(`MSG91 OTP ${res.status}: ${await res.text()}`);
    return;
  }
  // Transactional SMS must use a DLT-approved flow template with one variable (VAR1 = message).
  const flowId = process.env.MSG91_FLOW_TEMPLATE_ID;
  if (!flowId) throw new Error("MSG91_FLOW_TEMPLATE_ID missing (needed for non-OTP SMS)");
  const res = await fetch("https://control.msg91.com/api/v5/flow", {
    method: "POST",
    headers: { authkey: authKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ template_id: flowId, short_url: 0, recipients: [{ mobiles: mobile, VAR1: input.text }] }),
  });
  if (!res.ok) throw new Error(`MSG91 flow ${res.status}: ${await res.text()}`);
}

export async function sendSms(input: SmsInput): Promise<boolean> {
  const provider = env.smsProvider;
  let error: string | undefined;
  try {
    if (provider === "msg91") await sendViaMsg91(input);
    else console.log(`[sms:mock] → ${input.to}: ${input.text}`);
  } catch (e) {
    error = (e as Error).message;
    console.error("[sms] failed:", error);
  }
  await db.notificationLog
    .create({
      data: {
        channel: "SMS",
        to: input.to,
        template: input.template,
        body: input.template === "otp" ? "[redacted verification code]" : input.text,
        status: error ? "FAILED" : "SENT",
        provider,
        error,
        bookingId: input.bookingId,
      },
    })
    .catch(() => {});
  return !error;
}
