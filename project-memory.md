# LingoLift — project memory (for AI context)

**Document version:** 20.6 (SRS unconditional cloud fallback)  
**App / Service Worker cache:** `lingolift-v46-srs-unconditional-fallback` (`sw.js` → `CACHE = 'lingolift-v46-srs-unconditional-fallback'`)

**v20.6:** **`fetchRemoteCards`**: if the **`srs_step`** select fails for **any** reason, retry **legacy select** once; on success, mark DB without **`srs_step`**. Same pattern for **insert/update** (outbox, **`addCard`**, **`updateCardSrs`**, legacy migrate): retry payload **without** **`srs_step`** when the first attempt included it; **`markDbSrsColumnUnsupported`** only when that retry succeeds. SW **`lingolift-v46-srs-unconditional-fallback`**.

**v20.5:** **`runRefreshPipeline`** resets **`dbSupportsSrsStepColumn`** to **`true`** each sync so the client re-probes **`srs_step`** after SQL. SW **`lingolift-v44-srs-reprobe`**.

**v20.4:** **`getLastSyncError`** / **`lastSyncError`** in **`js/data-store.js`**; failed refresh returns **`detail`**; footer **Cloud sync** toast shows **`toastSyncFailedReason`**; **`#sync-status`** **`title`** tooltip when sync is error. SW **`lingolift-v43-sync-error-detail`**.

**v20.3:** Removed temporary **debug ingest** `fetch` logging from **`runRefreshPipeline`** / **`fetchRemoteCards`**. SW **`lingolift-v42-no-debug-ingest`**.

**v20.2:** If Supabase has **no `srs_step` column** (migration not run), **`js/data-store.js`** retries **fetch / insert / update / outbox / legacy migrate** without that field and keeps **`srsStep` client-only** for the tab session. Avoids permanent **Sync error** until SQL is applied. SW **`lingolift-v41-srs-sync-fallback`**.

**v20.1:** **Repeat** queues **all** cards matching **Group for review** (not only due-by-midnight). Dashboard **Due today** count shows **`dueToday / poolTotal`** (`progressDueInPool`); **due-brain** fill uses the same ratio (equals **1** when every card in the pool is due today). Removed **`lingolift-day-stats`** / **`getDayStats`**. Stylesheet **`?v=40-full-pool-queue`**.

**v20.0:** **SRS ladder** in **`js/data-store.js`** / **`js/app.js`**: **Hard** → next review **+15 min** and **`srs_step` → 0**; **Easy** uses next delay from **`[2h, 6h, 24h, 72h, 1w]`** by current step, then increments step (capped at **1w** repeat). **`updateCardSrs`** replaces **`updateCardNextReview`**; outbox **`update`** includes **`srs_step`**. Supabase column **`srs_step`** — new installs in [sql/cards.sql](sql/cards.sql); existing DBs run [sql/add_srs_step.sql](sql/add_srs_step.sql). **Due-brain** (`#due-brain-visual`): class **`due-brain-visual--drained`** when there are **no due cards** today (after `renderDashboard`); CSS disables liquid shimmer, slightly longer emptying transition, dimmer outline. Stylesheet **`?v=39-srs-brain`**.

**v19.5:** Removed temporary **debug ingest / `console.log`** blocks from **`js/app.js`**. SW **`lingolift-v38-no-debug-logs`**.

**v19.4:** **`@media (prefers-reduced-motion: reduce)`** no longer sets **`transition-duration: 0.01ms`** on **`.howto-expand`**, **`.deck-panel__expand`**, or **`.deck-panel__inner`** (those values made accordions **snap open** whenever the OS reports reduced motion). Inner content fade (**.howto-inner**) and chrome (**.deck-panel__summary::after**, **`.field--new-group`**, **`.howto-panel`**, **`.select-lang`**) still shorten. Stylesheet **`?v=37-prm-disclosure`**, SW **`lingolift-v37-prm-disclosure`**.

**v19.3:** **How to** / **My deck** use **`grid-template-rows: 0fr` → `1fr`** (with **`.howto-expand__surf`**). **`renderDeckList`** only when deck is open.

**v19.2:** Disclosure panels used numeric **`max-height`** end states; **`.main`** **`overflow-anchor: none`**.

**v19.1:** **My deck** and **New group** row use the same disclosure pattern as **How to use**: `max-height` + opacity transitions (not `hidden`); **How to** panel gets a light open-state border. **`.select-lang`** uses slightly longer easing on border/shadow/background.

**v19:** **Word groups** (`group_label` in Supabase, `groupLabel` on client cards). Duplicate words are allowed in **different** groups only (`isWordDuplicateInGroup`). **Group for review** (`#select-study-group`) filters the study pool and dashboard counts; choice persisted in `localStorage` key `lingolift-study-group-filter` (`''` = all groups, `__none__` = ungrouped only). **v20.1:** **Repeat** uses the full filtered list, not only due-today cards. **Add card** form: group `<select>` (`#select-add-group`) with **New group…** (`__new__`) + `#input-new-group-name`. **My deck** collapsible panel: search, group filter, list with **Edit** / **Delete**; edits use `updateCardFields`, deletes use `deleteCard` with outbox ops `update_fields` and `delete`. **Language pair** for GTX (`#select-lang-source` / `#select-lang-target`) persisted in `localStorage` key `lingolift-lang-pair`. **`<datalist id="datalist-words">`** on `#input-word` suggests existing words in the **currently selected add-group** (including typed new group name). **Study swipe** (touch only): after answer is shown, horizontal swipe on `#study-card` triggers Hard (left) / Easy (right); disabled when `prefers-reduced-motion: reduce`. **SQL:** new installs include `group_label` in [sql/cards.sql](sql/cards.sql); existing DBs run [sql/add_group_label.sql](sql/add_group_label.sql). RLS unchanged (`user_id` policies already cover update/delete).

**v18 (SW hard reset):** Cache name bumps; **`install`** calls **`self.skipWaiting()`** first; **`activate`** deletes **all** caches whose name is not the current **`CACHE`**, then **`clients.claim()`**.

**v15.3 (Restored):** Rolled back from OCR/Camera experiment. Restored stable minimalist UI with bilingual card support and magic auto-translate. **Tesseract.js**, camera button, photo input, and scanning overlay removed from **`index.html`** / **`app.js`** / **`i18n.js`** / **`css/styles.css`**. Service Worker uses **core app precache only** (no OCR CDN URLs) so clients drop stale Tesseract entries from cache.

**v15.2:** **App avatar** is the user-provided **L** icon screenshot (`icons/icon-source.png`). **`export-icon-sizes.ps1`** crops to a **center square** then exports **192** / **512** and root **`android-chrome-*.png`**. **`theme_color`** **`#5312B1`** (deep purple from gradient).

**v15.1:** Regenerated **high-resolution (~1024×1024) master** icon: crisp bold **L**, lifted/slanted, violet→deep-purple gradient, white squircle, letter **≥ ~80%** of canvas — then downscaled to **`icon-512.png`**, **`icon-192.png`**, and root **`android-chrome-*.png`** via **`icons/export-icon-sizes.ps1`**. Fixes blurry favicon when the browser scales up a tiny asset.

**v15:** Added custom branding: Minimalist “L” lifted icon and linked PWA favicons. **`index.html`** uses **`android-chrome-192x192.png`** / **`android-chrome-512x512.png`** at repo root for **`rel="icon"`** (with **`sizes`**) and **`apple-touch-icon`**. **`manifest.json`** icons point to the same files; **`theme_color`** now **`#5312B1`** (see v15.2); **`background_color`** **`#0a0a0f`** (app shell). **`icons/`** holds **`icon-source.png`**, **`icon-192.png`**, **`icon-512.png`** and **`export-icon-sizes.ps1`** for regenerating assets.

**v14:** Performance pass: leaner due-today queue, shared Supabase client in refresh/add/update paths, legacy migration refetch only when needed, GPU-friendlier review reveal and sync strip, resilient SW precache.

**v13.1 (still applies for UX):** No frog; dynamic sync strip; **`app--study`** hides footer / how-to / sync strip; large Hard/Easy; translation reveal animation.

**Major pivot (v11, still applies): English-only UI.** Multi-language support (RU, UA, PT) and the header language switcher were removed for a cleaner, unified international experience. The app is **English-only**; `<html lang="en">` is fixed. **Core focus remains learning Portuguese vocabulary** (words often in PT, translations often in English). Legacy `localStorage` key `lingolift-lang` is cleared on load.

**v12 UI (still applies):** The Add card form includes **Source language** and **Target language** selects (Google codes `pt`, `en`, `ru`, `uk`). Defaults: source **PT**, target **EN**. The magic wand (🪄) calls Google GTX with **`sl`** and **`tl`** from those selects. **v19:** those selects also persist via **`lingolift-lang-pair`**.

---

## Optimization Log (v14)

- **`js/app.js`:** `dueTodayQueue` uses one **`endOfToday()`** read and a single pass + sort (no per-card `filter` callback); removed **`loadCards`** wrapper; **`parseGtxTranslation`** builds an array then **`join`**; cached DOM refs for how-to controls and add-card submit; **`void`** on fire-and-forget refresh.
- **`js/data-store.js`:** **`runRefreshPipeline`** uses **`const { client, userId } = await ensureSession()`** and passes **`client`** into **`flushOutbox`**, **`fetchRemoteCards`**, **`migrateLegacyIfNeeded`** to avoid redundant **`ensureClient()`**; **`migrateLegacyIfNeeded(userId, remote, client)`** reuses the first remote fetch and returns **`true`** only when legacy rows were inserted, then refetches once; **`addCard`** / **`updateCardSrs`** use **`client`** from **`ensureSession()`** only.
- **`css/styles.css`:** Sync strip uses **`contain: layout`**, **`translateZ(0)`**, and opacity timing aligned with **`--sync-ease`** to reduce flicker; **`.flash-back-wrap`** uses **`translate3d`**, **`contain: content`**, **`backface-visibility: hidden`** for smoother compositing on mobile.
- **`sw.js`:** Install uses **`Promise.allSettled`** per asset so one failed URL does not block the rest; **`self.skipWaiting()`** at start of **`install`**; cache name bumped with versions (e.g. **`lingolift-v33-deck-groups`** for shell assets); **`activate`** purges non-current caches.
- **`js/i18n.js`:** Removed unused string keys (**`toastSynced`**, **`toastEnterWord`**) in earlier passes; OCR strings removed in v15.3 restore.

---

## Tech stack

- **Frontend:** Vanilla JS (ES modules), no framework. Entry: `index.html` → `js/app.js`.
- **UI strings:** `js/i18n.js` — single **`strings`** object (English); **`t(key, vars)`** and **`applyUiStrings()`** populate `[data-i18n]`, `[data-i18n-html]`, placeholders, titles. No `localStorage` language preference for UI locale (English fixed); **`lingolift-lang-pair`** stores only GTX source/target codes.
- **Data & cloud:** `js/data-store.js` — Supabase JS client (`@supabase/supabase-js` via importmap), anonymous auth session, table **`cards`** with **`group_label`** and **`srs_step`**. **Supabase Storage is not used** in this repo.
- **Offline / PWA:** `sw.js` precaches shell assets + icons; GET to `*.supabase.co` is network-first; **`cdn.jsdelivr.net`** and **`esm.sh`** are cache-first for offline libs (e.g. Supabase ESM). Local cache: `localStorage` keys `lingolift-cards-cache`, `lingolift-sync-outbox`, legacy `lingolift-cards`; **`lingolift-study-group-filter`**, **`lingolift-lang-pair`**.

---

## Brand / header

- **Minimal header:** Violet **dot** (`.brand-dot`) next to static **`h1.brand-name`** (“LingoLift” gradient). No logo button / frog.
- **PWA / favicons (v15+):** Root **`android-chrome-192x192.png`** and **`android-chrome-512x512.png`**. **`meta name="theme-color"`** **`#5312B1`** to match manifest tint.

---

## Spaced repetition

- **Intervals** (`data-store.js`): **`HARD_DELAY_MS`** (**15 minutes**); **Easy** steps **`EASY_INTERVALS_MS`**: **2h → 6h → 24h → 72h → 1 week** (then **1 week** again). **`computeNextSrs(hard, srsStep)`** / **`updateCardSrs`**. Client field **`srsStep`** (0..4): index of the next Easy delay; Hard resets to **0**.
- **Due today** (`app.js`): `nextReview` on or before end of local calendar day (`dueTodayQueue`). **v20.1:** **Repeat** shuffles and reviews the **entire filtered pool** (same group filter). Header count **`due / poolTotal`**; due-brain fill **`due / poolTotal`**. **v19:** filter is **Group for review** (all / ungrouped / one named group).

---

## Magic wand (Google GTX)

- **API:** `translate_a/single`, `client=gtx`, **`sl`** = Add card “Source language” (`#select-lang-source`), **`tl`** = “Target language” (`#select-lang-target`). Ukrainian uses code **`uk`** (UI label “Ukrainian”).
- **Parsing:** `parseGtxTranslation` joins segment strings from `data[0][*][0]`.
- **UX:** Empty word → shake word wrap. Loading → `.is-busy` on wand. Success → violet border flash on translation field. Same-string fallback → `toastTranslationNotFound`.

---

## UI rules (high level)

- **Theme:** Dark UI; **`--violet` / `--violet-glow`**, Outfit + JetBrains Mono.
- **Copy:** Tagline **Spaced repetition**; primary action **Repeat**; footer **Cloud sync**; session end toast **All done for today!**; how-to bullets in `strings` (`howtoLi1`–`howtoLi9`).
- **Footer Cloud Sync:** Larger label font; success state **✅ only** briefly (`btn-footer-sync--success`).

---

## Sync flow, `user_id`, RLS

- **Fetch:** `fetchRemoteCards(client?)` — selects `id, word, translation, next_review, group_label, srs_step`; RLS must scope rows to the authenticated user.
- **Writes:** Inserts/outbox include **`user_id`** from the session.
- **Outbox:** Offline/error replay via **`flushOutbox(userId, client?)`**. Ops: **`insert`** (with optional `group_label`, **`srs_step`**), **`update`** (SRS **`next_review`** + **`srs_step`**), **`update_fields`** (word, translation, `group_label`), **`delete`**.

---

## How-to panel

- A **button** `#howto-toggle` toggles `.howto-panel--open` on `.howto-panel`. Content `#howto-content` uses **`max-height`** + **opacity** on `.howto-expand` and fade/slide on `.howto-inner` for open **and** close. `aria-expanded` / `aria-hidden` updated in `app.js`. Hidden when **`app--study`**.

---

## Future ideas (not implemented)

- Stricter RLS docs; translation proxy if GTX fails; Supabase Storage if needed.

---

## Quick file map

| Area        | Files |
|------------|--------|
| UI shell   | `index.html`, `css/styles.css` |
| App logic  | `js/app.js` |
| UI strings | `js/i18n.js` |
| Supabase   | `js/data-store.js`, `js/supabase-config.js`, `sql/cards.sql`, `sql/add_group_label.sql` |
| PWA cache  | `sw.js`, `manifest.json`, root `android-chrome-*.png` |

**When you change versioned behavior** (SW bump, sync contract, translate API, major UI rules), **update this file** so the next session stays aligned.
