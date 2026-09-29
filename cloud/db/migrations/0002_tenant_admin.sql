create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  facility_id uuid references facilities(id) on delete cascade,
  email text not null,
  role text not null,
  token_hash text unique not null,
  status text not null default 'pending',
  invited_by uuid references users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists organization_settings (
  organization_id uuid primary key references organizations(id) on delete cascade,
  timezone text not null default 'America/Chicago',
  locale text not null default 'en-US',
  require_mfa boolean not null default false,
  evidence_retention_days integer not null default 365,
  updated_at timestamptz not null default now()
);

create table if not exists facility_settings (
  facility_id uuid primary key references facilities(id) on delete cascade,
  timezone text not null default 'America/Chicago',
  production_day_start time not null default '06:00',
  sanitation_day_start time not null default '22:00',
  proof_required_by_default boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists invitations_org_status_idx on invitations(organization_id,status,created_at desc);