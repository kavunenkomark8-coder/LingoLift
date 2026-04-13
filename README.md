# LingoLift

Minimal PWA for vocabulary with spaced repetition and Supabase sync.

## Run locally

Serve the folder over HTTP (ES modules), for example:

```bash
npx --yes serve .
```

## Supabase

1. Create a project and run the SQL in [`sql/cards.sql`](sql/cards.sql) (and optional [`sql/add_group_label.sql`](sql/add_group_label.sql), [`sql/add_srs_step.sql`](sql/add_srs_step.sql) if the table already exists without those columns).
2. Enable **Authentication → Providers → Anonymous** sign-ins.
3. Configure the client: copy [`js/supabase-config.example.js`](js/supabase-config.example.js) to `js/supabase-config.js` and paste your **Project URL** and **anon** key from **Project Settings → API**.

**Per-device data:** anonymous auth gives each browser profile its own `user_id`. Row counts in the Supabase table editor sum all users; the app only loads rows for the current session. See [`project-memory.md`](project-memory.md) (Sync flow) for details.

## Handoff for AI / contributors

See [`project-memory.md`](project-memory.md) for architecture, sync behavior, and UI conventions.
