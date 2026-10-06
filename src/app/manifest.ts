import type { MetadataRoute } from "next";
import { getSettings } from "@/modules/settings/service";

export const dynamic = "force-dynamic";

// PWA manifest follows the brand settings, so renaming the brand renames the installed app too.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { brand } = await getSettings();
  return {
    name: brand.name,
    short_name: brand.name.slice(0, 12),
    description: brand.tagline.en,
    start_url: "/",
    display: "standalone",
    background_color: brand.inkColor,
    theme_color: brand.primaryColor,
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
