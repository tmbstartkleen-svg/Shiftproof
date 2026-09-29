create table if not exists schema_migrations(version text primary key,applied_at timestamptz not null default now());
create table if not exists plant_records(id uuid primary key default gen_random_uuid(),organization_id uuid not null references organizations(id) on delete cascade,facility_id uuid not null references facilities(id) on delete cascade,record_type text not null,status text not null,title text not null,data jsonb not null default '{}'::jsonb,occurred_at timestamptz not null default now(),created_by uuid references users(id),created_at timestamptz not null default now());
create index if not exists plant_records_facility_time_idx on plant_records(organization_id,facility_id,occurred_at desc);
create index if not exists plant_records_type_status_idx on plant_records(record_type,status);
alter table invitations add column if not exists accepted_user_id uuid references users(id);
alter table invitations add column if not exists accepted_at timestamptz;
