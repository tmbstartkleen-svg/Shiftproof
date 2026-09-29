alter table schema_migrations add column if not exists checksum text;

create unique index if not exists facilities_org_code_unique
  on facilities(organization_id, code)
  where code is not null;

alter table notification_deliveries add column if not exists attempts integer not null default 0;
alter table notification_deliveries add column if not exists next_attempt_at timestamptz;
alter table notification_deliveries add column if not exists last_attempt_at timestamptz;
alter table notification_deliveries add column if not exists last_error text;
create index if not exists notification_deliveries_retry_idx
  on notification_deliveries(status, next_attempt_at, created_at);
