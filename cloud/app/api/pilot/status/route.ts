import { NextResponse } from 'next/server';
import { getSession, canAdmin } from '@/lib/auth';
import { pilotHardeningStatus } from '@/lib/pilot';
export async function GET(){const session=await getSession();if(!session)return NextResponse.json({ok:false,error:'unauthorized'},{status:401});if(!canAdmin(session.role))return NextResponse.json({ok:false,error:'forbidden'},{status:403});return NextResponse.json({ok:true,...(await pilotHardeningStatus(session.organizationId))})}
