import { NextResponse } from 'next/server';
import { deploymentControlStatus } from '@/lib/deploy';
import { deploymentReadiness } from '@/lib/readiness';

export async function GET() {
  return NextResponse.json({
    ok: true,
    deployment: deploymentControlStatus(),
    readiness: deploymentReadiness(),
  });
}
