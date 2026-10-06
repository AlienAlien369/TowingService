import Link from "next/link";
import { MessageCircle, Phone, Truck } from "lucide-react";
import type { Locale } from "@/shared/lib/localized";
import { getDict } from "@/i18n";
import { getBrand } from "@/modules/settings/service";
import { TrackedLink } from "@/shared/client/track";

/** Mobile-only sticky emergency bar: the two actions a stranded driver needs, always in thumb reach. */
export async function ActionBar({ locale }: { locale: Locale }) {
  const brand = await getBrand();
  const d = getDict(locale);
  const tel = brand.emergencyPhone.replace(/[^\d+]/g, "");
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-ink p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden">
      <div className="grid grid-cols-[1fr_auto_1.4fr] gap-2">
        <TrackedLink event="cta_call_click" props={{ where: "action-bar" }} href={`tel:${tel}`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-extrabold text-ink">
          <Phone className="size-5" /> {d.nav.call}
        </TrackedLink>
        <TrackedLink event="cta_whatsapp_click" href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={d.common.whatsapp} className="grid h-12 w-12 place-items-center rounded-xl bg-[#25D366] text-white">
          <MessageCircle className="size-6" />
        </TrackedLink>
        <Link href={`/${locale}/book`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-extrabold text-ink">
          <Truck className="size-5" /> {d.nav.book}
        </Link>
      </div>
    </div>
  );
}
