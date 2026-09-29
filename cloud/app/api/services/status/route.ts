import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { liveServicesStatus } from '@/lib/services';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ ok: true, services: liveServicesStatus() });
}
