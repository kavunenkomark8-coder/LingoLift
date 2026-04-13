import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const CACHE_KEY = 'lingolift-cards-cache';
const OUTBOX_KEY = 'lingolift-sync-outbox';
const LEGACY_KEY = 'lingolift-cards';

/** @typedef {{ id: string, word: string, translation: string, nextReview: number, groupLabel: string }} Card */
/**
 * @typedef {{
 *   op: 'insert',
 *   id: string,
 *   word: string,
 *   translation: string,
 *   next_review: string,
 *   group_label?: string,
 * } | {
 *   op: 'update',
 *   id: string,
 *   next_review: string,
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

const HARD_MS = 6 * 60 * 60 * 1000;
const EASY_MS = 3 * 24 * 60 * 60 * 1000;

export { HARD_MS, EASY_MS };

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
      typeof o.next_review === 'string'
    );
  }
  if (op === 'update') {
    const o = /** @type {Record<string, unknown>} */ (item);
    return typeof o.id === 'string' && typeof o.next_review === 'string';
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
  return { ...c, groupLabel: gl };
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
  const { data, error } = await client
    .from('cards')
    .select('id, word, translation, next_review, group_label')
    .order('next_review', { ascending: true });
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
        const { error } = await client.from('cards').insert({
          id: item.id,
          user_id: userId,
          word: item.word,
          translation: item.translation,
          next_review: item.next_review,
          group_label: gl,
        });
        if (error) throw error;
      } else if (item.op === 'update') {
        const { error } = await client
          .from('cards')
          .update({
            next_review: item.next_review,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
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
  }));

  const { error } = await client.from('cards').insert(rows);
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
    setSyncState('idle');
    return { ok: true, count: remote.length, userId };
  } catch (e) {
    console.error(e);
    setSyncState('error');
    return { ok: false, reason: 'error' };
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
  };

  const merged = mergeById(cards, [card]);
  setCards(merged);

  if (!navigator.onLine) {
    const box = readOutbox();
    box.push({ op: 'insert', id, word: w, translation: t, next_review, group_label: gl });
    writeOutbox(box);
    setSyncState('offline');
    return card;
  }

  try {
    const { client, userId } = await ensureSession();
    const { error } = await client.from('cards').insert({
      id,
      user_id: userId,
      word: w,
      translation: t,
      next_review,
      group_label: gl,
    });
    if (error) throw error;
    await refreshFromRemote();
    return card;
  } catch (e) {
    console.error(e);
    const box = readOutbox();
    box.push({ op: 'insert', id, word: w, translation: t, next_review, group_label: gl });
    writeOutbox(box);
    setSyncState('error');
    return card;
  }
}

export async function updateCardNextReview(cardId, nextReviewMs) {
  const next_review = new Date(nextReviewMs).toISOString();
  const idx = cards.findIndex((c) => c.id === cardId);
  if (idx === -1) return;
  const next = cards.slice();
  next[idx] = { ...next[idx], nextReview: nextReviewMs };
  setCards(next);

  if (!navigator.onLine) {
    const box = readOutbox();
    box.push({ op: 'update', id: cardId, next_review });
    writeOutbox(box);
    setSyncState('offline');
    return;
  }

  try {
    const { client } = await ensureSession();
    const { error } = await client
      .from('cards')
      .update({
        next_review,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId);
    if (error) throw error;
    await refreshFromRemote();
  } catch (e) {
    console.error(e);
    const box = readOutbox();
    box.push({ op: 'update', id: cardId, next_review });
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
