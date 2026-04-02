-- LingoLift: run in Supabase SQL Editor (Dashboard → SQL → New query)

-- 1) Table
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word text not null,
  translation text not null,
  next_review timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cards_user_next_review_idx
  on public.cards (user_id, next_review);

-- 2) Keep updated_at fresh
create or replace function public.set_cards_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at
  before update on public.cards
  for each row
  execute function public.set_cards_updated_at();

-- 3) RLS
alter table public.cards enable row level security;

drop policy if exists "cards_select_own" on public.cards;
create policy "cards_select_own"
  on public.cards for select
  using (auth.uid() = user_id);

drop policy if exists "cards_insert_own" on public.cards;
create policy "cards_insert_own"
  on public.cards for insert
  with check (auth.uid() = user_id);

drop policy if exists "cards_update_own" on public.cards;
create policy "cards_update_own"
  on public.cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cards_delete_own" on public.cards;
create policy "cards_delete_own"
  on public.cards for delete
  using (auth.uid() = user_id);
