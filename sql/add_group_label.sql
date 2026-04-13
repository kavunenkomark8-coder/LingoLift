-- Run once in Supabase SQL Editor after the base `cards` table exists.
-- Adds optional grouping for vocabulary cards (see LingoLift app).

alter table public.cards
  add column if not exists group_label text not null default '';

comment on column public.cards.group_label is 'User-defined deck subset label; empty = ungrouped.';
