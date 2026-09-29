create table if not exists rate_limit_counters(
  bucket_key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key(bucket_key,window_start)
);
create index if not exists rate_limit_counters_window_idx on rate_limit_counters(window_start);

create table if not exists pilot_checks(
  id bigserial primary key,
  organization_id uuid references organizations(id) on delete cascade,
  check_name text not null,
  status text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists pilot_checks_org_created_idx on pilot_checks(organization_id,created_at desc);
