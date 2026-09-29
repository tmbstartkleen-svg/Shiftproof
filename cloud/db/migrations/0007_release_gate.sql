create table if not exists recovery_drills(
  id bigserial primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id uuid references users(id),
  mode text not null,
  status text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists recovery_drills_org_created_idx on recovery_drills(organization_id,created_at desc);
