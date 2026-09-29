import 'server-only';
import { databaseConfigured, sql } from '@/lib/db';
import { notificationStatus } from '@/lib/services';

export async function sendNotification(input: {
  organizationId: string;
  facilityId?: string | null;
  channel: string;
  destination: string;
  subject: string;
  message: string;
  eventType?: string;
}) {
  const status = notificationStatus();
  let deliveryStatus = 'skipped';
  let providerResponse: unknown = null;

  if (status.configured) {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (process.env.SHIFTPROOF_NOTIFICATION_WEBHOOK_TOKEN) {
      headers.authorization = `Bearer ${process.env.SHIFTPROOF_NOTIFICATION_WEBHOOK_TOKEN}`;
    }
    const response = await fetch(process.env.SHIFTPROOF_NOTIFICATION_WEBHOOK_URL!, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        channel: input.channel,
        destination: input.destination,
        subject: input.subject,
        message: input.message,
        eventType: input.eventType || 'shiftproof.notification',
        organizationId: input.organizationId,
        facilityId: input.facilityId || null,
      }),
    });
    deliveryStatus = response.ok ? 'sent' : 'failed';
    providerResponse = { status: response.status, ok: response.ok };
  }

  if (databaseConfigured()) {
    const [row] = await sql()`
      insert into notification_deliveries(
        organization_id, facility_id, channel, destination, subject, message,
        event_type, provider, status, provider_response
      ) values(
        ${input.organizationId}::uuid,
        ${input.facilityId || null}::uuid,
        ${input.channel}, ${input.destination}, ${input.subject}, ${input.message},
        ${input.eventType || 'shiftproof.notification'}, ${status.provider},
        ${deliveryStatus}, ${sql().json((providerResponse || {}) as any)}
      )
      returning id::text, status, created_at as "createdAt"
    `;
    return { ...row, provider: status.provider };
  }

  return { id: `demo_notification_${Date.now()}`, status: deliveryStatus, provider: status.provider, demo: true };
}
