import Link from "next/link";
import { cn } from "@/shared/lib/utils";

/** Auto-generated mark: a tow hook on the brand color. Used when no logo URL is configured. */
export function LogoMark({ className, logoUrl }: { className?: string; logoUrl?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" className={cn("size-9 rounded-lg object-contain", className)} />;
  }
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="10" fill="var(--brand)" />
      <path d="M0 31 L9 40 H0Z M13 25 L28 40 H18 L13 35Z" fill="var(--ink)" opacity=".1" />
      <circle cx="20" cy="9.5" r="3.4" fill="none" stroke="var(--ink)" strokeWidth="3" />
      <path d="M20 13v12.5a5.5 5.5 0 1 1-5.5-5.5" fill="none" stroke="var(--ink)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M12 21.2l3.3-1.9-.3 3.8z" fill="var(--ink)" />
    </svg>
  );
}

export function Logo({ name, logoUrl, href, light, className }: { name: string; logoUrl?: string; href: string; light?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label={name}>
      <LogoMark logoUrl={logoUrl} />
      <span className={cn("font-display text-[1.65rem] font-extrabold uppercase leading-none tracking-wide", light ? "text-white" : "text-ink")}>{name}</span>
    </Link>
  );
}
