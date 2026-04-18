# LingoLift — project memory (for AI context)

**Document version:** 21.26 (Remove Info howto-hero image)  
**App / Service Worker cache:** `lingolift-v79-no-howto-hero` (`sw.js` → `CACHE = 'lingolift-v79-no-howto-hero'`)

**v21.26:** **Info** panel: removed **`.howto-hero`** strip and **`icons/howto-hero.svg`** (no decorative image between toggle and content). **`styles.css?v=79-no-howto-hero`**, SW **`lingolift-v79-no-howto-hero`**. Historical **v21.21**–**v21.22** hero notes remain for archive only.

**v21.25:** Parallel deck-open scroll uses **`parallelDelta = max(estimate, needLive)`** (live viewport gap after 2× rAF) and **`limitDoc`** from **`scrollYWhenClosed` + innerHeight** paired with **`closedBottomDoc`** at click. Skip parallel only if **`parallelDelta < 0.5`**. **`v21.24`** **`scrollFinalized`** + smooth remainder unchanged. **`app.js?v=78-deck-scroll-need-live`**.

**v21.24:** **My deck** remainder: **`scrollFinalized`** + **`scrollTo(..., behavior: 'smooth')`** (no double **`scrollBy`**).

**v21.23:** **My deck** open scroll: **`closedBottomDoc`** snapshot before **`deck-panel--open`** (see **v21.23**).

**v21.22:** **`howto-hero.svg`** bottom gradient no longer uses near-black **`#0a0a12`**; added lower violet wash (**`glow2`** anchored at bottom). **`.howto-hero`**: **`line-height: 0`**, fallback **`background`**, **`object-fit: fill`** on img so the strip fills rounded corners without a gap. **`styles.css?v=75-howto-hero-fill`**, SW **`lingolift-v75-howto-hero-fill`**.

**v21.21:** Under **Info** (**.`howto-summary`**): **`.howto-hero`** full-bleed strip (**`width: calc(100% + 1.5rem)`**, negative side margins) with **`icons/howto-hero.svg`**; height **`calc(3 * var(--howto-bar-h))`** where **`--howto-bar-h: 2.85rem`** on **`.howto-panel--compact`** and **`min-height`** on the summary. Decorative **`alt=""`**. SW precaches **`./icons/howto-hero.svg`**.

**v21.20:** **My deck** open: **one** **`scrollTo`** animation over **460ms** with **`cubic-bezier(0.33, 1, 0.68, 1)`** (same as **`grid-template-rows`**), from estimated **`inner.scrollHeight` + open chrome** ( **`0.85rem`×2 + 1px** ); **`transitionend`** / timeout only nudges remainder. Replaces per-frame Δ tracking. **`index.html`** **`app.js?v=73-deck-scroll-smooth-ease`**. SW **`lingolift-v73-deck-scroll-smooth-ease`**.

**v21.19:** **My deck** open scroll: **Δ (`rect.bottom + scrollY`)** per rAF (superseded by **v21.20**).

**v21.18:** **My deck** open scroll: viewport **Δ `bottom`** (superseded).

**v21.17:** **`.dashboard-grid`** uses **`align-content: flex-start`** (mobile column) and **`align-content: start`** + explicit **`grid-template-rows: auto auto auto`** (desktop ≥960px) so when the grid is taller than its content (**`flex: 1`** in a **`min-height: 100dvh`** shell, e.g. strong zoom-out), rows are **not** stretched by the default grid **`align-content: stretch`** — removes huge gaps between **Due/Add** row, **stats**, and **My deck**. **`min-height: 0`** on the grid helps flex shrinking. **`styles.css?v=70-dashboard-grid-align`**. SW **`lingolift-v70-dashboard-grid-align`**.

**v21.16:** **My deck** toggle (**.`deck-panel__summary`**) is a **centered** compact **pill** (`width: auto`, **`inline-flex`**, padding, **`border-radius: 999px`**) instead of full-width; **`.deck-panel`** is a **column flex** so the expand block stays full width. **`styles.css?v=69-deck-summary-centered`**. SW **`lingolift-v69-deck-summary-centered`**.

**v21.15:** Footer **`#btn-force-sync`** removed. **`h1#brand-sync`** (**`.brand-name`**, **`role="button"`**) runs **`forceFullSyncFromSupabase()`**; on **`r.ok`** calls **`location.reload()`** (no ✅, no success toasts, including **`skippedStale`**). Errors still use **`toastOfflineCloud`** / **`toastSyncFailed`** / **`toastSyncFailedReason`**. Inactive during **study** (same as former footer visibility). **`data-i18n-aria`** → **`brandSyncAria`**. **`howtoLi4`** updated. **`index.html`** **`app.js?v=68-brand-sync-title`**, **`styles.css?v=68-brand-sync-title`**. SW **`lingolift-v68-brand-sync-title`**.

**v21.14:** Deck-open **rAF** scroll uses a **px/sec** ceiling (**`68 * 60`**, i.e. same as **68px** per **60Hz** frame) instead of a fixed **px/frame** cap, so **120Hz+** desktops don’t chase the panel **twice as fast** in real time (which felt like teleporting). **`index.html`** **`app.js?v=67-deck-scroll-velocity`**. SW **`lingolift-v67-deck-scroll-velocity`**.

**v21.13:** **rAF** deck-open scroll with a per-frame **~68px** cap toward the gap; final catch-up **> 0.5px**.

**v21.12:** Opening **My deck** (unless **`prefers-reduced-motion: reduce`**) runs a **`requestAnimationFrame`** loop **in parallel** with the expand: each frame scrolls to close the gap under the panel bottom (tracks **`getBoundingClientRect`**). Stops on **`transitionend`** (**`grid-template-rows`**) or **580ms** cap, with a final catch-up. Reduced motion: single scroll after **`transitionend`** / timeout. Closing cancels pending rAF/listener. **`styles.css?v=62-deck-scroll`**.

**v21.11:** **`#account-hint`** moved from **stats panel** into **Info** (**`.howto-inner`**, below the how-to list); **`howtoTitle`** string **Info** (was “How to use”). **`index.html`** **`app.js?v=61-info-account-hint`**. SW **`lingolift-v61-info-account-hint`**. Styles **`.howto-account-hint`**.

**v21.10:** **`startReview`** builds the session queue from **`dueNowQueue(filtered)`**, not the full filtered pool — study progress (**words left**) matches the dashboard ratio **`due / pool`**. When **nothing is due**, **Repeat** is disabled and **`toastNothingDue`** covers edge taps. **`index.html`** **`app.js?v=60-repeat-due-queue`**. SW **`lingolift-v60-repeat-due-queue`**. Supersedes **v20.1** “full pool” Repeat behavior.

**v21.8:** **[`js/supabase-config.js`](js/supabase-config.js)** picks **`url`** / **`anonKey`** from **`__LINGOLIFT_SUPABASE__`** only when that value is **not** a **`YOUR_*`** placeholder; otherwise uses **`FALLBACK_*`** (avoids example globals wiping real defaults). **`index.html`** **`app.js?v=59-supabase-pick`**. SW **`lingolift-v59-supabase-pick`**.

**v21.7:** **[`js/supabase-config.js`](js/supabase-config.js)** resolves **`SUPABASE_URL`** / **`SUPABASE_ANON_KEY`** from **`globalThis.__LINGOLIFT_SUPABASE__`** (`url`, `anonKey`) when set before modules load, else **`FALLBACK_*`** in file. README documents static hosting. **`ensureClient`** error text mentions override. **`index.html`** **`app.js?v=58-supabase-override`**. SW **`lingolift-v58-supabase-override`**.

**v21.6:** Study **`updateSessionProgress`** shows **`studyWordsLeft`** / **`studyWordsLeftOne`**: **`queue.length - queueIndex`** = cards **not yet graded** this Repeat run (including current card). **`index.html`** **`app.js?v=57-words-left-round`**. SW **`lingolift-v57-words-left-round`**.

**v21.5:** Study header shows **`studySessionPosition`** **`{queueIndex+1} / {queue.length}`** instead of “N left in session”. **`gradesToday`** / **`gradesTodayTitle`** clarify **reviews** = every Hard/Easy (Repeat loops can exceed deck size). **`index.html`** **`app.js?v=56-session-position`**. SW **`lingolift-v56-session-position`**.

**v21.4:** SW **network-first** for same-origin **`.html` / `.js` / `.css` / `/`** so UI fixes are not stuck on old cache-first shell. **`grade()`** calls **`bumpGradesToday()`** + **`renderDashboard()`** after **`updateCardSrs`**; dashboard shows **`gradesToday`** under the due line (**`#progress-grades-today`**). **`index.html`** **`app.js?v=55-sw-network-first`**, **`styles.css?v=55-progress-grades-line`**. SW precache CSS query aligned.

**v21.3:** Dashboard header **`dueToday`** string → **Due now**; count uses **`dueNowQueue`** (**`nextReview <= Date.now()`**) instead of end-of-calendar-day, so **Hard** (+15 min) lowers the visible ratio immediately. **`studyRemaining`** copy → **left in session**. **`reviewHintFullPool`** clarifies empty **Due now** vs **Repeat** full pool. **`index.html`** **`js/app.js?v=54-due-now-count`**. SW **`lingolift-v54-due-now-count`**.

**v21.2:** Tracked **[`js/supabase-config.js`](js/supabase-config.js)** with placeholders (removed from **`.gitignore`** so clones and SW precache always resolve the module). **`ensureClient()`** throws a clear error if URL/key still contain **`YOUR_*`** placeholders. **`formatSyncErr`** includes PostgREST **`code`** and **`hint`** when present. **[`README.md`](README.md)** — **Troubleshooting cloud sync** table. **`index.html`** loads **`js/app.js?v=53-sync-diagnostics`**. SW **`lingolift-v53-sync-diagnostics`**.

**v21.1:** Dashboard **`accountHint`** states explicitly **this device only** and how to match Supabase row counts (**`where user_id = …`**). **`index.html`** loads **`js/app.js?v=52-account-hint`** so updates are not masked by disk cache. **`registerSW()`** calls **`reg.update()`** after registration to pick up a new SW sooner. SW **`lingolift-v52-script-cache-bust`**.

**v21.0:** **Sync expectations** documented (anonymous **per device** vs SQL row counts; dashboard account id vs **`user_id`**). **`flushOutbox`** failures set **`lastOutboxFlushError`** + **`console.error('[LingoLift] outbox', …)`**; **`getLastOutboxFlushError()`** exposed for tooltips (**`#sync-status`**, **`#account-hint`**). Stale **`setCards(remote)`** skip schedules **`scheduleDeferredRefreshMerge()`** (~1.4s deferred **`refreshFromRemote`**). **Cloud sync** shows **`toastSyncStaleRetrying`** when **`skippedStale`**, not the footer ✅ flash. Removed temporary **debug ingest** `fetch` blocks. Added **[`README.md`](README.md)** and **[`js/supabase-config.example.js`](js/supabase-config.example.js)**. How-to strings **`howtoLi3`** / **`howtoLi6`** updated. SW **`lingolift-v51-sync-ux-docs`**.

**v20.9:** **`grade()`** uses **`gradeInFlight`**: overlapping Hard/Easy (double tap, swipe + key, etc.) is ignored so a second call cannot reuse the same **`queueIndex`** / stale **`srsStep`**. After **`updateCardSrs`**, the current queue slot is replaced with the canonical object from **`getCards()`** ( **`setCards`** replaces in-store references, so the study queue could otherwise keep stale refs). Hard/Easy buttons disabled for the await window. SW **`lingolift-v50-grade-single-flight`**.

**v20.8:** **Study grades** no longer **`await refreshFromRemote()`** after a successful cloud **`update`** in **`updateCardSrs`** (local cache + Supabase row are already updated; full fetch was redundant and could race with an in-flight refresh). **`localDataEpoch`** is bumped on local writes (**`addCard`**, **`updateCardSrs`**, **`updateCardFields`**, **`deleteCard`**); **`runRefreshPipeline`** skips **`setCards(remote)`** if the epoch changed mid-flight so a slow init sync cannot overwrite fresh SRS. SW **`lingolift-v49-srs-stale-refresh-guard`**.

**v20.7:** Old DBs without **`group_label`**: **`fetchRemoteCards`** tries **`FETCH_SELECT_CHAIN`** (drop **`srs_step`**, then **`group_label`**, then both). **`insertCardWithCloudFallback`** / **`migrateLegacyIfNeeded`** mirror that. **`update_fields`** (outbox + **`updateCardFields`**) retries without **`group_label`**. Session flags **`dbSupportsGroupLabelColumn`** / **`dbSupportsSrsStepColumn`**. Run [sql/add_group_label.sql](sql/add_group_label.sql) in Supabase for full grouping in the cloud. SW **`lingolift-v48-group-label-fallback`**.

**v20.6:** Unconditional **retry** of card **select/insert** when optional **`srs_step`** payload fails (superseded by **v20.7** chain). SW **`lingolift-v46-srs-unconditional-fallback`**.

**v20.5:** **`runRefreshPipeline`** resets **`dbSupportsSrsStepColumn`** to **`true`** each sync so the client re-probes **`srs_step`** after SQL. SW **`lingolift-v44-srs-reprobe`**.

**v20.4:** **`getLastSyncError`** / **`lastSyncError`** in **`js/data-store.js`**; failed refresh returns **`detail`**; footer **Cloud sync** toast shows **`toastSyncFailedReason`**; **`#sync-status`** **`title`** tooltip when sync is error. SW **`lingolift-v43-sync-error-detail`**.

**v20.3:** Removed temporary **debug ingest** `fetch` logging from **`runRefreshPipeline`** / **`fetchRemoteCards`**. SW **`lingolift-v42-no-debug-ingest`**.

**v20.2:** If Supabase has **no `srs_step` column** (migration not run), **`js/data-store.js`** retries **fetch / insert / update / outbox / legacy migrate** without that field and keeps **`srsStep` client-only** for the tab session. Avoids permanent **Sync error** until SQL is applied. SW **`lingolift-v41-srs-sync-fallback`**.

**v20.1:** **Repeat** queued **all** cards in the group filter (superseded by **v21.10** — due-only queue). Dashboard showed **`due / pool`**. Removed **`lingolift-day-stats`** / **`getDayStats`**. Stylesheet **`?v=40-full-pool-queue`**.

**v20.0:** **SRS ladder** in **`js/data-store.js`** / **`js/app.js`**: **Hard** → next review **+15 min** and **`srs_step` → 0**; **Easy** uses next delay from **`[2h, 6h, 24h, 72h, 1w]`** by current step, then increments step (capped at **1w** repeat). **`updateCardSrs`** replaces **`updateCardNextReview`**; outbox **`update`** includes **`srs_step`**. Supabase column **`srs_step`** — new installs in [sql/cards.sql](sql/cards.sql); existing DBs run [sql/add_srs_step.sql](sql/add_srs_step.sql). **Due-brain** (`#due-brain-visual`): class **`due-brain-visual--drained`** when there are **no due cards** today (after `renderDashboard`); CSS disables liquid shimmer, slightly longer emptying transition, dimmer outline. Stylesheet **`?v=39-srs-brain`**.

**v19.5:** Removed temporary **debug ingest / `console.log`** blocks from **`js/app.js`**. SW **`lingolift-v38-no-debug-logs`**.

**v19.4:** **`@media (prefers-reduced-motion: reduce)`** no longer sets **`transition-duration: 0.01ms`** on **`.howto-expand`**, **`.deck-panel__expand`**, or **`.deck-panel__inner`** (those values made accordions **snap open** whenever the OS reports reduced motion). Inner content fade (**.howto-inner**) and chrome (**.deck-panel__summary::after**, **`.field--new-group`**, **`.howto-panel`**, **`.select-lang`**) still shorten. Stylesheet **`?v=37-prm-disclosure`**, SW **`lingolift-v37-prm-disclosure`**.

**v19.3:** **How to** / **My deck** use **`grid-template-rows: 0fr` → `1fr`** (with **`.howto-expand__surf`**). **`renderDeckList`** only when deck is open.

**v19.2:** Disclosure panels used numeric **`max-height`** end states; **`.main`** **`overflow-anchor: none`**.

**v19.1:** **My deck** and **New group** row use the same disclosure pattern as **How to use**: `max-height` + opacity transitions (not `hidden`); **How to** panel gets a light open-state border. **`.select-lang`** uses slightly longer easing on border/shadow/background.

**v19:** **Word groups** (`group_label` in Supabase, `groupLabel` on client cards). Duplicate words are allowed in **different** groups only (`isWordDuplicateInGroup`). **Group for review** (`#select-study-group`) filters the study pool and dashboard counts; choice persisted in `localStorage` key `lingolift-study-group-filter` (`''` = all groups, `__none__` = ungrouped only). **v21.10:** **Repeat** uses **due** cards in that filter only. **Add card** form: group `<select>` (`#select-add-group`) with **New group…** (`__new__`) + `#input-new-group-name`. **My deck** collapsible panel: search, group filter, list with **Edit** / **Delete**; edits use `updateCardFields`, deletes use `deleteCard` with outbox ops `update_fields` and `delete`. **v21.25:** on open, parallel **`max(estimate, needLive)`**; **smooth** finalize once (**v21.24**–**v21.25**). **Language pair** for GTX (`#select-lang-source` / `#select-lang-target`) persisted in `localStorage` key `lingolift-lang-pair`. **`<datalist id="datalist-words">`** on `#input-word` suggests existing words in the **currently selected add-group** (including typed new group name). **Study swipe** (touch only): after answer is shown, horizontal swipe on `#study-card` triggers Hard (left) / Easy (right); disabled when `prefers-reduced-motion: reduce`. **SQL:** new installs include `group_label` in [sql/cards.sql](sql/cards.sql); existing DBs run [sql/add_group_label.sql](sql/add_group_label.sql). RLS unchanged (`user_id` policies already cover update/delete).

**v18 (SW hard reset):** Cache name bumps; **`install`** calls **`self.skipWaiting()`** first; **`activate`** deletes **all** caches whose name is not the current **`CACHE`**, then **`clients.claim()`**.

**v15.3 (Restored):** Rolled back from OCR/Camera experiment. Restored stable minimalist UI with bilingual card support and magic auto-translate. **Tesseract.js**, camera button, photo input, and scanning overlay removed from **`index.html`** / **`app.js`** / **`i18n.js`** / **`css/styles.css`**. Service Worker uses **core app precache only** (no OCR CDN URLs) so clients drop stale Tesseract entries from cache.

**v15.2:** **App avatar** is the user-provided **L** icon screenshot (`icons/icon-source.png`). **`export-icon-sizes.ps1`** crops to a **center square** then exports **192** / **512** and root **`android-chrome-*.png`**. **`theme_color`** **`#5312B1`** (deep purple from gradient).

**v15.1:** Regenerated **high-resolution (~1024×1024) master** icon: crisp bold **L**, lifted/slanted, violet→deep-purple gradient, white squircle, letter **≥ ~80%** of canvas — then downscaled to **`icon-512.png`**, **`icon-192.png`**, and root **`android-chrome-*.png`** via **`icons/export-icon-sizes.ps1`**. Fixes blurry favicon when the browser scales up a tiny asset.

**v15:** Added custom branding: Minimalist “L” lifted icon and linked PWA favicons. **`index.html`** uses **`android-chrome-192x192.png`** / **`android-chrome-512x512.png`** at repo root for **`rel="icon"`** (with **`sizes`**) and **`apple-touch-icon`**. **`manifest.json`** icons point to the same files; **`theme_color`** now **`#5312B1`** (see v15.2); **`background_color`** **`#0a0a0f`** (app shell). **`icons/`** holds **`icon-source.png`**, **`icon-192.png`**, **`icon-512.png`** and **`export-icon-sizes.ps1`** for regenerating assets.

**v14:** Performance pass: leaner due-today queue, shared Supabase client in refresh/add/update paths, legacy migration refetch only when needed, GPU-friendlier review reveal and sync strip, resilient SW precache.

**v13.1 (still applies for UX):** No frog; dynamic sync strip; **`app--study`** hides how-to / sync strip; large Hard/Easy; translation reveal animation.

**Major pivot (v11, still applies): English-only UI.** Multi-language support (RU, UA, PT) and the header language switcher were removed for a cleaner, unified international experience. The app is **English-only**; `<html lang="en">` is fixed. **Core focus remains learning Portuguese vocabulary** (words often in PT, translations often in English). Legacy `localStorage` key `lingolift-lang` is cleared on load.

**v12 UI (still applies):** The Add card form includes **Source language** and **Target language** selects (Google codes `pt`, `en`, `ru`, `uk`). Defaults: source **PT**, target **EN**. The magic wand (🪄) calls Google GTX with **`sl`** and **`tl`** from those selects. **v19:** those selects also persist via **`lingolift-lang-pair`**.

---

## Optimization Log (v14)

- **`js/app.js`:** `dueNowQueue` ( **`nextReview <= Date.now()`** ) for dashboard ratio; removed end-of-day-only count so **Hard** visibly updates the header. **`parseGtxTranslation`** builds an array then **`join`**; cached DOM refs for how-to controls and add-card submit; **`void`** on fire-and-forget refresh.
- **`js/data-store.js`:** **`runRefreshPipeline`** uses **`const { client, userId } = await ensureSession()`** and passes **`client`** into **`flushOutbox`**, **`fetchRemoteCards`**, **`migrateLegacyIfNeeded`** to avoid redundant **`ensureClient()`**; **`migrateLegacyIfNeeded(userId, remote, client)`** reuses the first remote fetch and returns **`true`** only when legacy rows were inserted, then refetches once; **`addCard`** / **`updateCardSrs`** use **`client`** from **`ensureSession()`** only.
- **`css/styles.css`:** Sync strip uses **`contain: layout`**, **`translateZ(0)`**, and opacity timing aligned with **`--sync-ease`** to reduce flicker; **`.flash-back-wrap`** uses **`translate3d`**, **`contain: content`**, **`backface-visibility: hidden`** for smoother compositing on mobile.
- **`sw.js`:** Install uses **`Promise.allSettled`** per asset so one failed URL does not block the rest; **`self.skipWaiting()`** at start of **`install`**; cache name bumped with versions (e.g. **`lingolift-v33-deck-groups`** for shell assets); **`activate`** purges non-current caches.
- **`js/i18n.js`:** **`[data-i18n-aria]`** in **`applyUiStrings()`** (**v21.15**). Removed unused string keys (**`toastSynced`**, **`toastEnterWord`**) in earlier passes; OCR strings removed in v15.3 restore.

---

## Tech stack

- **Frontend:** Vanilla JS (ES modules), no framework. Entry: `index.html` → `js/app.js`.
- **UI strings:** `js/i18n.js` — single **`strings`** object (English); **`t(key, vars)`** and **`applyUiStrings()`** populate `[data-i18n]`, `[data-i18n-html]`, placeholders, titles, **`[data-i18n-aria]`**. No `localStorage` language preference for UI locale (English fixed); **`lingolift-lang-pair`** stores only GTX source/target codes.
- **Data & cloud:** `js/data-store.js` — Supabase JS client (`@supabase/supabase-js` via importmap), anonymous auth session, table **`cards`** with **`group_label`** and **`srs_step`**. Credentials in **`js/supabase-config.js`** (copy from **`js/supabase-config.example.js`**). **Supabase Storage is not used** in this repo.
- **Offline / PWA:** `sw.js` precaches shell assets + icons; GET to `*.supabase.co` is network-first; **`cdn.jsdelivr.net`** and **`esm.sh`** are cache-first for offline libs (e.g. Supabase ESM). Local cache: `localStorage` keys `lingolift-cards-cache`, `lingolift-sync-outbox`, legacy `lingolift-cards`; **`lingolift-study-group-filter`**, **`lingolift-lang-pair`**.

---

## Brand / header

- **Minimal header:** Violet **dot** (`.brand-dot`) next to **`h1.brand-name`** (**`#brand-sync`**, “LingoLift” gradient). **Tap / Enter / Space:** full cloud pull (**`forceFullSyncFromSupabase`**) then **page reload** on success (**v21.15**). Disabled while **study** view is active. No frog.
- **PWA / favicons (v15+):** Root **`android-chrome-192x192.png`** and **`android-chrome-512x512.png`**. **`meta name="theme-color"`** **`#5312B1`** to match manifest tint.

---

## Spaced repetition

- **Intervals** (`data-store.js`): **`HARD_DELAY_MS`** (**15 minutes**); **Easy** steps **`EASY_INTERVALS_MS`**: **2h → 6h → 24h → 72h → 1 week** (then **1 week** again). **`computeNextSrs(hard, srsStep)`** / **`updateCardSrs`**. Client field **`srsStep`** (0..4): index of the next Easy delay; Hard resets to **0**.
- **Due now** (`app.js`): **`nextReview <= Date.now()`** (`dueNowQueue`). **v21.10:** **Repeat** queues only **due** cards in the **Group for review** filter (same set as the dashboard numerator). Header **`dueNow / poolTotal`**; due-brain fill **`due / pool`**. **v19:** filter is **Group for review** (all / ungrouped / one named group).

---

## Magic wand (Google GTX)

- **API:** `translate_a/single`, `client=gtx`, **`sl`** = Add card “Source language” (`#select-lang-source`), **`tl`** = “Target language” (`#select-lang-target`). Ukrainian uses code **`uk`** (UI label “Ukrainian”).
- **Parsing:** `parseGtxTranslation` joins segment strings from `data[0][*][0]`.
- **UX:** Empty word → shake word wrap. Loading → `.is-busy` on wand. Success → violet border flash on translation field. Same-string fallback → `toastTranslationNotFound`.

---

## UI rules (high level)

- **Theme:** Dark UI; **`--violet` / `--violet-glow`**, Outfit + JetBrains Mono.
- **Copy:** Tagline **Spaced repetition**; primary action **Repeat**; **LingoLift** title = cloud pull + reload (**v21.15**); session end toast **All done for today!**; **Info** panel bullets in `strings` (`howtoLi1`–`howtoLi9`).

---

## Sync flow, `user_id`, RLS

- **Anonymous = per device/profile:** `signInAnonymously()` creates a distinct **`auth.users`** row per browser storage partition. RLS policies in [`sql/cards.sql`](sql/cards.sql) restrict **`cards`** to **`auth.uid() = user_id`**. The dashboard hint **Synced · account …{id}** is the tail of that UUID — it should match **`user_id`** on rows this client owns. **`select count(*) from public.cards`** in SQL Editor counts **every** user's rows, so it will not match the in-app card count unless you filter by **`user_id`**.
- **Fetch:** `fetchRemoteCards(client?)` — adaptive **`FETCH_SELECT_CHAIN`** (drops **`group_label`** / **`srs_step`** when missing on old DBs); RLS scopes rows to the authenticated user.
- **Writes:** Inserts/outbox include **`user_id`** from the session.
- **Outbox:** Offline/error replay via **`flushOutbox(userId, client?)`**. Ops: **`insert`** (with optional `group_label`, **`srs_step`**), **`update`** (SRS **`next_review`** + **`srs_step`**), **`update_fields`** (word, translation, `group_label`), **`delete`**. Failures set **`lastOutboxFlushError`** and **`console.error('[LingoLift] outbox', …)`**; **`getLastOutboxFlushError()`** surfaces the latest message in the sync tooltip with **`getLastSyncError()`**.
- **Stale refresh skip:** If **`localDataEpoch`** changes while **`runRefreshPipeline`** is in flight, **`setCards(remote)`** is skipped (avoids overwriting fresh SRS). The pipeline returns **`{ ok: true, skippedStale: true }`** and schedules a **deferred** **`refreshFromRemote()`** (~1.4s) to merge when idle. **Manual title sync** (**v21.15**): **`r.ok`** (including **`skippedStale`**) → **`location.reload()`** with no extra toast.
- **Deploy config:** Copy [`js/supabase-config.example.js`](js/supabase-config.example.js) → **`js/supabase-config.js`**; see [README.md](README.md).

---

## How-to panel (Info)

- UI label **Info** (`howtoTitle`). A **button** `#howto-toggle` toggles `.howto-panel--open` on `.howto-panel`. Content `#howto-content` follows the button directly (**v21.26:** no hero image). **`max-height`** + **opacity** on `.howto-expand` and fade/slide on `.howto-inner` for open **and** close. **`#account-hint`** (sync account + SQL note) lives **below** the bullet list inside **`.howto-inner`**. `aria-expanded` / `aria-hidden` updated in `app.js`. Hidden when **`app--study`**.

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
| Supabase   | `js/data-store.js`, `js/supabase-config.js`, `js/supabase-config.example.js`, `sql/cards.sql`, `sql/add_group_label.sql` |
| PWA cache  | `sw.js`, `manifest.json`, root `android-chrome-*.png` |
| Onboarding | `README.md` |

**When you change versioned behavior** (SW bump, sync contract, translate API, major UI rules), **update this file** so the next session stays aligned.
