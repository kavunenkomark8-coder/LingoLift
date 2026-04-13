/**
 * Supabase client credentials.
 *
 * Resolution order (each field separately):
 * 1) `globalThis.__LINGOLIFT_SUPABASE__` — only values that are **not** template placeholders.
 * 2) `FALLBACK_*` below (project defaults).
 *
 * This avoids a common bug: a half-filled or example `__LINGOLIFT_SUPABASE__` object must not
 * override good fallbacks with `YOUR_*` strings.
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

/** @param {string} u */
function isPlaceholderUrl(u) {
  const s = String(u || '').trim();
  return !s || s.includes('YOUR_PROJECT_REF');
}

/** @param {string} k */
function isPlaceholderKey(k) {
  const s = String(k || '').trim();
  return !s || s.includes('YOUR_SUPABASE_ANON_KEY');
}

/**
 * Project defaults (anon is a public client key; security is enforced by RLS in Supabase).
 * Override per deployment via `globalThis.__LINGOLIFT_SUPABASE__` if you fork the repo.
 */
const FALLBACK_URL = 'https://jvqdtrfnpfjxlwocnoya.supabase.co';
const FALLBACK_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cWR0cmZucGZqeGx3b2Nub3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjM5ODgsImV4cCI6MjA5MDczOTk4OH0.CqcEpyzU8r0rxb6HyUojBiE4hXY0OEC8TfvSGOVc7eA';

const ov = fromGlobalOverride();
export const SUPABASE_URL = (isPlaceholderUrl(ov.url) ? FALLBACK_URL : ov.url).trim();
export const SUPABASE_ANON_KEY = (isPlaceholderKey(ov.anonKey) ? FALLBACK_KEY : ov.anonKey).trim();
