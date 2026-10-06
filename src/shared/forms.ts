// Declarative field specs drive every admin form (settings, catalog, content…) so adding a
// resource is configuration, not another hand-written form.

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "color"
  | "textarea"
  | "checkbox"
  | "select"
  | "date"
  | "localized" // { en, hi } single line
  | "localizedTextarea"; // { en, hi } multi line (markdown)

export type FieldSpec = {
  name: string;
  label: string;
  type?: FieldType;
  help?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  step?: string;
  min?: number;
  /** Money field edited in rupees, stored in paise. */
  money?: boolean;
  /** Visual grouping heading rendered before this field. */
  section?: string;
  full?: boolean;
  rows?: number;
};

export type FieldValues = Record<string, unknown>;

/** FormData → nested object driven by the specs (handles localized + checkbox + money). */
export function parseForm(formData: FormData, fields: FieldSpec[]): FieldValues {
  const out: FieldValues = {};
  for (const f of fields) {
    const t = f.type ?? "text";
    if (t === "checkbox") out[f.name] = formData.get(f.name) === "on" || formData.get(f.name) === "true";
    else if (t === "localized" || t === "localizedTextarea")
      out[f.name] = { en: String(formData.get(`${f.name}.en`) ?? ""), hi: String(formData.get(`${f.name}.hi`) ?? "") };
    else if (t === "number") {
      const raw = String(formData.get(f.name) ?? "").trim();
      const n = raw === "" ? undefined : Number(raw);
      out[f.name] = n === undefined ? undefined : f.money ? Math.round(n * 100) : n;
    } else if (t === "date") {
      const raw = String(formData.get(f.name) ?? "").trim();
      out[f.name] = raw ? new Date(raw) : null;
    } else out[f.name] = String(formData.get(f.name) ?? "");
  }
  return out;
}

/** Stored value → what the form input should display. */
export function toFormValue(f: FieldSpec, v: unknown): unknown {
  if (f.money && typeof v === "number") return v / 100;
  if (f.type === "date" && v) return new Date(v as string).toISOString().slice(0, 10);
  return v;
}
