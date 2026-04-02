import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const CACHE_KEY = 'lingolift-cards-cache';
const OUTBOX_KEY = 'lingolift-sync-outbox';
const LEGACY_KEY = 'lingolift-cards';

/** @typedef {{ id: string, word: string, translation: string, nextReview: number }} Card */
/** @typedef {{ op: 'insert', id: string, word: string, translation: string, next_review: string } | { op: 'update', id: string, next_review: string }} OutboxItem */

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

function setSyncState(s) {
  if (syncState === s) return;
  syncState = s;
  notify?.();
}

export function getSyncState() {
  return syncState;
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validCard);
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
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOutbox(items) {
  if (items.length === 0) localStorage.removeItem(OUTBOX_KEY);
  else localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

function validCard(c) {
  return (
    c &&
    typeof c.id === 'string' &&
    typeof c.word === 'string' &&
    typeof c.translation === 'string' &&
    typeof c.nextReview === 'number'
  );
}

/** @param {Record<string, unknown>} row */
function fromRow(row) {
  const t = row.next_review;
  const ms = typeof t === 'string' ? new Date(t).getTime() : new Date(t).getTime();
  return {
    id: String(row.id),
    word: String(row.word),
    translation: String(row.translation),
    nextReview: ms,
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
  cards = next.filter(validCard).sort((x, y) => x.nextReview - y.nextReview);
  writeCache(cards);
  notify?.();
}

export function getCards() {
  return cards;
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

async function ensureSession() {
  const client = await ensureClient();
  let {
    data: { session },
  } = await client.auth.getSession();
  if (!session) {
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  if (!session?.user) throw new Error('No auth session');
  return { client, userId: session.user.id };
}

/** Same client/session as the rest of the app — for inserts from the UI. */
export async function getSupabaseContext() {
  return ensureSession();
}

async function fetchRemoteCards(userId) {
  const client = await ensureClient();
  const { data, error } = await client
    .from('cards')
    .select('id, word, translation, next_review')
    .eq('user_id', userId)
    .order('next_review', { ascending: true });
  if (error) throw error;
  return (data || []).map(fromRow);
}

async function flushOutbox(userId) {
  const client = await ensureClient();
  let box = readOutbox();
  if (box.length === 0) return;

  const next = [];
  for (const item of box) {
    try {
      if (item.op === 'insert') {
        const { error } = await client.from('cards').insert({
          id: item.id,
          user_id: userId,
          word: item.word,
          translation: item.translation,
          next_review: item.next_review,
        });
        if (error) throw error;
      } else if (item.op === 'update') {
        const { error } = await client
          .from('cards')
          .update({
            next_review: item.next_review,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
          .eq('user_id', userId);
        if (error) throw error;
      }
    } catch {
      next.push(item);
    }
  }
  writeOutbox(next);
}

async function migrateLegacyIfNeeded(userId) {
  let legacy = [];
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    legacy = parsed.filter(validCard);
  } catch {
    return;
  }
  if (legacy.length === 0) return;

  const remote = await fetchRemoteCards(userId);
  if (remote.length > 0) {
    localStorage.removeItem(LEGACY_KEY);
    return;
  }

  const client = await ensureClient();
  const rows = legacy.map((c) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    word: c.word,
    translation: c.translation,
    next_review: new Date(c.nextReview).toISOString(),
  }));

  const { error } = await client.from('cards').insert(rows);
  if (!error) localStorage.removeItem(LEGACY_KEY);
}

export async function refreshFromRemote() {
  if (!navigator.onLine) {
    setSyncState('offline');
    return;
  }
  setSyncState('syncing');
  try {
    const { userId } = await ensureSession();
    await flushOutbox(userId);
    await migrateLegacyIfNeeded(userId);
    const remote = await fetchRemoteCards(userId);
    setCards(remote);
    setSyncState('idle');
  } catch (e) {
    console.error(e);
    setSyncState('error');
  }
}

/**
 * @param {{ onUpdate: () => void }} opts
 */
export async function initDataStore(opts) {
  notify = opts.onUpdate;
  cards = readCache();
  notify?.();

  window.addEventListener('online', () => {
    refreshFromRemote();
  });

  await refreshFromRemote();
}

export async function addCard(word, translation) {
  const id = crypto.randomUUID();
  const next_review = new Date().toISOString();
  const card = {
    id,
    word,
    translation,
    nextReview: Date.now(),
  };

  const merged = mergeById(cards, [card]);
  setCards(merged);

  if (!navigator.onLine) {
    const box = readOutbox();
    box.push({ op: 'insert', id, word, translation, next_review });
    writeOutbox(box);
    setSyncState('offline');
    return card;
  }

  try {
    const { userId } = await ensureSession();
    const client = await ensureClient();
    const { error } = await client.from('cards').insert({
      id,
      user_id: userId,
      word,
      translation,
      next_review,
    });
    if (error) throw error;
    await refreshFromRemote();
    return card;
  } catch (e) {
    console.error(e);
    const box = readOutbox();
    box.push({ op: 'insert', id, word, translation, next_review });
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
    const { userId } = await ensureSession();
    const client = await ensureClient();
    const { error } = await client
      .from('cards')
      .update({
        next_review,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .eq('user_id', userId);
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
