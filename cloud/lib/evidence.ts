import 'server-only';
import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { databaseConfigured, sql } from '@/lib/db';
import { evidenceStatus } from '@/lib/services';

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 120) || 'evidence.bin';
}

export async function storeEvidence(input: {
  organizationId: string;
  facilityId: string;
  userId: string;
  file: File;
}) {
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const status = evidenceStatus();
  let objectKey = `demo/evidence/${input.facilityId}/${Date.now()}-${safeName(input.file.name)}`;
  let url: string | null = null;

  if (status.configured) {
    const pathname = `evidence/${input.organizationId}/${input.facilityId}/${Date.now()}-${safeName(input.file.name)}`;
    const blob = await put(pathname, bytes, {
      access: 'private',
      contentType: input.file.type || 'application/octet-stream',
      addRandomSuffix: true,
    });
    objectKey = blob.pathname;
    url = blob.url;
  }

  if (!databaseConfigured()) {
    return {
      id: `demo_evidence_${Date.now()}`,
      objectKey,
      url,
      sha256,
      bytes: bytes.length,
      mimeType: input.file.type || null,
      provider: status.provider,
      demo: true,
    };
  }

  const [row] = await sql()`
    insert into evidence_objects(
      organization_id, facility_id, object_key, mime_type, sha256, bytes, created_by
    ) values(
      ${input.organizationId}::uuid,
      ${input.facilityId}::uuid,
      ${objectKey},
      ${input.file.type || null},
      ${sha256},
      ${bytes.length},
      ${input.userId}::uuid
    )
    returning id::text, object_key as "objectKey", mime_type as "mimeType",
      sha256, bytes, created_at as "createdAt"
  `;
  return { ...row, url, provider: status.provider };
}

export async function listEvidence(organizationId: string, facilityId: string) {
  if (!databaseConfigured()) return [];
  return await sql()`
    select id::text, object_key as "objectKey", mime_type as "mimeType", sha256,
      bytes, created_at as "createdAt", created_by::text as "createdBy"
    from evidence_objects
    where organization_id::text=${organizationId} and facility_id::text=${facilityId}
    order by created_at desc
    limit 100
  `;
}
