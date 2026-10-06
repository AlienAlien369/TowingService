import { CheckCircle2 } from "lucide-react";
import { renderMarkdown } from "@/shared/lib/markdown";
import { Alert, Badge, Card, EmptyState } from "@/shared/ui";
import { ContractSign } from "@/shared/client/contract-sign";
import { PrintButton } from "@/shared/client/print-button";

type C = { id: string; title: string; renderedBody: string; status: "SENT" | "SIGNED" | "TERMINATED"; templateVersion: number; commissionBp: number; signedName: string | null; signedAt: Date | null; signedIp: string | null; signedVia: string | null; createdAt: Date };

/** Renders a provider's contracts: the immutable agreed text, signature evidence, and the sign box for pending ones. */
export function ContractView({ contracts, email, signerName }: { contracts: C[]; email: string; signerName: string }) {
  if (contracts.length === 0) return <EmptyState title="No agreement yet">Your agreement is generated once your application is approved.</EmptyState>;
  return (
    <div className="space-y-6">
      {contracts.map((c) => (
        <Card key={c.id} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-ink px-5 py-3 text-white">
            <div>
              <p className="text-lg font-extrabold">{c.title}</p>
              <p className="text-xs text-white/60">Template v{c.templateVersion} · Commission {(c.commissionBp / 100).toFixed(c.commissionBp % 100 ? 2 : 0)}%</p>
            </div>
            <Badge tone={c.status === "SIGNED" ? "ok" : c.status === "SENT" ? "warn" : "danger"}>{c.status === "SENT" ? "AWAITING SIGNATURE" : c.status}</Badge>
          </div>
          {c.status === "SIGNED" && (
            <Alert tone="ok" className="m-4">
              <span className="inline-flex items-center gap-2 font-bold"><CheckCircle2 className="size-4" /> Signed by {c.signedName} on {c.signedAt?.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</span>
              <span className="block text-xs text-muted">Method: {c.signedVia} · IP {c.signedIp}</span>
            </Alert>
          )}
          <div className="max-h-[32rem] overflow-y-auto border-y border-line p-5">
            <article className="prose-doc" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.renderedBody) }} />
          </div>
          <div className="flex flex-wrap items-center gap-3 p-4 no-print"><PrintButton label="Print / Save as PDF" /></div>
          {c.status === "SENT" && <div className="p-4 pt-0"><ContractSign contractId={c.id} email={email} signerName={signerName} /></div>}
        </Card>
      ))}
    </div>
  );
}
