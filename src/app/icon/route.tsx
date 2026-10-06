import { ImageResponse } from "next/og";
import { getSettings } from "@/modules/settings/service";

export const dynamic = "force-dynamic";

/** Favicon generated from the current brand name + colors (or fetched from the logo URL when set). */
export async function GET() {
  const { brand } = await getSettings();
  return new ImageResponse(
    (
      <div style={{ width: 64, height: 64, background: brand.primaryColor, color: brand.inkColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 900, borderRadius: 14 }}>
        {brand.name.slice(0, 1).toUpperCase()}
      </div>
    ),
    { width: 64, height: 64 },
  );
}
