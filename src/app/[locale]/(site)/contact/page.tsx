import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { loadLocale, type LocaleParams } from "@/shared/lib/page";
import { getBrand } from "@/modules/settings/service";
import { Card, Container, PageHero } from "@/shared/ui";
import { LeadForm } from "@/shared/client/lead-form";
import { TrackedLink } from "@/shared/client/track";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.contact.title, description: d.contact.sub };
}

export default async function ContactPage({ params }: LocaleParams) {
  const { d } = await loadLocale(params);
  const brand = await getBrand();
  const tel = brand.emergencyPhone.replace(/[^\d+]/g, "");
  const labels = { name: d.contact.formName, phone: d.contact.formPhone, email: d.contact.formEmail, message: d.contact.formMessage, submit: d.common.send, sent: d.contact.formSent };
  const mapQuery = encodeURIComponent(`${brand.addressLine}, ${brand.city} ${brand.pincode}`);
  return (
    <>
      <PageHero title={d.contact.title} subtitle={d.contact.sub} />
      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <TrackedLink event="cta_call_click" props={{ where: "contact" }} href={`tel:${tel}`} className="flex items-center gap-4 rounded-2xl bg-brand p-5 text-ink shadow-card">
            <span className="grid size-14 place-items-center rounded-xl bg-ink text-brand"><Phone className="size-7" /></span>
            <span>
              <span className="block text-xs font-extrabold uppercase tracking-wider">{d.contact.emergency} · {d.common.open247}</span>
              <span className="font-display text-4xl font-extrabold leading-none">{brand.emergencyPhone}</span>
            </span>
          </TrackedLink>
          <Card className="divide-y divide-line">
            <a href={`mailto:${brand.email}`} className="flex gap-3 p-4 hover:bg-brand-faint"><Mail className="mt-0.5 size-5" /><span><b className="block">{d.contact.general}</b>{brand.email}</span></a>
            <a href={`mailto:${brand.partnersEmail}`} className="flex gap-3 p-4 hover:bg-brand-faint"><Mail className="mt-0.5 size-5" /><span><b className="block">{d.contact.partners}</b>{brand.partnersEmail}</span></a>
            <TrackedLink event="cta_whatsapp_click" href={`https://wa.me/${brand.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex gap-3 p-4 hover:bg-brand-faint"><MessageCircle className="mt-0.5 size-5" /><span><b className="block">WhatsApp</b>+{brand.whatsapp}</span></TrackedLink>
            <div className="flex gap-3 p-4"><MapPin className="mt-0.5 size-5" /><span><b className="block">{d.contact.office}</b>{brand.addressLine}, {brand.city}, {brand.state} {brand.pincode}</span></div>
            <div className="flex gap-3 p-4"><Clock className="mt-0.5 size-5" /><span><b className="block">{d.contact.hours}</b>{brand.hours}</span></div>
          </Card>
          <a href={`https://www.openstreetmap.org/search?query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="block text-sm font-bold underline">OpenStreetMap ↗</a>
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-3xl font-extrabold uppercase">{d.contact.formTitle}</h2>
            <LeadForm kind="CONTACT" withMessage labels={labels} />
          </Card>
          <Card className="bg-ink p-6 text-white">
            <h2 className="text-3xl font-extrabold uppercase text-brand">{d.contact.callback}</h2>
            <p className="mb-4 mt-1 text-white/75">{d.contact.callbackSub}</p>
            <div className="rounded-xl bg-white p-4 text-ink">
              <LeadForm kind="CALLBACK" withEmail={false} compact labels={{ ...labels, submit: d.contact.callback }} />
            </div>
          </Card>
        </div>
      </Container>
    </>
  );
}
