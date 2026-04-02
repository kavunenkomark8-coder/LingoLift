-- One-time maintenance: merge cards from several anonymous users into one account.
-- Row Level Security only allows each device to read its own user_id, so the app
-- cannot combine them client-side. Run this in the Supabase SQL Editor as a project admin.
--
-- 1) Dashboard → Authentication → Users: copy the UUID you want to KEEP (target).
-- 2) Copy the other anonymous user UUIDs you want to merge away (sources).
-- 3) Uncomment, replace placeholders, and run once.

-- update public.cards
-- set user_id = 'TARGET-USER-UUID-TO-KEEP'
-- where user_id in (
--   'SOURCE-ANON-UUID-1',
--   'SOURCE-ANON-UUID-2'
-- );

-- To list distinct user_ids on cards (for copy/paste):
-- select distinct user_id, count(*) from public.cards group by user_id;
