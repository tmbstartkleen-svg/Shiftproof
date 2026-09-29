import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createFacility, listFacilities } from "@/lib/repository";

function admin(role:string){return ["Plant Manager","Administrator","Owner"].includes(role)}
export async function GET(){const s=await getSession();if(!s)return NextResponse.json({error:"unauthorized"},{status:401});return NextResponse.json({facilities:await listFacilities(s.organizationId)});}
export async function POST(req:Request){const s=await getSession();if(!s)return NextResponse.json({error:"unauthorized"},{status:401});if(!admin(s.role))return NextResponse.json({error:"forbidden"},{status:403});const b=await req.json();if(!b.name)return NextResponse.json({error:"name required"},{status:400});try{return NextResponse.json({ok:true,facility:await createFacility(s.organizationId,b)},{status:201});}catch(e:any){return NextResponse.json({error:e.message},{status:400});}}