import { NextResponse } from 'next/server';
import { getSession, canAdmin } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  if (!canAdmin(session.role)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const result = await sendNotification({
    organizationId: session.organizationId,
    facilityId: body.facilityId || null,
    channel: body.channel || 'email',
    destination: body.destination || session.email,
    subject: body.subject || 'ShiftProof live-services test',
    message: body.message || 'ShiftProof notification provider is responding to the v13 test route.',
    eventType: 'shiftproof.live_services.test',
  });
  return NextResponse.json({ ok: true, result });
}
