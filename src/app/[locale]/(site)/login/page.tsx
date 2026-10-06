import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { loadLocale } from "@/shared/lib/page";
import { getCurrentUser } from "@/modules/auth/session";
import { homeForRole, safeNext } from "@/modules/auth/routing";
import { Card, Container } from "@/shared/ui";
import { OtpLogin } from "@/shared/client/otp-login";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { d } = await loadLocale(params);
  return { title: d.auth.title, robots: { index: false } };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale, d } = await loadLocale(params);
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(safeNext(next, homeForRole(user.role, locale)));
  return (
    <Container className="grid min-h-[70vh] place-items-center py-12">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-5xl font-extrabold uppercase leading-none">{d.auth.title}</h1>
        <p className="mb-6 mt-2 text-muted">{d.auth.sub}</p>
        <OtpLogin locale={locale} d={d.auth} next={next} askName />
        <p className="mt-6 text-xs text-muted">{d.auth.terms}</p>
      </Card>
    </Container>
  );
}
