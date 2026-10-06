import "server-only";
import { z, type ZodType } from "zod";
import { db } from "@/shared/lib/db";
import { localizedSchema, type Localized } from "@/shared/lib/localized";
import { ICON_OPTIONS } from "@/shared/ui/icons";
import type { FieldSpec } from "@/shared/forms";

type Row = Record<string, unknown>;
type Delegate = {
  findMany(args?: object): Promise<Row[]>;
  findUnique(args: { where: { id: string } }): Promise<Row | null>;
  create(args: { data: Row }): Promise<Row>;
  update(args: { where: { id: string }; data: Row }): Promise<Row>;
  delete(args: { where: { id: string } }): Promise<Row>;
};

export type Resource = {
  key: string;
  title: string;
  singular: string;
  group: "Catalog" | "Content";
  description: string;
  delegate: Delegate;
  fields: FieldSpec[];
  orderBy: object;
  /** Columns for the list view; return plain strings. */
  columns: { header: string; get: (r: Row) => string }[];
  /** Cache tags to expire after a write. */
  tags: string[];
  /** Fill dynamic <select> options. */
  options?: () => Promise<Record<string, { value: string; label: string }[]>>;
  /** Extra validation / shaping before write. */
  prepare?: (data: Row, existing: Row | null) => Row;
  /** Default values for the "new" form. */
  defaults?: Row;
};

const loc = (v: unknown) => (v as Localized | undefined)?.en ?? "";
const yn = (v: unknown) => (v ? "Yes" : "No");
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const resources: Record<string, Resource> = {
  "vehicle-types": {
    key: "vehicle-types", title: "Vehicle types", singular: "vehicle type", group: "Catalog",
    description: "Classes of vehicle customers can book a tow for.",
    delegate: db.vehicleType as unknown as Delegate, orderBy: { sortOrder: "asc" }, tags: ["catalog"],
    fields: [
      { name: "slug", label: "Slug (URL id)", required: true, help: "lowercase-with-dashes, used in links like /book?vehicle=car" },
      { name: "name", label: "Name", type: "localized", required: true },
      { name: "description", label: "Description", type: "localizedTextarea", rows: 2 },
      { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
      { name: "maxWeightKg", label: "Max weight (kg)", type: "number" },
      { name: "sortOrder", label: "Sort order", type: "number" },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
    columns: [{ header: "Name", get: (r) => loc(r.name) }, { header: "Slug", get: (r) => String(r.slug) }, { header: "Max kg", get: (r) => String(r.maxWeightKg ?? "—") }, { header: "Active", get: (r) => yn(r.isActive) }],
    defaults: { icon: "car", sortOrder: 0, isActive: true },
  },
  services: {
    key: "services", title: "Services", singular: "service", group: "Catalog",
    description: "What you offer: towing types and on-spot help.",
    delegate: db.service as unknown as Delegate, orderBy: { sortOrder: "asc" }, tags: ["catalog"],
    fields: [
      { name: "slug", label: "Slug (URL id)", required: true },
      { name: "name", label: "Name", type: "localized", required: true },
      { name: "shortDescription", label: "Short description", type: "localizedTextarea", rows: 2, required: true },
      { name: "description", label: "Full description", type: "localizedTextarea", rows: 5, required: true },
      { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
      { name: "requiresDrop", label: "Needs a drop location (towing)", type: "checkbox", help: "Off for on-spot services like battery, tyre, fuel." },
      { name: "etaMinutes", label: "Typical arrival (minutes)", type: "number" },
      { name: "sortOrder", label: "Sort order", type: "number" },
      { name: "isFeatured", label: "Featured on home page", type: "checkbox" },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
    columns: [{ header: "Name", get: (r) => loc(r.name) }, { header: "Type", get: (r) => (r.requiresDrop ? "Towing" : "On-spot") }, { header: "ETA", get: (r) => `${r.etaMinutes} min` }, { header: "Featured", get: (r) => yn(r.isFeatured) }, { header: "Active", get: (r) => yn(r.isActive) }],
    defaults: { icon: "truck", requiresDrop: true, etaMinutes: 30, sortOrder: 0, isActive: true },
  },
  "rate-cards": {
    key: "rate-cards", title: "Rate cards", singular: "rate card", group: "Catalog",
    description: "Price per vehicle type × service. Amounts are in ₹ (excl. GST).",
    delegate: db.rateCard as unknown as Delegate, orderBy: [{ service: { sortOrder: "asc" } }, { vehicleType: { sortOrder: "asc" } }], tags: ["catalog"],
    fields: [
      { name: "serviceId", label: "Service", type: "select", required: true },
      { name: "vehicleTypeId", label: "Vehicle type", type: "select", required: true },
      { name: "baseFare", label: "Base fare (₹)", type: "number", money: true, step: "0.01", required: true, help: "Covers the included distance." },
      { name: "includedKm", label: "Included distance (km)", type: "number", step: "0.1", required: true },
      { name: "perKm", label: "Per-km after included (₹)", type: "number", money: true, step: "0.01", required: true, help: "Use 0 for on-spot services." },
      { name: "minFare", label: "Minimum fare (₹)", type: "number", money: true, step: "0.01", required: true },
      { name: "waitingPerMin", label: "Waiting per minute (₹)", type: "number", money: true, step: "0.01", required: true },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
    columns: [],
    options: async () => {
      const [v, s] = await Promise.all([db.vehicleType.findMany({ orderBy: { sortOrder: "asc" } }), db.service.findMany({ orderBy: { sortOrder: "asc" } })]);
      return { vehicleTypeId: v.map((x) => ({ value: x.id, label: loc(x.name) })), serviceId: s.map((x) => ({ value: x.id, label: loc(x.name) })) };
    },
    defaults: { includedKm: 5, perKm: 0, waitingPerMin: 0, isActive: true },
  },
  areas: {
    key: "areas", title: "Service areas", singular: "area", group: "Content",
    description: "Where you operate. Pickup must fall inside an Active area's radius; Coming-soon areas collect leads.",
    delegate: db.area as unknown as Delegate, orderBy: [{ status: "asc" }, { sortOrder: "asc" }], tags: ["areas", "content"],
    fields: [
      { name: "slug", label: "Slug (URL id)", required: true },
      { name: "city", label: "City", required: true },
      { name: "name", label: "Name", type: "localized", required: true },
      { name: "description", label: "Description", type: "localizedTextarea", rows: 3, required: true },
      { name: "status", label: "Status", type: "select", options: [{ value: "ACTIVE", label: "Active" }, { value: "COMING_SOON", label: "Coming soon" }] },
      { name: "lat", label: "Centre latitude", type: "number", step: "any", required: true },
      { name: "lng", label: "Centre longitude", type: "number", step: "any", required: true },
      { name: "radiusKm", label: "Coverage radius (km)", type: "number", step: "0.1", required: true },
      { name: "pincodes", label: "PIN codes (comma separated)" },
      { name: "sortOrder", label: "Sort order", type: "number" },
      { name: "isActive", label: "Visible", type: "checkbox" },
    ],
    columns: [{ header: "Name", get: (r) => loc(r.name) }, { header: "City", get: (r) => String(r.city) }, { header: "Status", get: (r) => String(r.status) }, { header: "Radius", get: (r) => `${r.radiusKm} km` }, { header: "Visible", get: (r) => yn(r.isActive) }],
    defaults: { city: "Delhi", status: "ACTIVE", radiusKm: 6, sortOrder: 0, isActive: true },
  },
  faqs: {
    key: "faqs", title: "FAQs", singular: "FAQ", group: "Content",
    description: "Shown on the FAQ page and home page, and published as FAQ structured data for search.",
    delegate: db.faq as unknown as Delegate, orderBy: [{ category: "asc" }, { sortOrder: "asc" }], tags: ["content"],
    fields: [
      { name: "category", label: "Category", help: "e.g. booking, pricing, payment, safety" },
      { name: "question", label: "Question", type: "localized", required: true },
      { name: "answer", label: "Answer", type: "localizedTextarea", rows: 4, required: true },
      { name: "sortOrder", label: "Sort order", type: "number" },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
    columns: [{ header: "Question", get: (r) => loc(r.question) }, { header: "Category", get: (r) => String(r.category) }, { header: "Active", get: (r) => yn(r.isActive) }],
    defaults: { category: "general", sortOrder: 0, isActive: true },
  },
  testimonials: {
    key: "testimonials", title: "Testimonials", singular: "testimonial", group: "Content",
    description: "Only add genuine customer reviews. The home-page section appears once at least one is active.",
    delegate: db.testimonial as unknown as Delegate, orderBy: { sortOrder: "asc" }, tags: ["content"],
    fields: [
      { name: "name", label: "Customer name", required: true },
      { name: "locality", label: "Locality" },
      { name: "rating", label: "Rating (1–5)", type: "number", min: 1 },
      { name: "text", label: "Review", type: "localizedTextarea", rows: 3, required: true },
      { name: "sortOrder", label: "Sort order", type: "number" },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
    columns: [{ header: "Name", get: (r) => String(r.name) }, { header: "Rating", get: (r) => `${r.rating}★` }, { header: "Active", get: (r) => yn(r.isActive) }],
    defaults: { rating: 5, sortOrder: 0, isActive: false },
  },
  pages: {
    key: "pages", title: "Legal & info pages", singular: "page", group: "Content",
    description: "Terms, privacy, cancellation, etc. Markdown supported. Placeholders: {{brand}} {{legalEntity}} {{gstin}} {{email}} {{supportEmail}} {{phone}} {{address}} {{updated}}.",
    delegate: db.page as unknown as Delegate, orderBy: { slug: "asc" }, tags: ["content"],
    fields: [
      { name: "slug", label: "Slug (URL id)", required: true, help: "Page lives at /legal/<slug>" },
      { name: "kind", label: "Kind", type: "select", options: [{ value: "LEGAL", label: "Legal (listed in footer)" }, { value: "INFO", label: "Info" }] },
      { name: "title", label: "Title", type: "localized", required: true },
      { name: "body", label: "Body (Markdown)", type: "localizedTextarea", rows: 18, required: true },
      { name: "isPublished", label: "Published", type: "checkbox" },
    ],
    columns: [{ header: "Title", get: (r) => loc(r.title) }, { header: "Slug", get: (r) => `/legal/${r.slug}` }, { header: "Version", get: (r) => `v${r.version}` }, { header: "Published", get: (r) => yn(r.isPublished) }],
    prepare: (data, existing) => ({ ...data, version: existing ? Number(existing.version) + 1 : 1 }),
    defaults: { kind: "LEGAL", isPublished: true },
  },
  "contract-templates": {
    key: "contract-templates", title: "Contract templates", singular: "contract template", group: "Content",
    description: "Partner agreements. When a partner is approved, the latest active template for their type is rendered and sent for e-signature. Placeholders: {{brand}} {{legalEntity}} {{companyAddress}} {{companyGstin}} {{providerName}} {{providerAddress}} {{providerEmail}} {{providerPhone}} {{providerGstin}} {{commissionPct}} {{date}} {{contractRef}} {{supportEmail}} {{party}}.",
    delegate: db.contractTemplate as unknown as Delegate, orderBy: [{ party: "asc" }, { version: "desc" }], tags: [],
    fields: [
      { name: "party", label: "For", type: "select", options: [{ value: "INDIVIDUAL", label: "Independent driver" }, { value: "COMPANY", label: "Fleet company" }] },
      { name: "version", label: "Version", type: "number", required: true, help: "Bump the version when you change terms; already-signed contracts keep their original text." },
      { name: "title", label: "Title", type: "localized", required: true },
      { name: "body", label: "Agreement text (Markdown)", type: "localizedTextarea", rows: 24, required: true },
      { name: "isActive", label: "Active (used for new partners)", type: "checkbox" },
    ],
    columns: [{ header: "For", get: (r) => String(r.party) }, { header: "Title", get: (r) => loc(r.title) }, { header: "Version", get: (r) => `v${r.version}` }, { header: "Active", get: (r) => yn(r.isActive) }],
    defaults: { party: "INDIVIDUAL", version: 1, isActive: true },
  },
};

// ───────── validation derived from the field specs ─────────
export function buildSchema(res: Resource): ZodType<Row> {
  const shape: Record<string, ZodType> = {};
  for (const f of res.fields) {
    const t = f.type ?? "text";
    let s: ZodType;
    if (t === "checkbox") s = z.boolean();
    else if (t === "localized" || t === "localizedTextarea") s = f.required ? localizedSchema : localizedSchema.partial({ en: true }).transform((v) => ({ en: v.en ?? "", hi: v.hi ?? "" }));
    else if (t === "number") s = f.required ? z.number({ error: `${f.label} is required` }) : z.number().optional();
    else if (t === "select" && f.options) s = z.enum(f.options.map((o) => o.value) as [string, ...string[]]);
    else if (t === "date") s = z.date().nullable();
    else s = f.required ? z.string().trim().min(1, `${f.label} is required`) : z.string().trim();
    shape[f.name] = s;
  }
  return z.object(shape) as unknown as ZodType<Row>;
}

export const SLUG_RE = slugRe;
