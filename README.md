# LingoLift

Minimal PWA for vocabulary with spaced repetition and Supabase sync.

## Run locally

Serve the folder over HTTP (ES modules), for example:

```bash
npx --yes serve .
```

After you change the app, do a **hard reload** (or close the tab) once so the new service worker and `app.js?…` URL load; the app calls `registration.update()` on load to pick up SW changes faster.

## Supabase

1. Create a project and run the SQL in [`sql/cards.sql`](sql/cards.sql) (and optional [`sql/add_group_label.sql`](sql/add_group_label.sql), [`sql/add_srs_step.sql`](sql/add_srs_step.sql) if the table already exists without those columns).
2. Enable **Authentication → Providers → Anonymous** sign-ins.
3. Configure the client:
   - **Local / fork:** edit [`js/supabase-config.js`](js/supabase-config.js) (`FALLBACK_URL` / `FALLBACK_KEY`) or copy [`js/supabase-config.example.js`](js/supabase-config.example.js), then paste your **Project URL** and **anon** key from **Project Settings → API** (legacy anon JWT tab if your dashboard shows new `sb_publishable_` keys).
   - **Static host (e.g. GitHub Pages) without committing keys:** add a **normal** (non-module) `<script>` **immediately before** the `app.js` module tag in [`index.html`](index.html), for example:  
     `globalThis.__LINGOLIFT_SUPABASE__ = { url: 'https://….supabase.co', anonKey: 'eyJ…' };`  
     [`js/supabase-config.js`](js/supabase-config.js) uses that object when both strings are non-empty, otherwise the `FALLBACK_*` constants in the file.

**Per-device data:** anonymous auth gives each browser profile its own `user_id`. Row counts in the Supabase table editor sum all users; the app only loads rows for the current session. See [`project-memory.md`](project-memory.md) (Sync flow) for details.

### Troubleshooting cloud sync

| Symptom | What to check |
|--------|----------------|
| Toast says **Supabase is not configured** | Set real `FALLBACK_*` values in `js/supabase-config.js`, **or** uncomment and fill `globalThis.__LINGOLIFT_SUPABASE__` in `index.html` (for deploy from git with placeholders). |
| **`42501`** / RLS / *policy* in the error | Table `cards` and RLS in [`sql/cards.sql`](sql/cards.sql); requests must run **after** anonymous sign-in (see sync flow in `project-memory.md`). |
| **`column … does not exist`** | Run the optional migrations [`sql/add_group_label.sql`](sql/add_group_label.sql) / [`sql/add_srs_step.sql`](sql/add_srs_step.sql) if your table predates those columns. |
| **401** / JWT | URL and anon key must be from the **same** project; check device clock; try a hard reload. |
| Anonymous sign-in fails | **Authentication → Providers → Anonymous** must be enabled for this project. |

Use DevTools → **Console** (and **Network** on `*.supabase.co`) to copy the exact error message; sync toasts include the server message when available.

## Handoff for AI / contributors

See [`project-memory.md`](project-memory.md) for architecture, sync behavior, and UI conventions.
