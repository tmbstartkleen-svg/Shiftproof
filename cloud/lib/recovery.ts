import 'server-only';
import { databaseConfigured, sql } from '@/lib/db';
import { listFacilities, listPlantRecords } from '@/lib/repository';
import { listAuditEvents } from '@/lib/audit';
import { listEvidence } from '@/lib/evidence';

export async function recoveryReadiness(organizationId: string) {
  if (!databaseConfigured()) return { database: false, applicationExport: true, lastExportAt: null, mode: 'demo-fallback' };
  const [last] = await sql()`
    select created_at as "createdAt" from audit_events
     where organization_id::text=${organizationId} and action='backup.export'
     order by created_at desc limit 1
  `;
  return { database: true, applicationExport: true, lastExportAt: last?.createdAt || null, mode: 'postgres-application-export',
    note: 'Application export complements, but does not replace, provider-managed physical database backups.' };
}

export async function buildApplicationBackup(organizationId: string, actorUserId: string) {
  const facilities = await listFacilities(organizationId);
  const recordsByFacility: Record<string, unknown[]> = {};
  const evidenceByFacility: Record<string, unknown[]> = {};
  for (const f of facilities) {
    recordsByFacility[f.id] = await listPlantRecords(organizationId, f.id);
    evidenceByFacility[f.id] = await listEvidence(organizationId, f.id);
  }
  const auditEvents = await listAuditEvents(organizationId, 10000);
  if (databaseConfigured()) {
    await sql()`insert into audit_events(organization_id,user_id,action,entity_type,entity_id,detail)
      values(${organizationId}::uuid,${actorUserId}::uuid,'backup.export','organization',${organizationId},${sql().json({facilityCount: facilities.length, auditEventCount: auditEvents.length})})`;
  }
  return {
    format: 'shiftproof-application-backup-v1', generatedAt: new Date().toISOString(), organizationId,
    facilities, recordsByFacility, evidenceByFacility, auditEvents,
    limitations: ['Not a physical PostgreSQL snapshot','Does not include private blob bytes','Restore must verify tenant IDs and evidence object availability'],
  };
}
