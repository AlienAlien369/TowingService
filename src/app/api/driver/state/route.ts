import { NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/modules/auth/session";
import { getDriverState } from "@/modules/dispatch/driver-state";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const driver = await db.driver.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!driver) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json(await getDriverState(driver.id), { headers: { "Cache-Control": "no-store" } });
}
