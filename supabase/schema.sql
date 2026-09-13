-- ===========================================================================
-- RSVP storage for the wedding invitation.
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> New query
-- -> paste -> Run.
-- ===========================================================================

create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text        not null check (char_length(name) > 0 and char_length(name) <= 100),
  contact     text        check (char_length(contact) <= 100),
  attending   boolean,
  guests      integer     not null default 1 check (guests >= 1 and guests <= 20),
  events      text[]      not null default '{}',
  message     text        check (char_length(message) <= 1000)
);

-- Row Level Security
alter table public.rsvps enable row level security;

-- 1. Anyone can INSERT a new RSVP.
drop policy if exists "anon can insert rsvp" on public.rsvps;
create policy "anon can insert rsvp"
  on public.rsvps for insert
  to anon
  with check (true);

-- 2. Anyone can SELECT ONLY rows that have a message (for the public wishes wall).
--    This prevents attackers from downloading your entire guest list.
drop policy if exists "anon can read public wishes" on public.rsvps;
create policy "anon can read public wishes"
  on public.rsvps for select
  to anon
  using (message is not null and char_length(trim(message)) > 0);

-- 3. Authenticated Admin can SELECT all rows.
drop policy if exists "admin can read all" on public.rsvps;
create policy "admin can read all"
  on public.rsvps for select
  to authenticated
  using (true);

-- 4. Authenticated Admin can DELETE rows.
drop policy if exists "admin can delete rsvp" on public.rsvps;
create policy "admin can delete rsvp"
  on public.rsvps for delete
  to authenticated
  using (true);

-- 5. No one can UPDATE anymore. (The frontend will be updated to insert a new row 
--    or we can allow anon to update ONLY IF they know the exact ID, but to be truly 
--    secure without auth, we should just disable UPDATE. If a guest submits twice, 
--    the admin can just see both entries or delete the duplicate).

create index if not exists rsvps_created_at_idx
  on public.rsvps (created_at desc);
