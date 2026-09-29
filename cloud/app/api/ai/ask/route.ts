import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/tenant";
import { askPlant } from "@/lib/ai";
export async function POST(req:Request){const s=await getSession();if(!s)return NextResponse.json({ok:false,error:'unauthorized'},{status:401});if(!can(s,'ai.ask'))return NextResponse.json({ok:false,error:'forbidden'},{status:403});const body=await req.json().catch(()=>({}));const q=String(body.question||'').trim();if(!q)return NextResponse.json({ok:false,error:'question required'},{status:400});return NextResponse.json({ok:true,...await askPlant(q)})}