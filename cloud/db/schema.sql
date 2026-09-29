create table organizations (
  id uuid primary key,
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);
create table facilities (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  name text not null,
  code text,
  location text,
  sanitation_model text,
  created_at timestamptz not null default now()
);
create table users (
  id uuid primary key,
  email text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);
create table memberships (
  organization_id uuid not null references organizations(id),
  user_id uuid not null references users(id),
  role text not null,
  primary key (organization_id, user_id)
);
create table facility_memberships (
  facility_id uuid not null references facilities(id),
  user_id uuid not null references users(id),
  access_level text not null,
  primary key (facility_id, user_id)
);
create table audit_events (
  id bigserial primary key,
  organization_id uuid not null,
  facility_id uuid,
  user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_org_facility_created_idx on audit_events(organization_id, facility_id, created_at desc);