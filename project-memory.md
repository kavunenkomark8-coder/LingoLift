# LingoLift — project memory (for AI context)

**Document version:** 9.1 (memory snapshot)  
**App / Service Worker cache:** `lingolift-v9.1` (`sw.js` → `CACHE = 'lingolift-v9.1'`)

**UI simplified (v9.1):** Cloud sync success shows **only ✅** on the footer button for ~1.5s — **no toast** and **no card-count copy** for that action (screen readers get a short generic `footerSyncCompleteAria`, not a count).

---

## Tech stack

- **Frontend:** Vanilla JS (ES modules), no framework. Entry: `index.html` → `js/app.js`.
- **i18n:** `js/i18n.js` — `translations` for `en`, `ru`, `ua`, `pt`; `applyLanguage()`, `t()`, `LANG_CYCLE`, `getLang()` / `getCurrentLang()`.
- **Data & cloud:** `js/data-store.js` — Supabase JS client (`@supabase/supabase-js` via importmap), anonymous auth session, table **`cards`** (`id`, `user_id`, `word`, `translation`, `next_review`, …). **Supabase Storage is not used** in this repo.
- **Offline / PWA:** `sw.js` precaches shell assets; GET to `*.supabase.co` is network-first in the SW fetch handler. Local cache: `localStorage` keys `lingolift-cards-cache`, `lingolift-sync-outbox`, legacy `lingolift-cards`.

---

## Language switcher (flags)

- **UI:** `#btn-lang-cycle` in header (`index.html`), class `brand-flag`; stacked SVG flags (RU, UA, EN, PT). CSS shows the active flag via `[data-active-lang="…"]` on the button.
- **Cycle order:** `LANG_CYCLE` in `i18n.js` is `['ru', 'ua', 'en', 'pt']` (RU → UA → EN → PT → …).
- **Persistence:** `localStorage` key `lingolift-lang` (`LANG_STORAGE_KEY`).
- **HTML `lang`:** `ua` maps to `uk` on `<html>` for accessibility.
- **On change:** `applyLanguage(next)` updates all `[data-i18n]`, `[data-i18n-html]`, placeholders, ARIA; `app.js` also calls `renderDashboard()`, `updateSyncLabel()`, and study UI updates when relevant.

---

## Spaced repetition & “review cycle” (not a fixed 3-day calendar)

- **Intervals** (`data-store.js`): `HARD_MS = 6 * 60 * 60 * 1000` (~6 hours), `EASY_MS = 3 * 24 * 60 * 60 * 1000` (**3 days**). Exported for `app.js`.
- **Grading:** In study mode, **Hard** / **Easy** updates `nextReview` via `updateCardNextReview()` (then sync/outbox as needed).
- **“Due today”** (`app.js`): cards whose `nextReview` is on or before **end of local calendar day** are due; queue sorted by `nextReview`. Progress bar uses a per-day peak/remaining model (`lingolift-day-stats`).

---

## Magic wand auto-translate (Google GTX, v9)

- **Trigger:** `#btn-translate-wand` next to translation input (`runAutoTranslate` in `app.js`).
- **API:** `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=…&dt=t&q=…` — source language **always `pt`**; **`tl`** from `gtxTargetLang()`: `ru`, `uk` (UI `ua`), `en` for `en`/`pt`/default.
- **Parsing:** `parseGtxTranslation(data)` walks `data[0][*][0]` and joins (handles multi-segment responses); result **trimmed**.
- **UX:** Empty word → shake `#field-word-wrap` only (no API). Loading → `.is-busy` on wand (spin + ~0.5 opacity). Success → brief **violet** border flash on `.field-input-wrap` (class `field-input-wrap--flash`). If trimmed output equals word (case-insensitive) → **do not** fill translation; toast `toastTranslationNotFound`. Errors → toast `alertTranslationFailed` (no `alert`).
- **i18n:** `translateWandTooltip` per language (unchanged since v8-style copy).

---

## UI rules (high level)

- **Theme:** Dark UI; primary accent **`--violet` / `--violet-glow`** (`css/styles.css`), Outfit + JetBrains Mono.
- **Headers / titles:** Many use centered or single-line patterns (e.g. `panel-title--single-line`, `howto-summary` centered with ellipsis).
- **Buttons:** Several primary/actions use **`btn-text-nowrap`** to avoid wrapped labels.
- **Footer Cloud Sync:** `#btn-force-sync` — label font scaled up (`calc(0.65rem * 2.25)`). On successful **force sync**, label is replaced by **✅ only** for **1.5s** (`btn-footer-sync--success`), then restored — **no success toast**, no synced-card count in UI. Localized `forceSync` strings (e.g. Cloud sync / Облако / Хмара / Sincro). Optional a11y: `footerSyncCompleteAria` (no count).

---

## Sync flow, `user_id`, RLS

- **Client queries:** `fetchRemoteCards()` does `.from('cards').select(...)` **without** an explicit `user_id` filter in JS — **row visibility must be enforced by Supabase RLS** (policies per authenticated user).
- **Writes:** Inserts/outbox flush set **`user_id`** from `ensureSession()` / `auth.uid()` context.
- **Outbox:** Offline or failed writes queue in `lingolift-sync-outbox`; `flushOutbox(userId)` replays inserts/updates.
- **States:** `syncState`: `idle` | `syncing` | `offline` | `error`; footer status line and tap-to-retry on error where implemented.
- **User hint:** `accountHint` can show truncated id from `getLastSyncedUserId()` after successful sync.

---

## How-to copy (i18n)

- Six bullets `howtoLi1`–`howtoLi6` per locale describe usage, cloud sync, `user_id = auth.uid()`, and RLS reminders (`js/i18n.js`).
- **How-to panel:** `<details class="howto-panel">` with `.howto-expand` grid animation + inner fade/slide (`css/styles.css`).

---

## Future ideas (not implemented)

- Richer **autocomplete** / suggestions when adding cards.
- **Stricter or documented RLS** examples in repo; optional **explicit `.eq('user_id', …)`** in queries as defense-in-depth if policies change.
- Official translation backend/proxy if Google GTX endpoint becomes unreliable (CORS/rate limits).
- Supabase **Storage** if assets or user files are needed later.

---

## Quick file map

| Area        | Files |
|------------|--------|
| UI shell   | `index.html`, `css/styles.css` |
| App logic  | `js/app.js` |
| i18n       | `js/i18n.js` |
| Supabase   | `js/data-store.js`, `js/supabase-config.js` (URL + anon key) |
| PWA cache  | `sw.js`, `manifest.json` |

**When you change versioned behavior** (SW bump, sync contract, translate API, major UI rules), **update this file** so the next session stays aligned.
