import "server-only";
import crypto from "node:crypto";
import postgres from "postgres";
import { demoFacilities, tenant } from "@/lib/demo";

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const sql = databaseUrl ? postgres(databaseUrl, { max: 5, idle_timeout: 20 }) : null;

export type FacilitySummary = {
  id: string; name: string; location: string; model: string;
  pxs: number; oee: number; attainment: number; qaBlocks: number;
  sanitationMinutes: number; openIssues: number;
};

export function repositoryMode() { return sql ? "postgres" : "demo"; }

export async function getOrganization(organizationId: string) {
  if (!sql) return { id: organizationId, name: tenant.name, slug: "demo", subscription_tier: "pilot" };
  const rows = await sql`select id::text,name,slug,subscription_tier from organizations where id::text=${organizationId} limit 1`;
  return rows[0] || null;
}

export async function listFacilities(organizationId: string): Promise<FacilitySummary[]> {
  if (!sql) return demoFacilities as FacilitySummary[];
  const rows = await sql`
    select f.id::text,f.name,coalesce(f.location,'') location,coalesce(f.sanitation_model,'In-house') model
    from facilities f where f.organization_id::text=${organizationId} order by f.name`;
  return rows.map((r:any)=>({id:r.id,name:r.name,location:r.location,model:r.model,pxs:100,oee:0,attainment:0,qaBlocks:0,sanitationMinutes:0,openIssues:0}));
}

export async function listInvitations(organizationId: string) {
  if (!sql) return [];
  return sql`select id::text,email,role,status,facility_id::text,expires_at,created_at from invitations where organization_id::text=${organizationId} order by created_at desc limit 100`;
}

export async function createOrganization(name:string, slug:string) {
  if (!sql) throw new Error("Postgres is required for persistent organization creation.");
  const rows=await sql`insert into organizations(name,slug) values(${name},${slug}) returning id::text,name,slug`;
  await sql`insert into organization_settings(organization_id) values(${rows[0].id}::uuid) on conflict do nothing`;
  return rows[0];
}

export async function createFacility(organizationId:string, input:{name:string;code?:string;location?:string;sanitationModel?:string}) {
  if (!sql) throw new Error("Postgres is required for persistent facility creation.");
  const rows=await sql`insert into facilities(organization_id,name,code,location,sanitation_model) values(${organizationId}::uuid,${input.name},${input.code||null},${input.location||null},${input.sanitationModel||"In-house"}) returning id::text,name`;
  await sql`insert into facility_settings(facility_id) values(${rows[0].id}::uuid) on conflict do nothing`;
  return rows[0];
}

export async function createInvitation(input:{organizationId:string;facilityId?:string|null;email:string;role:string;invitedBy?:string|null}) {
  if (!sql) throw new Error("Postgres is required for persistent invitations.");
  const token=crypto.randomBytes(32).toString("base64url");
  const tokenHash=crypto.createHash("sha256").update(token).digest("hex");
  const expires=new Date(Date.now()+7*24*60*60*1000);
  const rows=await sql`insert into invitations(organization_id,facility_id,email,role,token_hash,invited_by,expires_at) values(${input.organizationId}::uuid,${input.facilityId||null}::uuid,${input.email.toLowerCase()},${input.role},${tokenHash},${input.invitedBy||null}::uuid,${expires}) returning id::text,email,role,status,expires_at`;
  return {...rows[0], token};
}

export async function findInvitationByToken(token:string) {
  if (!sql) return null;
  const hash=crypto.createHash("sha256").update(token).digest("hex");
  const rows=await sql`select i.id::text,i.email,i.role,i.status,i.expires_at,o.name organization_name,f.name facility_name from invitations i join organizations o on o.id=i.organization_id left join facilities f on f.id=i.facility_id where i.token_hash=${hash} limit 1`;
  return rows[0]||null;
}