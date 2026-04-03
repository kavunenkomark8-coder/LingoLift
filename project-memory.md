# LingoLift — project memory (for AI context)

**Document version:** 12  
**App / Service Worker cache:** `lingolift-v12` (`sw.js` → `CACHE = 'lingolift-v12'`)

**v12:** Added bi-directional smooth animation for "How to use". Introduced language pair selection for card inputs with dynamic Google Translate integration.

**Major pivot (v11, still applies): English-only UI.** Multi-language support (RU, UA, PT) and the header language switcher were removed for a cleaner, unified international experience. The app is **English-only**; `<html lang="en">` is fixed. **Core focus remains learning Portuguese vocabulary** (words often in PT, translations often in English). Legacy `localStorage` key `lingolift-lang` is cleared on load.

**v12 UI:** The Add card form includes **Source language** and **Target language** selects (Google codes `pt`, `en`, `ru`, `uk`). Defaults: source **PT**, target **EN**. Option labels use English language names (Portuguese, English, Russian, Ukrainian). The magic wand (🪄) calls Google GTX with **`sl`** and **`tl`** from those selects.

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

- **Fetch:** `fetchRemoteCards()` — RLS must scope rows to the authenticated user.
- **Writes:** Inserts/outbox include **`user_id`** from the session.
- **Outbox:** Offline/error replay via `flushOutbox(userId)`.

---

## How-to panel

- **Not** native `<details>` (v12): a **button** `#howto-toggle` toggles `.howto-panel--open` on `.howto-panel`. Content `#howto-content` uses **`max-height`** + **opacity** on `.howto-expand` and fade/slide on `.howto-inner` for open **and** close. `aria-expanded` / `aria-hidden` updated in `app.js`.

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
