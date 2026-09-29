import 'server-only';
import { databaseConfigured, sql } from '@/lib/db';

export type AuditInput = {
  organizationId: string;
  facilityId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  detail?: Record<string, unknown>;
};

export async function writeAuditEvent(input: AuditInput) {
  if (!databaseConfigured()) return { stored: false, mode: 'demo-fallback' as const };
  await sql()`
    insert into audit_events(organization_id, facility_id, user_id, action, entity_type, entity_id, detail)
    values(${input.organizationId}::uuid,${input.facilityId || null}::uuid,${input.userId || null}::uuid,${input.action},${input.entityType},${input.entityId},${sql().json(input.detail || {})})
  `;
  return { stored: true, mode: 'postgres' as const };
}

export async function listAuditEvents(organizationId: string, limit = 5000) {
  if (!databaseConfigured()) return [];
  return await sql()`
    select id::text, organization_id::text as "organizationId", facility_id::text as "facilityId",
           user_id::text as "userId", action, entity_type as "entityType", entity_id as "entityId",
           detail, created_at as "createdAt"
      from audit_events
     where organization_id::text = ${organizationId}
     order by created_at desc
     limit ${Math.min(Math.max(limit, 1), 10000)}
  `;
}

export function auditCsv(rows: any[]) {
  const headers = ['id','organizationId','facilityId','userId','action','entityType','entityId','createdAt','detail'];
  const esc = (v: unknown) => `"${String(v ?? '').replaceAll('"','""')}"`;
  return [headers.join(','), ...rows.map((r) => [r.id,r.organizationId,r.facilityId,r.userId,r.action,r.entityType,r.entityId,r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,JSON.stringify(r.detail || {})].map(esc).join(','))].join('\n');
}
