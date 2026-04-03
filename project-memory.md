# LingoLift — project memory (for AI context)

**Document version:** 13.1  
**App / Service Worker cache:** `lingolift-v13.1` (`sw.js` → `CACHE = 'lingolift-v13.1'`)

**v13.1:** Removed frog animation. Finalized smooth dynamic syncing layout and focused review UI.

**v13 (superseded details):** Dynamic sync strip, study-mode chrome hiding, enlarged grade buttons — retained; **frog easter egg removed** in v13.1.

**Major pivot (v11, still applies): English-only UI.** Multi-language support (RU, UA, PT) and the header language switcher were removed for a cleaner, unified international experience. The app is **English-only**; `<html lang="en">` is fixed. **Core focus remains learning Portuguese vocabulary** (words often in PT, translations often in English). Legacy `localStorage` key `lingolift-lang` is cleared on load.

**v12 UI (still applies):** The Add card form includes **Source language** and **Target language** selects (Google codes `pt`, `en`, `ru`, `uk`). Defaults: source **PT**, target **EN**. The magic wand (🪄) calls Google GTX with **`sl`** and **`tl`** from those selects.

**v13.1 layout / sync:** **`#sync-dynamic-row`** sits between the tagline and “How to use”, with inner **`.sync-dynamic-row__inner`** so the strip uses **`display: grid; grid-template-rows: 0fr` → `1fr`** when **`.sync-dynamic-row--visible`** (smooth height, no `max-height` jump). Tagline uses the same easing (**`cubic-bezier(0.4, 0, 0.2, 1)`**, ~**0.35s**) for **`transform`** / **`margin`** when **`#app`** has **`app--sync-active`** (single shift — no separate “syncing vs offline” tagline jump). Inner **opacity** fades with the strip. **`app--syncing`** remains on `#app` while **`getSyncState() === 'syncing'`** (spinner + “Syncing…” HTML in **`#sync-status`**).

**v13.1 review:** **`app--study`** hides **footer Cloud sync**, **How to use**, and the **sync strip**; **Hard/Easy** in **`#view-study`** use large tap targets (**`min-height` ~4.75rem**, **`min-width: 44px`**, **`touch-action: manipulation`**). Translation/answer uses **`.flash-back-wrap--closed` / `--revealed`** with **`--reveal-ease`** for slide + fade.

---

## Tech stack

- **Frontend:** Vanilla JS (ES modules), no framework. Entry: `index.html` → `js/app.js`.
- **UI strings:** `js/i18n.js` — single **`strings`** object (English); **`t(key, vars)`** and **`applyUiStrings()`** populate `[data-i18n]`, `[data-i18n-html]`, placeholders, titles. No `localStorage` language preference.
- **Data & cloud:** `js/data-store.js` — Supabase JS client (`@supabase/supabase-js` via importmap), anonymous auth session, table **`cards`**. **Supabase Storage is not used** in this repo.
- **Offline / PWA:** `sw.js` precaches shell assets; GET to `*.supabase.co` is network-first. Local cache: `localStorage` keys `lingolift-cards-cache`, `lingolift-sync-outbox`, legacy `lingolift-cards`.

---

## Brand / header

- **Minimal header:** Violet **dot** (`.brand-dot`) next to static **`h1.brand-name`** (“LingoLift” gradient). No logo button / frog.

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
| PWA cache  | `sw.js`, `manifest.json` |

**When you change versioned behavior** (SW bump, sync contract, translate API, major UI rules), **update this file** so the next session stays aligned.
