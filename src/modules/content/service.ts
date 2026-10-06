import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/shared/lib/db";
import { asLocalized, type Locale } from "@/shared/lib/localized";
import { renderTemplate } from "@/shared/lib/utils";
import { getBrand, getSetting } from "@/modules/settings/service";

const opts = { tags: ["content"], revalidate: 300 };

export const getFaqs = unstable_cache(async () => db.faq.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }), ["content-faqs"], opts);
export const getTestimonials = unstable_cache(async () => db.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }), ["content-testimonials"], opts);
export const getAreas = unstable_cache(async () => db.area.findMany({ where: { isActive: true }, orderBy: [{ status: "asc" }, { sortOrder: "asc" }] }), ["content-areas"], { tags: ["areas", "content"], revalidate: 300 });
export const getAreaBySlug = async (slug: string) => (await getAreas()).find((a) => a.slug === slug) ?? null;

export const getPageRecord = unstable_cache(async (slug: string) => db.page.findUnique({ where: { slug } }), ["content-page"], opts);
export const listLegalPages = unstable_cache(async () => db.page.findMany({ where: { isPublished: true, kind: "LEGAL" }, orderBy: { slug: "asc" } }), ["content-legal"], opts);

/** Page with {{brand}}-style placeholders resolved for the viewer's language. */
export async function getRenderedPage(slug: string, locale: Locale) {
  const page = await getPageRecord(slug);
  if (!page || !page.isPublished) return null;
  const [brand, biz] = await Promise.all([getBrand(), getSetting("business")]);
  const vars = {
    brand: brand.name,
    legalEntity: biz.legalName || brand.name,
    gstin: biz.gstin,
    email: brand.email,
    supportEmail: brand.supportEmail,
    phone: brand.phone,
    emergencyPhone: brand.emergencyPhone,
    address: `${brand.addressLine}, ${brand.city}, ${brand.state} ${brand.pincode}`,
    updated: new Date(page.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
  };
  const title = asLocalized(page.title);
  const body = asLocalized(page.body);
  const pick = (t: { en: string; hi: string }) => renderTemplate(locale === "hi" && t.hi ? t.hi : t.en, vars);
  return { slug: page.slug, title: pick(title), body: pick(body), version: page.version, updatedAt: new Date(page.updatedAt) };
}
