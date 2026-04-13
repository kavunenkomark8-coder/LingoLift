-- Run once in Supabase SQL Editor after the base `cards` table exists.
-- Stores SRS Easy-ladder index (0..4) for next Easy interval; Hard resets to 0.

alter table public.cards
  add column if not exists srs_step smallint not null default 0;

comment on column public.cards.srs_step is
  'Next Easy interval index: 0=2h, 1=6h, 2=24h, 3=72h, 4=1w. Hard sets 0.';
