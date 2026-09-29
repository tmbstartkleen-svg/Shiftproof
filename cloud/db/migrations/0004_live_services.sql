create table if not exists notification_deliveries(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  facility_id uuid references facilities(id) on delete cascade,
  channel text not null,
  destination text not null,
  subject text not null,
  message text not null,
  event_type text not null default 'shiftproof.notification',
  provider text not null,
  status text not null,
  provider_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists notification_deliveries_org_created_idx
  on notification_deliveries(organization_id, created_at desc);
create index if not exists evidence_objects_facility_created_idx
  on evidence_objects(organization_id, facility_id, created_at desc);
