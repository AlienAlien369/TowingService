import { env } from "@/shared/lib/env";
import type { Brand } from "@/modules/settings/service";

export const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export type EmailParts = {
  title: string;
  preheader?: string;
  /** Trusted HTML – callers must escape user data with esc(). */
  body: string;
  cta?: { label: string; href: string };
  footnote?: string;
};

/** Branded, table-based HTML email (renders in Gmail/Outlook). Brand name & colors are dynamic. */
export function renderEmail(brand: Brand, p: EmailParts): string {
  const primary = brand.primaryColor;
  const ink = brand.inkColor;
  const logo = brand.logoUrl
    ? `<img src="${esc(brand.logoUrl)}" alt="" height="32" style="vertical-align:middle;margin-right:10px;border-radius:6px"/>`
    : `<span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;background:${primary};color:${ink};font-weight:900;border-radius:8px;margin-right:10px;vertical-align:middle">${esc(brand.name.slice(0, 1).toUpperCase())}</span>`;
  const cta = p.cta
    ? `<p style="margin:28px 0 8px"><a href="${esc(p.cta.href)}" style="background:${primary};color:${ink};text-decoration:none;font-weight:800;padding:14px 26px;border-radius:10px;display:inline-block">${esc(p.cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f3f3ef;font-family:Segoe UI,Arial,sans-serif;color:${ink}">
<span style="display:none;max-height:0;overflow:hidden">${esc(p.preheader ?? "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:${ink};padding:18px 24px;color:#fff;font-size:18px;font-weight:800">${logo}<span style="vertical-align:middle">${esc(brand.name)}</span></td></tr>
<tr><td style="height:6px;background:repeating-linear-gradient(45deg,${primary},${primary} 12px,${ink} 12px,${ink} 24px)"></td></tr>
<tr><td style="padding:28px 24px 8px;font-size:15px;line-height:1.6">
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.25">${esc(p.title)}</h1>
${p.body}${cta}
${p.footnote ? `<p style="color:#6b6f76;font-size:13px;margin-top:20px">${p.footnote}</p>` : ""}
</td></tr>
<tr><td style="padding:18px 24px 26px;color:#6b6f76;font-size:12px;line-height:1.5;border-top:1px solid #eee">
${esc(brand.name)} · ${esc(brand.addressLine)}, ${esc(brand.city)} ${esc(brand.pincode)}<br/>
24x7 helpline <a href="tel:${esc(brand.emergencyPhone.replace(/\s/g, ""))}" style="color:${ink};font-weight:700">${esc(brand.emergencyPhone)}</a> · <a href="${env.appUrl}" style="color:${ink}">${esc(env.appUrl.replace(/^https?:\/\//, ""))}</a>
</td></tr></table></td></tr></table></body></html>`;
}

export const row = (label: string, value: unknown) =>
  `<tr><td style="padding:6px 12px 6px 0;color:#6b6f76;font-size:13px;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;font-weight:600">${esc(value)}</td></tr>`;

export const table = (rows: string) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0">${rows}</table>`;

export const stripTags = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(p|tr|h1|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
