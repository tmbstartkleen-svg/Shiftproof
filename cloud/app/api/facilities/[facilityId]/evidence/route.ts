import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { assertFacilityAccess } from '@/lib/tenant';
import { listEvidence, storeEvidence } from '@/lib/evidence';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: Promise<{ facilityId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const { facilityId } = await params;
  try { assertFacilityAccess(session, facilityId); } catch {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  return NextResponse.json({ ok: true, evidence: await listEvidence(session.organizationId, facilityId) });
}

export async function POST(request: Request, { params }: { params: Promise<{ facilityId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const { facilityId } = await params;
  try { assertFacilityAccess(session, facilityId); } catch {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 });
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: 'file exceeds 50 MB server-upload limit' }, { status: 413 });
  }
  const evidence = await storeEvidence({
    organizationId: session.organizationId,
    facilityId,
    userId: session.userId,
    file,
  });
  return NextResponse.json({ ok: true, evidence }, { status: 201 });
}
