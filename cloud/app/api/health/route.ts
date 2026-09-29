import { NextResponse } from 'next/server';
import { liveServicesStatus } from '@/lib/services';
export async function GET(){return NextResponse.json({ok:true,version:'13.0.0',services:liveServicesStatus(),activation:{onboarding:true,invitations:true,plantRecords:true,evidence:true,notifications:true,migrations:true}})}
