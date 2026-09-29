import { NextResponse } from 'next/server';
import { deploymentReadiness } from '@/lib/readiness';

export async function GET() {
  const readiness = deploymentReadiness();
  return NextResponse.json({ ok: readiness.previewReady, readiness }, { status: readiness.previewReady ? 200 : 503 });
}
