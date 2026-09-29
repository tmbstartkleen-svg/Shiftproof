create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  subscription_tier text not null default 'pilot',
  created_at timestamptz not null default now()
);
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  identity_provider text not null default 'external',
  external_subject text,
  created_at timestamptz not null default now()
);
create table memberships (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  primary key (organization_id,user_id)
);
create table facilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null, code text, location text, sanitation_model text,
  created_at timestamptz not null default now()
);
create table facility_memberships (
  facility_id uuid not null references facilities(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  access_level text not null,
  primary key (facility_id,user_id)
);
create table evidence_objects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  facility_id uuid not null references facilities(id),
  object_key text not null,
  mime_type text,
  sha256 text not null,
  bytes bigint,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
create table integration_events (
  id bigserial primary key,
  organization_id uuid not null references organizations(id),
  facility_id uuid references facilities(id),
  connector_id text not null,
  event_type text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);
create table audit_events (
  id bigserial primary key,
  organization_id uuid not null references organizations(id),
  facility_id uuid references facilities(id),
  user_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_org_facility_created_idx on audit_events(organization_id,facility_id,created_at desc);
create index integration_events_org_received_idx on integration_events(organization_id,received_at desc);