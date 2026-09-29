import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/tenant";
import { demoFacilities, tenant } from "@/lib/demo";
export async function GET(){const s=await getSession();if(!s)return NextResponse.json({ok:false,error:'unauthorized'},{status:401});if(!can(s,'enterprise.read'))return NextResponse.json({ok:false,error:'forbidden'},{status:403});const visible=demoFacilities.filter(f=>s.facilityIds.includes(f.id));const networkPxs=Math.round(visible.reduce((sum,f)=>sum+f.pxs,0)/Math.max(1,visible.length));return NextResponse.json({ok:true,tenant,networkPxs,facilities:visible})}