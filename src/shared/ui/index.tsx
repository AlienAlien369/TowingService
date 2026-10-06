import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

// ───────────── Button ─────────────
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition active:translate-y-px disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";
const variants = {
  primary: "bg-brand text-ink hover:bg-brand-strong shadow-[0_2px_0_0_rgb(0_0_0/0.18)]",
  dark: "bg-ink text-white hover:bg-ink-3",
  outline: "border-2 border-ink/15 bg-surface text-ink hover:border-ink",
  ghost: "text-ink hover:bg-ink-soft",
  danger: "bg-danger text-white hover:brightness-95",
  light: "bg-white text-ink hover:bg-brand-soft",
} as const;
const sizes = { sm: "h-9 px-3.5 text-sm", md: "h-11 px-5 text-[15px]", lg: "h-14 px-7 text-base" } as const;
export type ButtonVariant = keyof typeof variants;

export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof sizes = "md", extra?: string) {
  return cn(btnBase, variants[variant], sizes[size], extra);
}

export function Button({ variant = "primary", size = "md", className, loading, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: keyof typeof sizes; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", size = "md", className, ...rest }: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: keyof typeof sizes }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

// ───────────── Form controls ─────────────
const control =
  "w-full rounded-xl border-2 border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition focus:border-ink focus:outline-none focus-visible:outline-none disabled:bg-ink-soft aria-[invalid=true]:border-danger";

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-12", className)} {...p} />;
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 py-3", className)} {...p} />;
}
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, "h-12 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23666%22 stroke-width=%223%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10", className)} {...p}>
      {children}
    </select>
  );
}

export function Field({ label, help, error, children, className, required }: { label: ReactNode; help?: ReactNode; error?: string; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </span>
      {children}
      {help && !error && <span className="mt-1 block text-xs text-muted">{help}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-danger" role="alert">{error}</span>}
    </label>
  );
}

// ───────────── Surfaces ─────────────
export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-surface shadow-card", className)} {...p} />;
}

const badgeTone = {
  neutral: "bg-ink-soft text-ink",
  brand: "bg-brand text-ink",
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/14 text-warn",
  danger: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
  dark: "bg-ink text-white",
} as const;
export type Tone = keyof typeof badgeTone;
export function Badge({ tone = "neutral", className, ...p }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", badgeTone[tone], className)} {...p} />;
}

export function Alert({ tone = "info", title, children, className }: { tone?: "info" | "ok" | "warn" | "danger"; title?: ReactNode; children?: ReactNode; className?: string }) {
  const t = { info: "border-info/30 bg-info/8", ok: "border-ok/30 bg-ok/8", warn: "border-warn/40 bg-warn/10", danger: "border-danger/30 bg-danger/8" }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl border p-3.5 text-sm", t, className)}>
      {title && <p className="font-bold">{title}</p>}
      {children && <div className={cn(title ? "mt-0.5" : "", "text-ink/85")}>{children}</div>}
    </div>
  );
}

export function Container({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...p} />;
}

export function SectionHeading({ eyebrow, title, subtitle, center, light }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; center?: boolean; light?: boolean }) {
  return (
    <div className={cn("mb-8 max-w-3xl sm:mb-12", center && "mx-auto text-center")}>
      {eyebrow && (
        <p className={cn("mb-2 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.14em]", light ? "text-brand" : "text-ink")}>
          <span className="inline-block h-1.5 w-8 rounded-full bg-brand" aria-hidden />
          {eyebrow}
        </p>
      )}
      <h2 className={cn("text-4xl font-extrabold leading-[1.02] sm:text-5xl", light && "text-white")}>{title}</h2>
      {subtitle && <p className={cn("mt-3 text-lg", light ? "text-white/75" : "text-muted")}>{subtitle}</p>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold leading-none">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {tone && <span className="sr-only">{tone}</span>}
    </Card>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-surface/60 p-8 text-center">
      <p className="font-display text-2xl font-extrabold">{title}</p>
      {children && <div className="mt-1 text-muted">{children}</div>}
    </div>
  );
}

// ───────────── Table ─────────────
export function DataTable({ head, children, className }: { head: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-line bg-surface shadow-card", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-ink text-xs uppercase tracking-wider text-white">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-3 font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_tr:hover]:bg-brand-faint">{children}</tbody>
      </table>
    </div>
  );
}

// ───────────── Page hero (inner pages) ─────────────
export function PageHero({ title, subtitle, children, eyebrow }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <section className="bg-ink text-white">
      <Container className="py-12 sm:py-16">
        {eyebrow && <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>}
        <h1 className="max-w-4xl text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl lg:text-7xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-white/75 sm:text-xl">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </Container>
      <div className="hazard h-2" aria-hidden />
    </section>
  );
}
