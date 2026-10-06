import type { MetadataRoute } from "next";
import { env } from "@/shared/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/en/admin", "/hi/admin", "/en/driver", "/hi/driver", "/en/partner-portal", "/hi/partner-portal", "/en/account", "/hi/account", "/en/track/", "/hi/track/", "/en/invoice/", "/hi/invoice/"] }],
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
