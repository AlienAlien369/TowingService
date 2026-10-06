import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { db } from "@/shared/lib/db";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES, STAFF_ROLES } from "@/modules/auth/session";
import { AppShell } from "@/shared/layout/app-shell";
import type { NavItem } from "@/shared/layout/nav-links";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale, p } = await loadLocale(params);
  const user = await requireUser(locale, p("/admin"), STAFF_ROLES);
  const isAdmin = ADMIN_ROLES.includes(user.role);
  const [attention, pendingProviders, newLeads] = await Promise.all([
    db.booking.count({ where: { status: { in: ["NO_DRIVER_FOUND"] } } }),
    Promise.all([db.company.count({ where: { status: "PENDING" } }), db.driver.count({ where: { status: "PENDING", companyId: null } })]).then(([a, b]) => a + b),
    db.lead.count({ where: { status: "NEW" } }),
  ]);
  const nav: NavItem[] = [
    { href: p("/admin"), label: "Dashboard", icon: "zap", exact: true, section: "Operations" },
    { href: p("/admin/bookings"), label: "Bookings", icon: "truck", badge: attention },
    { href: p("/admin/dispatch"), label: "Dispatch board", icon: "crane" },
    { href: p("/admin/providers"), label: "Partners", icon: "shield", badge: pendingProviders },
    { href: p("/admin/leads"), label: "Leads", icon: "wind", badge: newLeads },
    ...(isAdmin
      ? [
          { href: p("/admin/manage/services"), label: "Services", icon: "wrench", section: "Catalog & pricing" },
          { href: p("/admin/manage/vehicle-types"), label: "Vehicle types", icon: "car" },
          { href: p("/admin/manage/rate-cards"), label: "Rate cards", icon: "zap" },
          { href: p("/admin/manage/areas"), label: "Service areas", icon: "hook", section: "Content" },
          { href: p("/admin/manage/faqs"), label: "FAQs", icon: "wind" },
          { href: p("/admin/manage/testimonials"), label: "Testimonials", icon: "shield" },
          { href: p("/admin/manage/pages"), label: "Legal pages", icon: "wrench" },
          { href: p("/admin/manage/contract-templates"), label: "Contract templates", icon: "shield" },
          { href: p("/admin/payments"), label: "Payouts & ledger", icon: "zap", section: "Finance" },
          { href: p("/admin/invoices"), label: "Invoices", icon: "wrench" },
          { href: p("/admin/users"), label: "Users & staff", icon: "shield", section: "Platform" },
          { href: p("/admin/analytics"), label: "Analytics", icon: "zap" },
          { href: p("/admin/notifications"), label: "Notification log", icon: "wind" },
          { href: p("/admin/audit"), label: "Audit log", icon: "wrench" },
          { href: p("/admin/settings"), label: "Settings", icon: "wrench" },
        ]
      : []),
  ];
  return (
    <AppShell locale={locale} title="Admin" roleLabel={user.role.replace("_", " ")} userLabel={user.name ?? user.email ?? "Staff"} nav={nav}>
      {children}
    </AppShell>
  );
}
