import { ImageResponse } from "next/og";
import { getSettings } from "@/modules/settings/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { brand } = await getSettings();
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: brand.primaryColor, color: brand.inkColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120, fontWeight: 900 }}>
        {brand.name.slice(0, 1).toUpperCase()}
      </div>
    ),
    { width: 180, height: 180 },
  );
}
