# LingoLift — project memory (for AI context)

**Document version:** 11  
**App / Service Worker cache:** `lingolift-v11` (`sw.js` → `CACHE = 'lingolift-v11'`)

**Major pivot (v11): English-only UI.** Multi-language support (RU, UA, PT) and the header language switcher were removed for a cleaner, unified international experience. The app is **English-only**; `<html lang="en">` is fixed. **Core focus remains learning Portuguese vocabulary** (words in PT, translations typically in English). Legacy `localStorage` key `lingolift-lang` is cleared on load.

**UI simplified (v9.1 → still applies):** Cloud sync success shows **only ✅** on the footer button for ~1.5s — **no success toast**, no card-count copy (short `footerSyncCompleteAria` for screen readers only).

---

## Tech stack

- **Frontend:** Vanilla JS (ES modules), no framework. Entry: `index.html` → `js/app.js`.
- **UI strings:** `js/i18n.js` — single **`strings`** object (English); **`t(key, vars)`** and **`applyUiStrings()`** populate `[data-i18n]`, `[data-i18n-html]`, placeholders, titles. No `localStorage` language preference.
- **Data & cloud:** `js/data-store.js` — Supabase JS client (`@supabase/supabase-js` via importmap), anonymous auth session, table **`cards`**. **Supabase Storage is not used** in this repo.
- **Offline / PWA:** `sw.js` precaches shell assets; GET to `*.supabase.co` is network-first. Local cache: `localStorage` keys `lingolift-cards-cache`, `lingolift-sync-outbox`, legacy `lingolift-cards`.

---

## Brand / header

- **Minimal header:** Violet **dot** (`.brand-dot`) next to **LingoLift** title — no flag switcher.

---

## Spaced repetition

- **Intervals** (`data-store.js`): `HARD_MS` (~6 hours), `EASY_MS` (**3 days**).
- **Due today** (`app.js`): `nextReview` on or before end of local calendar day; queue sorted by `nextReview`. Progress bar uses `lingolift-day-stats`.

---

## Magic wand (Google GTX)

- **API:** `translate_a/single`, `client=gtx`, **`sl=pt`**, **`tl=en`** (Portuguese → English; matches English-only UI).
- **Parsing:** `parseGtxTranslation` joins segment strings from `data[0][*][0]`.
- **UX:** Empty word → shake word wrap. Loading → `.is-busy` on wand. Success → violet border flash on translation field. Same-string fallback → `toastTranslationNotFound`.

---

## UI rules (high level)

- **Theme:** Dark UI; **`--violet` / `--violet-glow`**, Outfit + JetBrains Mono.
- **Copy:** Tagline **Spaced repetition**; primary action **Repeat**; footer **Cloud sync**; session end toast **All done for today!**; how-to uses six English bullets (`howtoLi1`–`howtoLi6`) in `strings`.
- **Footer Cloud Sync:** Larger label font; success state **✅ only** briefly (`btn-footer-sync--success`).

---

## Sync flow, `user_id`, RLS

- **Fetch:** `fetchRemoteCards()` — RLS must scope rows to the authenticated user.
- **Writes:** Inserts/outbox include **`user_id`** from the session.
- **Outbox:** Offline/error replay via `flushOutbox(userId)`.

---

## How-to panel

- `<details class="howto-panel">` with `.howto-expand` grid animation (`css/styles.css`).

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
| PWA cache  | `sw.js`, `manifest.json` |

**When you change versioned behavior** (SW bump, sync contract, translate API, major UI rules), **update this file** so the next session stays aligned.
