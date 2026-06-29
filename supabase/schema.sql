-- Run this in the Supabase SQL Editor to set up the database
-- Safe to re-run: drops existing policies before recreating them

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  round text not null check (round in ('r32','r16','qf','sf','final')),
  match_number integer not null,
  team1 text not null,
  team2 text not null,
  winner text,
  match_date timestamptz,
  created_at timestamptz default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade,
  match_id uuid references matches(id) on delete cascade,
  predicted_winner text not null,
  is_correct boolean,
  created_at timestamptz default now(),
  unique (participant_id, match_id)
);

-- Row Level Security
alter table matches enable row level security;
alter table participants enable row level security;
alter table predictions enable row level security;

-- Drop existing policies before recreating (safe to re-run)
do $$ declare pol record; begin
  for pol in select policyname, tablename from pg_policies where schemaname = 'public' and tablename in ('matches','participants','predictions')
  loop execute format('drop policy if exists %I on %I', pol.policyname, pol.tablename); end loop;
end $$;

create policy "Public read matches"          on matches      for select using (true);
create policy "Public insert matches"        on matches      for insert with check (true);
create policy "Public update matches"        on matches      for update using (true);
create policy "Public delete matches"        on matches      for delete using (true);

create policy "Public read participants"     on participants for select using (true);
create policy "Public insert participants"   on participants for insert with check (true);

create policy "Public read predictions"      on predictions  for select using (true);
create policy "Public insert predictions"    on predictions  for insert with check (true);
create policy "Public update predictions"    on predictions  for update using (true);
create policy "Public delete predictions"    on predictions  for delete using (true);
