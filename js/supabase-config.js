/**
 * Supabase client credentials.
 *
 * 1) Edit the FALLBACK_* constants below for local dev, or
 * 2) On static hosting without committing keys, set **before** the app module runs:
 *    globalThis.__LINGOLIFT_SUPABASE__ = { url: 'https://….supabase.co', anonKey: 'eyJ…' };
 *    (see README — add a normal <script> block in index.html above `app.js`).
 *
 * Enable Authentication → Providers → Anonymous before using the app.
 */

/** @returns {{ url: string; anonKey: string }} */
function fromGlobalOverride() {
  const raw =
    typeof globalThis !== 'undefined' && globalThis.__LINGOLIFT_SUPABASE__;
  if (!raw || typeof raw !== 'object') return { url: '', anonKey: '' };
  const url = 'url' in raw && typeof raw.url === 'string' ? raw.url.trim() : '';
  const anonKey = 'anonKey' in raw && typeof raw.anonKey === 'string' ? raw.anonKey.trim() : '';
  return { url, anonKey };
}

/** Repo default — replace with your Project URL and anon key from Dashboard → Settings → API. */
const FALLBACK_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const FALLBACK_KEY = 'YOUR_SUPABASE_ANON_KEY';

const ov = fromGlobalOverride();
export const SUPABASE_URL = (ov.url || FALLBACK_URL).trim();
export const SUPABASE_ANON_KEY = (ov.anonKey || FALLBACK_KEY).trim();
