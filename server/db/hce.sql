create table if not exists hce_runs(
  id uuid primary key default gen_random_uuid(),
  seed bigint not null,
  params jsonb not null,
  created_at timestamptz not null default now()
);
