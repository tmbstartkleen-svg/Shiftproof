import { NextResponse } from "next/server";
import { demoFacilities, tenant } from "@/lib/demo";
import { getDemoTenantContext } from "@/lib/tenant";

export async function GET() {
  const ctx = getDemoTenantContext();
  const visible = demoFacilities.filter((f) => ctx.facilityIds.includes(f.id));
  const networkPxs = Math.round(visible.reduce((sum, f) => sum + f.pxs, 0) / Math.max(1, visible.length));
  return NextResponse.json({ ok: true, tenant, networkPxs, facilities: visible });
}