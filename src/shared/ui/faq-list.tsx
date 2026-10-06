import { ChevronDown } from "lucide-react";

/** Native <details> accordion: accessible, no JS needed. */
export function FaqList({ items }: { items: { id: string; q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {items.map((f) => (
        <details key={f.id} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-lg font-bold hover:bg-brand-faint">
            {f.q}
            <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" aria-hidden />
          </summary>
          <p className="px-5 pb-5 text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
