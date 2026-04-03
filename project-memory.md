# LingoLift — project memory (for AI context)

**Document version:** 15.1  
**App / Service Worker cache:** `lingolift-v15.1` (`sw.js` → `CACHE = 'lingolift-v15.1'`)

**v15.1:** Regenerated **high-resolution (~1024×1024) master** icon: crisp bold **L**, lifted/slanted, violet→deep-purple gradient, white squircle, letter **≥ ~80%** of canvas — then downscaled to **`icon-512.png`**, **`icon-192.png`**, and root **`android-chrome-*.png`** via **`icons/export-icon-sizes.ps1`**. Fixes blurry favicon when the browser scales up a tiny asset.

**v15:** Added custom branding: Minimalist “L” lifted icon and linked PWA favicons. **`index.html`** uses **`android-chrome-192x192.png`** / **`android-chrome-512x512.png`** at repo root for **`rel="icon"`** (with **`sizes`**) and **`apple-touch-icon`**. **`manifest.json`** icons point to the same files; **`theme_color`** **`#5B21B6`** (deep violet); **`background_color`** **`#0a0a0f`** (app shell). **`icons/`** holds **`icon-source.png`** (HQ master), **`icon-192.png`**, **`icon-512.png`** and **`export-icon-sizes.ps1`** for regenerating assets.

**v14:** Performance pass: leaner due-today queue, shared Supabase client in refresh/add/update paths, legacy migration refetch only when needed, GPU-friendlier review reveal and sync strip, resilient SW precache.

**v13.1 (still applies for UX):** No frog; dynamic sync strip; **`app--study`** hides footer / how-to / sync strip; large Hard/Easy; translation reveal animation.

**Major pivot (v11, still applies): English-only UI.** Multi-language support (RU, UA, PT) and the header language switcher were removed for a cleaner, unified international experience. The app is **English-only**; `<html lang="en">` is fixed. **Core focus remains learning Portuguese vocabulary** (words often in PT, translations often in English). Legacy `localStorage` key `lingolift-lang` is cleared on load.

**v12 UI (still applies):** The Add card form includes **Source language** and **Target language** selects (Google codes `pt`, `en`, `ru`, `uk`). Defaults: source **PT**, target **EN**. The magic wand (🪄) calls Google GTX with **`sl`** and **`tl`** from those selects.

---

## Optimization Log (v14)

- **`js/app.js`:** `dueTodayQueue` uses one **`endOfToday()`** read and a single pass + sort (no per-card `filter` callback); removed **`loadCards`** wrapper; **`parseGtxTranslation`** builds an array then **`join`**; cached DOM refs for how-to controls and add-card submit; **`void`** on fire-and-forget refresh.
- **`js/data-store.js`:** **`runRefreshPipeline`** uses **`const { client, userId } = await ensureSession()`** and passes **`client`** into **`flushOutbox`**, **`fetchRemoteCards`**, **`migrateLegacyIfNeeded`** to avoid redundant **`ensureClient()`**; **`migrateLegacyIfNeeded(userId, remote, client)`** reuses the first remote fetch and returns **`true`** only when legacy rows were inserted, then refetches once; **`addCard`** / **`updateCardNextReview`** use **`client`** from **`ensureSession()`** only.
- **`css/styles.css`:** Sync strip uses **`contain: layout`**, **`translateZ(0)`**, and opacity timing aligned with **`--sync-ease`** to reduce flicker; **`.flash-back-wrap`** uses **`translate3d`**, **`contain: content`**, **`backface-visibility: hidden`** for smoother compositing on mobile.
- **`sw.js`:** Install uses **`Promise.allSettled`** per asset so one failed URL does not block the rest; cache name bumped with versions (e.g. **`lingolift-v15.1`** after icon refresh).
- **`js/i18n.js`:** Removed unused string keys (**`toastSynced`**, **`toastEnterWord`**).

---

## Tech stack

- **Frontend:** Vanilla JS (ES modules), no framework. Entry: `index.html` → `js/app.js`.
- **UI strings:** `js/i18n.js` — single **`strings`** object (English); **`t(key, vars)`** and **`applyUiStrings()`** populate `[data-i18n]`, `[data-i18n-html]`, placeholders, titles. No `localStorage` language preference.
- **Data & cloud:** `js/data-store.js` — Supabase JS client (`@supabase/supabase-js` via importmap), anonymous auth session, table **`cards`**. **Supabase Storage is not used** in this repo.
- **Offline / PWA:** `sw.js` precaches shell assets; GET to `*.supabase.co` is network-first. Local cache: `localStorage` keys `lingolift-cards-cache`, `lingolift-sync-outbox`, legacy `lingolift-cards`.

---

## Brand / header

- **Minimal header:** Violet **dot** (`.brand-dot`) next to static **`h1.brand-name`** (“LingoLift” gradient). No logo button / frog.
- **PWA / favicons (v15):** Root **`android-chrome-192x192.png`** and **`android-chrome-512x512.png`** (copies of generated icons). **`meta name="theme-color"`** **`#5B21B6`** to match manifest tint.

---

## Spaced repetition

- **Intervals** (`data-store.js`): `HARD_MS` (~6 hours), `EASY_MS` (**3 days**).
- **Due today** (`app.js`): `nextReview` on or before end of local calendar day; queue built with a lightweight loop + sort. Progress bar uses `lingolift-day-stats`.

---

## Magic wand (Google GTX)

- **API:** `translate_a/single`, `client=gtx`, **`sl`** = Add card “Source language” (`#select-lang-source`), **`tl`** = “Target language” (`#select-lang-target`). Ukrainian uses code **`uk`** (UI label “Ukrainian”).
- **Parsing:** `parseGtxTranslation` joins segment strings from `data[0][*][0]`.
- **UX:** Empty word → shake word wrap. Loading → `.is-busy` on wand. Success → violet border flash on translation field. Same-string fallback → `toastTranslationNotFound`.

---

## UI rules (high level)

- **Theme:** Dark UI; **`--violet` / `--violet-glow`**, Outfit + JetBrains Mono.
- **Copy:** Tagline **Spaced repetition**; primary action **Repeat**; footer **Cloud sync**; session end toast **All done for today!**; how-to uses six English bullets (`howtoLi1`–`howtoLi6`) in `strings`.
- **Footer Cloud Sync:** Larger label font; success state **✅ only** briefly (`btn-footer-sync--success`).

---

## Sync flow, `user_id`, RLS

- **Fetch:** `fetchRemoteCards(client?)` — RLS must scope rows to the authenticated user.
- **Writes:** Inserts/outbox include **`user_id`** from the session.
- **Outbox:** Offline/error replay via **`flushOutbox(userId, client?)`**.

---

## How-to panel

- A **button** `#howto-toggle` toggles `.howto-panel--open` on `.howto-panel`. Content `#howto-content` uses **`max-height`** + **opacity** on `.howto-expand` and fade/slide on `.howto-inner` for open **and** close. `aria-expanded` / `aria-hidden` updated in `app.js`. Hidden when **`app--study`**.

---

## Future ideas (not implemented)

- Autocomplete when adding cards; stricter RLS docs; translation proxy if GTX fails; Supabase Storage if needed.

---

## Quick file map

| Area        | Files |
|------------|--------|
| UI shell   | `index.html`, `css/styles.css` |
| App logic  | `js/app.js` |
| UI strings | `js/i18n.js` |
| Supabase   | `js/data-store.js`, `js/supabase-config.js` |
| PWA cache  | `sw.js`, `manifest.json`, root `android-chrome-*.png` |

**When you change versioned behavior** (SW bump, sync contract, translate API, major UI rules), **update this file** so the next session stays aligned.
