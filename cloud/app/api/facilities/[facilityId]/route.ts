import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertFacilityAccess } from "@/lib/tenant";
import { demoFacilities, demoFacilityDetail } from "@/lib/demo";
export async function GET(_:Request,{params}:{params:Promise<{facilityId:string}>}){const s=await getSession();if(!s)return NextResponse.json({ok:false,error:'unauthorized'},{status:401});const {facilityId}=await params;try{assertFacilityAccess(s,facilityId)}catch{return NextResponse.json({ok:false,error:'forbidden'},{status:403})}const summary=demoFacilities.find(f=>f.id===facilityId);const detail=(demoFacilityDetail as Record<string,unknown>)[facilityId];if(!summary)return NextResponse.json({ok:false,error:'not found'},{status:404});return NextResponse.json({ok:true,summary,detail})}
