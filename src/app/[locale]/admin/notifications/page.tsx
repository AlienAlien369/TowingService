import { db } from "@/shared/lib/db";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES } from "@/modules/auth/session";
import { Badge, DataTable } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";

export default async function AdminNotifications({ params }: LocaleParams) {
  const { locale, p } = await loadLocale(params);
  await requireUser(locale, p("/admin/notifications"), ADMIN_ROLES);
  const rows = await db.notificationLog.findMany({ orderBy: { createdAt: "desc" }, take: 150 });
  return (
    <>
      <PageTitle title="Notification log" sub="Every email and SMS the platform sent (OTP bodies are never stored in clear here)." />
      <DataTable head={["When", "Channel", "To", "Template", "Subject / text", "Status"]}>
        {rows.map((n) => (
          <tr key={n.id}>
            <td className="whitespace-nowrap text-xs">{n.createdAt.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}</td>
            <td><Badge tone={n.channel === "EMAIL" ? "info" : "warn"}>{n.channel}</Badge></td>
            <td className="text-xs">{n.to}</td>
            <td className="font-mono text-xs">{n.template}</td>
            <td className="max-w-md truncate text-xs">{n.template === "otp" ? "••• verification code •••" : n.subject ?? n.body}</td>
            <td><Badge tone={n.status === "SENT" ? "ok" : "danger"}>{n.status}</Badge>{n.error && <span className="block max-w-xs truncate text-xs text-danger" title={n.error}>{n.error}</span>}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
