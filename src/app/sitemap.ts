import type { MetadataRoute } from "next";
import { env } from "@/shared/lib/env";
import { getServices } from "@/modules/catalog/service";
import { getAreas, listLegalPages } from "@/modules/content/service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, areas, legal] = await Promise.all([getServices(), getAreas(), listLegalPages()]);
  const paths = ["", "/services", "/pricing", "/areas", "/about", "/contact", "/faq", "/partner", "/book", "/track", ...services.map((s) => `/services/${s.slug}`), ...areas.map((a) => `/areas/${a.slug}`), ...legal.map((l) => `/legal/${l.slug}`)];
  return paths.flatMap((path) =>
    (["en", "hi"] as const).map((l) => ({
      url: `${env.appUrl}/${l}${path}`,
      changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path.startsWith("/services") || path === "/book" ? 0.9 : 0.6,
      alternates: { languages: { en: `${env.appUrl}/en${path}`, hi: `${env.appUrl}/hi${path}` } },
    })),
  );
}
