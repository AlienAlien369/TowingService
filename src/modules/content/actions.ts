"use server";

import { z } from "zod";
import { db } from "@/shared/lib/db";
import { clientIp, rateLimit } from "@/shared/lib/guard";
import { normalizeEmail, normalizePhone } from "@/shared/lib/utils";
import { getCurrentUser } from "@/modules/auth/session";
import { defer, onLead } from "@/modules/notifications/events";
import { trackServer } from "@/modules/analytics/track";
import { fail, type ActionResult } from "@/modules/auth/guards";

const schema = z.object({
  kind: z.enum(["CONTACT", "CALLBACK", "PARTNER_INQUIRY", "COMING_SOON_AREA"]),
  name: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().max(254).optional(),
  message: z.string().trim().max(2000).optional(),
  meta: z.record(z.string(), z.string().max(200)).optional(),
  website: z.string().optional(), // honeypot – real users leave it empty
});

export async function submitLeadAction(raw: unknown): Promise<ActionResult> {
  const p = schema.safeParse(raw);
  if (!p.success) return fail("Please check the details and try again.");
  const d = p.data;
  if (d.website) return { ok: true }; // bot: pretend success
  if (!(await rateLimit(`lead:${await clientIp()}`, 8, 3600))) return fail("Too many submissions. Please try again later.");

  const phone = d.phone ? normalizePhone(d.phone) : null;
  const email = d.email ? normalizeEmail(d.email) : null;
  if (d.phone && !phone) return fail("Enter a valid 10-digit mobile number.");
  if (d.email && !email) return fail("Enter a valid email address.");
  if (!phone && !email) return fail("Please provide a phone number or an email so we can reach you.");
  if (d.kind === "CONTACT" && (!d.message || d.message.length < 5)) return fail("Please tell us how we can help.");

  const user = await getCurrentUser();
  await db.lead.create({ data: { kind: d.kind, name: d.name || null, phone, email, message: d.message || null, meta: d.meta, userId: user?.id } });
  if (d.kind === "COMING_SOON_AREA") void trackServer("coming_soon_lead", { kind: d.kind, area: d.meta?.area }, { userId: user?.id });
  defer(() => onLead(d.kind, { name: d.name, phone, email, message: d.message }));
  return { ok: true };
}
