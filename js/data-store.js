import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const CACHE_KEY = 'lingolift-cards-cache';
const OUTBOX_KEY = 'lingolift-sync-outbox';
const LEGACY_KEY = 'lingolift-cards';

/** @typedef {{ id: string, word: string, translation: string, nextReview: number, groupLabel: string, srsStep: number }} Card */
/**
 * @typedef {{
 *   op: 'insert',
 *   id: string,
 *   word: string,
 *   translation: string,
 *   next_review: string,
 *   group_label?: string,
 *   srs_step?: number,
 * } | {
 *   op: 'update',
 *   id: string,
 *   next_review: string,
 *   srs_step?: number,
 * } | {
 *   op: 'update_fields',
 *   id: string,
 *   word: string,
 *   translation: string,
 *   group_label: string,
 * } | {
 *   op: 'delete',
 *   id: string,
 * }} OutboxItem
 */

/** Hard: always reschedule this far ahead and reset Easy ladder index to 0. */
export const HARD_DELAY_MS = 15 * 60 * 1000;

/** Next Easy delay by current `srsStep` (0..4): 2h, 6h, 24h, 72h, 1w. */
export const EASY_INTERVALS_MS = Object.freeze([
  2 * 60 * 60 * 1000,
  6 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  72 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
]);

/** @param {unknown} n */
export function clampSrsStep(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(4, Math.floor(n)));
}

/**
 * @param {boolean} hard
 * @param {number} srsStep
 * @param {number} [nowMs]
 */
export function computeNextSrs(hard, srsStep, nowMs = Date.now()) {
  const step = clampSrsStep(srsStep);
  if (hard) {
    return { nextReviewMs: nowMs + HARD_DELAY_MS, srsStep: 0 };
  }
  return {
    nextReviewMs: nowMs + EASY_INTERVALS_MS[step],
    srsStep: Math.min(4, step + 1),
  };
}

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let supabase = null;

/** @type {Card[]} */
let cards = [];

/** @type {(() => void) | null} */
let notify = null;

/** @type {'idle' | 'syncing' | 'offline' | 'error'} */
let syncState = 'idle';

/** Last user_id used for a successful cloud fetch (anonymous differs per device). */
let lastSyncedUserId = null;

/** @type {Promise<{ ok: boolean, count?: number, userId?: string, reason?: string }> | null} */
let refreshInFlight = null;

/** Set false after PostgREST reports missing `srs_step` (DB without migration). Session-only. */
let dbSupportsSrsStepColumn = true;

/** Last cloud sync failure (cleared on success); for UI / support. */
let lastSyncError = '';

/** @returns {string} */
export function getLastSyncError() {
  return lastSyncError;
}

/** @param {unknown} e */
function formatSyncErr(e) {
  if (e == null) return 'Unknown error';
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const o = /** @type {{ message?: unknown; details?: unknown }} */ (e);
    const m = String(o.message || '');
    const details = o.details != null ? String(o.details) : '';
    const combined = details ? `${m} (${details})` : m;
    return combined.slice(0, 220);
  }
  return String(e).slice(0, 220);
}

const SELECT_CARDS_WITH_SRS =
  'id, word, translation, next_review, group_label, srs_step';
const SELECT_CARDS_LEGACY = 'id, word, translation, next_review, group_label';

/** @param {unknown} err */
function isMissingSrsStepDbError(err) {
  if (!err || typeof err !== 'object') return false;
  const e = /** @type {{ message?: string; details?: string; hint?: string; code?: string }} */ (err);
  const blob = `${e.message || ''} ${e.details || ''} ${e.hint || ''} ${e.code || ''}`;
  if (!/srs_step/i.test(blob)) return false;
  return /does not exist|schema cache|not exist|42703|undefined column|PGRST204|PGRST/i.test(blob);
}

function markDbSrsColumnUnsupported() {
  dbSupportsSrsStepColumn = false;
}

function setSyncState(s) {
  if (syncState === s) return;
  syncState = s;
  notify?.();
}

export function getSyncState() {
  return syncState;
}

export function getLastSyncedUserId() {
  return lastSyncedUserId;
}

/** @param {unknown} g */
function normalizeGroupLabel(g) {
  if (g == null || typeof g !== 'string') return '';
  return g.trim();
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validCard).map(normalizeCardGroup);
  } catch {
    return [];
  }
}

function writeCache(list) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(list));
}

function readOutbox() {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(validOutboxItem) : [];
  } catch {
    return [];
  }
}

function writeOutbox(items) {
  if (items.length === 0) localStorage.removeItem(OUTBOX_KEY);
  else localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

/** @param {unknown} item */
function validOutboxItem(item) {
  if (!item || typeof item !== 'object' || !('op' in item)) return false;
  const op = /** @type {{ op: string }} */ (item).op;
  if (op === 'insert') {
    const o = /** @type {Record<string, unknown>} */ (item);
    return (
      typeof o.id === 'string' &&
      typeof o.word === 'string' &&
      typeof o.translation === 'string' &&
      typeof o.next_review === 'string' &&
      (o.srs_step === undefined || (typeof o.srs_step === 'number' && Number.isFinite(o.srs_step)))
    );
  }
  if (op === 'update') {
    const o = /** @type {Record<string, unknown>} */ (item);
    return (
      typeof o.id === 'string' &&
      typeof o.next_review === 'string' &&
      (o.srs_step === undefined || (typeof o.srs_step === 'number' && Number.isFinite(o.srs_step)))
    );
  }
  if (op === 'update_fields') {
    const o = /** @type {Record<string, unknown>} */ (item);
    return (
      typeof o.id === 'string' &&
      typeof o.word === 'string' &&
      typeof o.translation === 'string' &&
      typeof o.group_label === 'string'
    );
  }
  if (op === 'delete') {
    return typeof /** @type {Record<string, unknown>} */ (item).id === 'string';
  }
  return false;
}

function validCard(c) {
  return (
    c &&
    typeof c === 'object' &&
    typeof /** @type {Card} */ (c).id === 'string' &&
    typeof /** @type {Card} */ (c).word === 'string' &&
    typeof /** @type {Card} */ (c).translation === 'string' &&
    typeof /** @type {Card} */ (c).nextReview === 'number'
  );
}

/** @param {Card} c */
function normalizeCardGroup(c) {
  const gl = 'groupLabel' in c && typeof c.groupLabel === 'string' ? c.groupLabel.trim() : '';
  const srsStep = clampSrsStep('srsStep' in c ? c.srsStep : 0);
  return { ...c, groupLabel: gl, srsStep };
}

/** @param {Record<string, unknown>} row */
function fromRow(row) {
  const t = row.next_review;
  const ms = typeof t === 'string' ? new Date(t).getTime() : Number(t);
  const gl = row.group_label != null ? String(row.group_label).trim() : '';
  return {
    id: String(row.id),
    word: String(row.word),
    translation: String(row.translation),
    nextReview: ms,
    groupLabel: gl,
    srsStep: clampSrsStep(row.srs_step),
  };
}

function mergeById(a, b) {
  const map = new Map();
  for (const c of a) map.set(c.id, c);
  for (const c of b) map.set(c.id, c);
  return Array.from(map.values());
}

/** @param {Card[]} next */
function setCards(next) {
  cards = next.filter(validCard).map(normalizeCardGroup).sort((x, y) => x.nextReview - y.nextReview);
  writeCache(cards);
  notify?.();
}

export function getCards() {
  return cards;
}

function normWordKey(word) {
  return word.trim().toLocaleLowerCase('pt');
}

/**
 * Same word may exist in different groups; optional excludeId for edits.
 * @param {string} word
 * @param {string} groupLabel
 * @param {string | null} [excludeId]
 */
export function isWordDuplicateInGroup(word, groupLabel, excludeId = null) {
  const w = normWordKey(word);
  if (!w) return false;
  const g = normalizeGroupLabel(groupLabel);
  return getCards().some(
    (c) => c.id !== excludeId && normWordKey(c.word) === w && normalizeGroupLabel(c.groupLabel) === g
  );
}

async function ensureClient() {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabase;
}

let authListenerRegistered = false;

async function registerAuthRefreshListener() {
  if (authListenerRegistered) return;
  const client = await ensureClient();
  authListenerRegistered = true;
  client.auth.onAuthStateChange((event, currentSession) => {
    if (event === 'SIGNED_IN' && currentSession?.user) {
      void refreshFromRemote();
    }
  });
}

/**
 * Ensures a session; re-reads session after anonymous sign-in so RLS sees the right uid.
 */
async function ensureSession() {
  const client = await ensureClient();
  let {
    data: { session },
  } = await client.auth.getSession();

  if (!session) {
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    session = data.session ?? null;
    if (!session) {
      const {
        data: { session: fresh },
      } = await client.auth.getSession();
      session = fresh;
    }
  }

  if (!session?.user) throw new Error('No auth session');
  return { client, userId: session.user.id };
}

/** Same client/session as the rest of the app — for inserts from the UI. */
export async function getSupabaseContext() {
  return ensureSession();
}

async function fetchRemoteCards(clientOpt) {
  const client = clientOpt ?? (await ensureClient());
  const cols = dbSupportsSrsStepColumn ? SELECT_CARDS_WITH_SRS : SELECT_CARDS_LEGACY;
  let { data, error } = await client.from('cards').select(cols).order('next_review', { ascending: true });
  if (error && dbSupportsSrsStepColumn && isMissingSrsStepDbError(error)) {
    markDbSrsColumnUnsupported();
    ({ data, error } = await client
      .from('cards')
      .select(SELECT_CARDS_LEGACY)
      .order('next_review', { ascending: true }));
  }
  if (error) throw error;
  return (data || []).map(fromRow);
}

async function flushOutbox(userId, clientOpt) {
  const client = clientOpt ?? (await ensureClient());
  let box = readOutbox();
  if (box.length === 0) return;

  const next = [];
  for (const item of box) {
    try {
      if (item.op === 'insert') {
        const gl = normalizeGroupLabel(item.group_label ?? '');
        const srs = clampSrsStep(item.srs_step ?? 0);
        const baseRow = {
          id: item.id,
          user_id: userId,
          word: item.word,
          translation: item.translation,
          next_review: item.next_review,
          group_label: gl,
        };
        let { error } = await client.from('cards').insert(
          dbSupportsSrsStepColumn ? { ...baseRow, srs_step: srs } : baseRow
        );
        if (error && dbSupportsSrsStepColumn && isMissingSrsStepDbError(error)) {
          markDbSrsColumnUnsupported();
          ({ error } = await client.from('cards').insert(baseRow));
        }
        if (error) throw error;
      } else if (item.op === 'update') {
        const srs = clampSrsStep(item.srs_step ?? 0);
        const withSrs = {
          next_review: item.next_review,
          srs_step: srs,
          updated_at: new Date().toISOString(),
        };
        const legacyUp = {
          next_review: item.next_review,
          updated_at: new Date().toISOString(),
        };
        let { error } = await client
          .from('cards')
          .update(dbSupportsSrsStepColumn ? withSrs : legacyUp)
          .eq('id', item.id);
        if (error && dbSupportsSrsStepColumn && isMissingSrsStepDbError(error)) {
          markDbSrsColumnUnsupported();
          ({ error } = await client.from('cards').update(legacyUp).eq('id', item.id));
        }
        if (error) throw error;
      } else if (item.op === 'update_fields') {
        const gl = normalizeGroupLabel(item.group_label);
        const { error } = await client
          .from('cards')
          .update({
            word: item.word,
            translation: item.translation,
            group_label: gl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        if (error) throw error;
      } else if (item.op === 'delete') {
        const { error } = await client.from('cards').delete().eq('id', item.id);
        if (error) throw error;
      }
    } catch {
      next.push(item);
    }
  }
  writeOutbox(next);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} clientOpt
 * @returns {Promise<boolean>} true if legacy rows were inserted (caller should refetch)
 */
async function migrateLegacyIfNeeded(userId, remote, clientOpt) {
  let legacy = [];
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    legacy = parsed.filter(validCard).map(normalizeCardGroup);
  } catch {
    return false;
  }
  if (legacy.length === 0) return false;

  if (remote.length > 0) {
    localStorage.removeItem(LEGACY_KEY);
    return false;
  }

  const client = clientOpt ?? (await ensureClient());
  const rows = legacy.map((c) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    word: c.word,
    translation: c.translation,
    next_review: new Date(c.nextReview).toISOString(),
    group_label: normalizeGroupLabel(c.groupLabel),
    srs_step: clampSrsStep(c.srsStep),
  }));

  let { error } = await client.from('cards').insert(rows);
  if (error && dbSupportsSrsStepColumn && isMissingSrsStepDbError(error)) {
    markDbSrsColumnUnsupported();
    const slim = rows.map(({ srs_step, ...r }) => r);
    ({ error } = await client.from('cards').insert(slim));
  }
  if (!error) {
    localStorage.removeItem(LEGACY_KEY);
    return true;
  }
  return false;
}

async function runRefreshPipeline() {
  setSyncState('syncing');
  try {
    const { client, userId } = await ensureSession();
    lastSyncedUserId = userId;
    await flushOutbox(userId, client);
    let remote = await fetchRemoteCards(client);
    const migrated = await migrateLegacyIfNeeded(userId, remote, client);
    if (migrated) remote = await fetchRemoteCards(client);
    setCards(remote);
    lastSyncError = '';
    setSyncState('idle');
    return { ok: true, count: remote.length, userId };
  } catch (e) {
    console.error(e);
    lastSyncError = formatSyncErr(e);
    setSyncState('error');
    return { ok: false, reason: 'error', detail: lastSyncError };
  }
}

/**
 * Full fetch from Supabase for the current auth user (single-flight).
 * Do not call from inside ensureSession — use auth listener for post–sign-in runs.
 */
export function refreshFromRemote() {
  if (!navigator.onLine) {
    setSyncState('offline');
    return Promise.resolve({ ok: false, reason: 'offline' });
  }
  if (!refreshInFlight) {
    refreshInFlight = runRefreshPipeline().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Explicit UI action — same as refreshFromRemote(). */
export function forceFullSyncFromSupabase() {
  return refreshFromRemote();
}

/**
 * @param {{ onUpdate: () => void }} opts
 */
export async function initDataStore(opts) {
  notify = opts.onUpdate;
  cards = readCache();
  notify?.();

  await registerAuthRefreshListener();

  window.addEventListener('online', () => {
    refreshFromRemote();
  });

  await refreshFromRemote();
}

/**
 * @param {string} word
 * @param {string} translation
 * @param {string} [groupLabel]
 * @returns {Promise<Card | null>} null if duplicate word in the same group
 */
export async function addCard(word, translation, groupLabel = '') {
  const w = word.trim();
  const t = translation.trim();
  const gl = normalizeGroupLabel(groupLabel);
  if (isWordDuplicateInGroup(w, gl)) return null;

  const id = crypto.randomUUID();
  const next_review = new Date().toISOString();
  const card = {
    id,
    word: w,
    translation: t,
    nextReview: Date.now(),
    groupLabel: gl,
    srsStep: 0,
  };

  const merged = mergeById(cards, [card]);
  setCards(merged);

  if (!navigator.onLine) {
    const box = readOutbox();
    box.push({ op: 'insert', id, word: w, translation: t, next_review, group_label: gl, srs_step: 0 });
    writeOutbox(box);
    setSyncState('offline');
    return card;
  }

  try {
    const { client, userId } = await ensureSession();
    const baseIns = {
      id,
      user_id: userId,
      word: w,
      translation: t,
      next_review,
      group_label: gl,
    };
    let { error } = await client.from('cards').insert(
      dbSupportsSrsStepColumn ? { ...baseIns, srs_step: 0 } : baseIns
    );
    if (error && dbSupportsSrsStepColumn && isMissingSrsStepDbError(error)) {
      markDbSrsColumnUnsupported();
      ({ error } = await client.from('cards').insert(baseIns));
    }
    if (error) throw error;
    await refreshFromRemote();
    return card;
  } catch (e) {
    console.error(e);
    const box = readOutbox();
    box.push({ op: 'insert', id, word: w, translation: t, next_review, group_label: gl, srs_step: 0 });
    writeOutbox(box);
    setSyncState('error');
    return card;
  }
}

/**
 * @param {string} cardId
 * @param {{ nextReviewMs: number, srsStep: number }} srs
 */
export async function updateCardSrs(cardId, srs) {
  const next_review = new Date(srs.nextReviewMs).toISOString();
  const srs_step = clampSrsStep(srs.srsStep);
  const idx = cards.findIndex((c) => c.id === cardId);
  if (idx === -1) return;
  const next = cards.slice();
  next[idx] = { ...next[idx], nextReview: srs.nextReviewMs, srsStep: srs_step };
  setCards(next);

  if (!navigator.onLine) {
    const box = readOutbox();
    box.push({ op: 'update', id: cardId, next_review, srs_step });
    writeOutbox(box);
    setSyncState('offline');
    return;
  }

  try {
    const { client } = await ensureSession();
    const withSrs = {
      next_review,
      srs_step,
      updated_at: new Date().toISOString(),
    };
    const legacyUp = {
      next_review,
      updated_at: new Date().toISOString(),
    };
    let { error } = await client
      .from('cards')
      .update(dbSupportsSrsStepColumn ? withSrs : legacyUp)
      .eq('id', cardId);
    if (error && dbSupportsSrsStepColumn && isMissingSrsStepDbError(error)) {
      markDbSrsColumnUnsupported();
      ({ error } = await client.from('cards').update(legacyUp).eq('id', cardId));
    }
    if (error) throw error;
    await refreshFromRemote();
  } catch (e) {
    console.error(e);
    const box = readOutbox();
    box.push({ op: 'update', id: cardId, next_review, srs_step });
    writeOutbox(box);
    setSyncState('error');
  }
}

/**
 * @param {string} cardId
 * @param {{ word: string, translation: string, groupLabel: string }} fields
 * @returns {Promise<boolean>} false if duplicate word in target group
 */
export async function updateCardFields(cardId, fields) {
  const w = fields.word.trim();
  const tr = fields.translation.trim();
  const gl = normalizeGroupLabel(fields.groupLabel);
  if (isWordDuplicateInGroup(w, gl, cardId)) return false;

  const idx = cards.findIndex((c) => c.id === cardId);
  if (idx === -1) return false;
  const next = cards.slice();
  next[idx] = { ...next[idx], word: w, translation: tr, groupLabel: gl };
  setCards(next);

  if (!navigator.onLine) {
    const box = readOutbox();
    box.push({ op: 'update_fields', id: cardId, word: w, translation: tr, group_label: gl });
    writeOutbox(box);
    setSyncState('offline');
    return true;
  }

  try {
    const { client } = await ensureSession();
    const { error } = await client
      .from('cards')
      .update({
        word: w,
        translation: tr,
        group_label: gl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId);
    if (error) throw error;
    await refreshFromRemote();
    return true;
  } catch (e) {
    console.error(e);
    const box = readOutbox();
    box.push({ op: 'update_fields', id: cardId, word: w, translation: tr, group_label: gl });
    writeOutbox(box);
    setSyncState('error');
    return true;
  }
}

export async function deleteCard(cardId) {
  const next = cards.filter((c) => c.id !== cardId);
  setCards(next);

  if (!navigator.onLine) {
    const box = readOutbox();
    box.push({ op: 'delete', id: cardId });
    writeOutbox(box);
    setSyncState('offline');
    return;
  }

  try {
    const { client } = await ensureSession();
    const { error } = await client.from('cards').delete().eq('id', cardId);
    if (error) throw error;
    await refreshFromRemote();
  } catch (e) {
    console.error(e);
    const box = readOutbox();
    box.push({ op: 'delete', id: cardId });
    writeOutbox(box);
    setSyncState('error');
  }
}
