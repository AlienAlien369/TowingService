"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icons";

export type NavItem = { href: string; label: string; icon?: string; exact?: boolean; badge?: number; section?: string };

export function SideNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="space-y-0.5 overflow-y-auto" aria-label="Sections">
      {items.map((i) => {
        const active = i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/");
        return (
          <div key={i.href}>
            {i.section && <p className="mb-1 mt-4 px-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/40">{i.section}</p>}
            <Link href={i.href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-bold transition", active ? "bg-brand text-ink" : "text-white/75 hover:bg-white/10 hover:text-white")}>
              {i.icon && <Icon name={i.icon} className="size-4 shrink-0" />}
              <span className="flex-1">{i.label}</span>
              {!!i.badge && <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-extrabold text-white">{i.badge}</span>}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export function TopTabs({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden" aria-label="Sections">
      {items.map((i) => {
        const active = i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/");
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold", active ? "bg-brand text-ink" : "bg-white/10 text-white/80")}>
            {i.label}
            {!!i.badge && <span className="rounded-full bg-danger px-1.5 text-xs text-white">{i.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
