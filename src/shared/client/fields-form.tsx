"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Button, Field, Input, Select, Textarea } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { toFormValue, type FieldSpec } from "@/shared/forms";

type Result = { ok: boolean; error?: string; message?: string };

/** Renders any list of FieldSpecs as a form (settings, catalog, content…). */
export function FieldsForm({ fields, values, action, submitLabel = "Save", redirectTo, secondary }: {
  fields: FieldSpec[];
  values: Record<string, unknown>;
  action: (fd: FormData) => Promise<Result>;
  submitLabel?: string;
  redirectTo?: string;
  secondary?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setMsg(null);
        start(async () => {
          const r = await action(fd);
          if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Could not save." });
          setMsg({ ok: true, text: r.message ?? "Saved." });
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const t = f.type ?? "text";
          const v = toFormValue(f, values[f.name]);
          const wide = f.full || t === "textarea" || t === "localized" || t === "localizedTextarea";
          return (
            <div key={f.name} className={cn(wide && "sm:col-span-2")}>
              {f.section && <h3 className="mb-3 mt-2 border-b-2 border-ink pb-1 text-2xl font-extrabold uppercase">{f.section}</h3>}
              {t === "checkbox" ? (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-line p-3 font-semibold has-[:checked]:border-ink has-[:checked]:bg-brand-faint">
                  <input type="checkbox" name={f.name} defaultChecked={Boolean(v)} className="mt-0.5 size-5 accent-black" />
                  <span>{f.label}{f.help && <span className="block text-xs font-normal text-muted">{f.help}</span>}</span>
                </label>
              ) : t === "localized" || t === "localizedTextarea" ? (
                <fieldset className="rounded-xl border-2 border-line p-3">
                  <legend className="px-1 text-sm font-semibold">{f.label}{f.required && <span className="text-danger"> *</span>}</legend>
                  <div className="grid gap-3 md:grid-cols-2">
                    {(["en", "hi"] as const).map((lng) => {
                      const val = ((v as { en?: string; hi?: string } | undefined)?.[lng] ?? "") as string;
                      return (
                        <Field key={lng} label={lng === "en" ? "English" : "हिंदी (Hindi)"}>
                          {t === "localizedTextarea" ? <Textarea name={`${f.name}.${lng}`} defaultValue={val} rows={f.rows ?? 3} className="font-mono text-[13px]" lang={lng} /> : <Input name={`${f.name}.${lng}`} defaultValue={val} lang={lng} />}
                        </Field>
                      );
                    })}
                  </div>
                  {f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
                </fieldset>
              ) : (
                <Field label={f.label} help={f.help} required={f.required}>
                  {t === "textarea" ? (
                    <Textarea name={f.name} defaultValue={(v as string) ?? ""} rows={f.rows ?? 3} />
                  ) : t === "select" ? (
                    <Select name={f.name} defaultValue={(v as string) ?? f.options?.[0]?.value ?? ""}>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  ) : t === "color" ? (
                    <div className="flex items-center gap-3">
                      <input type="color" name={f.name} defaultValue={(v as string) ?? "#FFC400"} className="h-12 w-16 cursor-pointer rounded-lg border-2 border-line bg-surface p-1" />
                      <span className="font-mono text-sm text-muted">{String(v ?? "")}</span>
                    </div>
                  ) : (
                    <Input name={f.name} type={t === "number" ? "number" : t === "date" ? "date" : t} step={f.step} min={f.min} defaultValue={v == null ? "" : String(v)} required={f.required} />
                  )}
                </Field>
              )}
            </div>
          );
        })}
      </div>
      {msg && <Alert tone={msg.ok ? "ok" : "danger"}>{msg.text}</Alert>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" loading={pending}>{submitLabel}</Button>
        {secondary}
      </div>
    </form>
  );
}
