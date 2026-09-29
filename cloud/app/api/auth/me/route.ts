import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
export async function GET(){const s=await getSession();return NextResponse.json({ok:Boolean(s),session:s?{...s,exp:undefined}:null},{status:s?200:401})}