import {
  initDataStore,
  getCards,
  addCard,
  updateCardSrs,
  updateCardFields,
  deleteCard,
  getSyncState,
  getLastSyncedUserId,
  getLastSyncError,
  getLastOutboxFlushError,
  refreshFromRemote,
  forceFullSyncFromSupabase,
  computeNextSrs,
} from './data-store.js';
import { applyUiStrings, t } from './i18n.js';

const LANG_PAIR_KEY = 'lingolift-lang-pair';
const STUDY_GROUP_FILTER_KEY = 'lingolift-study-group-filter';
const GRADES_TODAY_KEY = 'lingolift-grades-today';

/** @returns {string} Local calendar day YYYY-M-D for resetting counters. */
function calendarDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function bumpGradesToday() {
  const dayKey = calendarDayKey();
  try {
    const raw = localStorage.getItem(GRADES_TODAY_KEY);
    let count = 0;
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object' && p.dayKey === dayKey && typeof p.count === 'number') count = p.count;
    }
    localStorage.setItem(GRADES_TODAY_KEY, JSON.stringify({ dayKey, count: count + 1 }));
  } catch {
    /* ignore */
  }
}

/** @returns {number} */
function getGradesTodayCount() {
  const dayKey = calendarDayKey();
  try {
    const raw = localStorage.getItem(GRADES_TODAY_KEY);
    if (!raw) return 0;
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object' || p.dayKey !== dayKey || typeof p.count !== 'number') return 0;
    return Math.max(0, p.count);
  } catch {
    return 0;
  }
}
/** Select value for cards with empty `groupLabel`. */
const GROUP_FILTER_NONE = '__none__';

/**
 * Cards whose next review time is already here (strictly overdue / due now).
 * Hard (+15 min) removes a card from this set until that time passes — unlike
 * an end-of-day count, which stayed flat and looked like progress was not saved.
 * @param {{ id: string, word: string, translation: string, nextReview: number, srsStep?: number }[]} cards
 */
function dueNowQueue(cards) {
  const now = Date.now();
  const out = [];
  for (const c of cards) {
    if (c.nextReview <= now) out.push(c);
  }
  return out;
}

/** Fisher–Yates shuffle in place. @template T @param {T[]} arr */
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

const els = {
  app: document.getElementById('app'),
  syncDynamicRow: document.getElementById('sync-dynamic-row'),
  viewDashboard: document.getElementById('view-dashboard'),
  viewStudy: document.getElementById('view-study'),
  progressCount: document.getElementById('progress-count'),
  progressGradesToday: document.getElementById('progress-grades-today'),
  dueBrainVisual: document.getElementById('due-brain-visual'),
  btnStartReview: document.getElementById('btn-start-review'),
  reviewHint: document.getElementById('review-hint'),
  formAddCard: document.getElementById('form-add-card'),
  selectLangSource: document.getElementById('select-lang-source'),
  selectLangTarget: document.getElementById('select-lang-target'),
  inputWord: document.getElementById('input-word'),
  inputTranslation: document.getElementById('input-translation'),
  fieldWordWrap: document.getElementById('field-word-wrap'),
  btnTranslateWand: document.getElementById('btn-translate-wand'),
  statTotal: document.getElementById('stat-total'),
  btnExitStudy: document.getElementById('btn-exit-study'),
  studyRemainingLabel: document.getElementById('study-remaining-label'),
  sessionBarWrap: document.getElementById('session-bar-wrap'),
  sessionBarFill: document.getElementById('session-bar-fill'),
  studyFront: document.getElementById('study-front'),
  studyBackWrap: document.getElementById('study-back-wrap'),
  studyBack: document.getElementById('study-back'),
  btnShowAnswer: document.getElementById('btn-show-answer'),
  gradeRow: document.getElementById('grade-row'),
  btnHard: document.getElementById('btn-hard'),
  btnEasy: document.getElementById('btn-easy'),
  toast: document.getElementById('toast'),
  syncStatus: document.getElementById('sync-status'),
  btnForceSync: document.getElementById('btn-force-sync'),
  btnFooterSyncText: document.querySelector('#btn-force-sync .btn-footer-sync__text'),
  accountHint: document.getElementById('account-hint'),
  howtoPanel: document.querySelector('.howto-panel'),
  howtoToggle: document.getElementById('howto-toggle'),
  howtoContent: document.getElementById('howto-content'),
  formAddCardSubmit: document.querySelector('#form-add-card button[type="submit"]'),
  selectStudyGroup: document.getElementById('select-study-group'),
  selectAddGroup: document.getElementById('select-add-group'),
  inputNewGroupName: document.getElementById('input-new-group-name'),
  labelNewGroup: document.getElementById('label-new-group'),
  deckPanel: document.getElementById('deck-panel'),
  deckToggle: document.getElementById('deck-toggle'),
  deckContent: document.getElementById('deck-content'),
  deckSearch: document.getElementById('deck-search'),
  selectDeckGroupFilter: document.getElementById('select-deck-group-filter'),
  deckList: document.getElementById('deck-list'),
  datalistWords: document.getElementById('datalist-words'),
  studyCard: document.getElementById('study-card'),
};

function loadLangPair() {
  try {
    if (!els.selectLangSource || !els.selectLangTarget) return;
    const raw = localStorage.getItem(LANG_PAIR_KEY);
    if (!raw) return;
    const o = JSON.parse(raw);
    if (o && typeof o.source === 'string' && els.selectLangSource.querySelector(`option[value="${o.source}"]`)) {
      els.selectLangSource.value = o.source;
    }
    if (o && typeof o.target === 'string' && els.selectLangTarget.querySelector(`option[value="${o.target}"]`)) {
      els.selectLangTarget.value = o.target;
    }
  } catch {
    /* ignore */
  }
}

function saveLangPair() {
  try {
    if (!els.selectLangSource || !els.selectLangTarget) return;
    localStorage.setItem(
      LANG_PAIR_KEY,
      JSON.stringify({ source: els.selectLangSource.value, target: els.selectLangTarget.value })
    );
  } catch {
    /* ignore */
  }
}

function loadStudyGroupFilter() {
  try {
    const v = localStorage.getItem(STUDY_GROUP_FILTER_KEY);
    return typeof v === 'string' ? v : '';
  } catch {
    return '';
  }
}

function saveStudyGroupFilter(value) {
  try {
    if (value === '') localStorage.removeItem(STUDY_GROUP_FILTER_KEY);
    else localStorage.setItem(STUDY_GROUP_FILTER_KEY, value);
  } catch {
    /* ignore */
  }
}

loadLangPair();

/** @type {string} */
let studyGroupFilter = loadStudyGroupFilter();
/** @type {string} */
let deckListGroupFilter = '';

/** @param {{ groupLabel?: string }[]} cardList */
function distinctSortedGroups(cardList) {
  const set = new Set();
  for (const c of cardList) {
    const g = (c.groupLabel || '').trim();
    if (g) set.add(g);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** @param {{ groupLabel?: string }[]} all */
function cardsMatchingStudyFilter(all) {
  if (studyGroupFilter === '') return all;
  if (studyGroupFilter === GROUP_FILTER_NONE) return all.filter((c) => !(c.groupLabel || '').trim());
  return all.filter((c) => (c.groupLabel || '').trim() === studyGroupFilter);
}

function populateStudyGroupSelect() {
  const sel = els.selectStudyGroup;
  if (!sel) return;
  const saved = studyGroupFilter;
  const allCards = getCards();
  const groups = distinctSortedGroups(allCards);
  sel.textContent = '';
  const optAll = document.createElement('option');
  optAll.value = '';
  optAll.textContent = t('groupFilterAll');
  sel.appendChild(optAll);
  const optNone = document.createElement('option');
  optNone.value = GROUP_FILTER_NONE;
  optNone.textContent = t('groupUngrouped');
  sel.appendChild(optNone);
  for (const g of groups) {
    const o = document.createElement('option');
    o.value = g;
    o.textContent = g;
    sel.appendChild(o);
  }
  const ok = saved === '' || saved === GROUP_FILTER_NONE || groups.includes(saved);
  if (!ok) {
    studyGroupFilter = '';
    saveStudyGroupFilter('');
  }
  sel.value =
    studyGroupFilter === '' ? '' : studyGroupFilter === GROUP_FILTER_NONE ? GROUP_FILTER_NONE : studyGroupFilter;
}

function populateAddGroupSelect() {
  const sel = els.selectAddGroup;
  if (!sel) return;
  const prev = sel.value;
  const groups = distinctSortedGroups(getCards());
  sel.textContent = '';
  const o0 = document.createElement('option');
  o0.value = '';
  o0.textContent = t('groupUngrouped');
  sel.appendChild(o0);
  for (const g of groups) {
    const o = document.createElement('option');
    o.value = g;
    o.textContent = g;
    sel.appendChild(o);
  }
  const on = document.createElement('option');
  on.value = '__new__';
  on.textContent = t('groupNewOption');
  sel.appendChild(on);
  if (prev === '__new__' || prev === '' || groups.includes(prev)) sel.value = prev;
  else sel.value = '';
  toggleNewGroupInput();
}

function populateDeckGroupFilter() {
  const sel = els.selectDeckGroupFilter;
  if (!sel) return;
  const saved = deckListGroupFilter;
  const groups = distinctSortedGroups(getCards());
  sel.textContent = '';
  const o0 = document.createElement('option');
  o0.value = '';
  o0.textContent = t('groupFilterAll');
  sel.appendChild(o0);
  const o1 = document.createElement('option');
  o1.value = GROUP_FILTER_NONE;
  o1.textContent = t('groupUngrouped');
  sel.appendChild(o1);
  for (const g of groups) {
    const o = document.createElement('option');
    o.value = g;
    o.textContent = g;
    sel.appendChild(o);
  }
  const ok = saved === '' || saved === GROUP_FILTER_NONE || groups.includes(saved);
  if (!ok) deckListGroupFilter = '';
  sel.value =
    deckListGroupFilter === '' ? '' : deckListGroupFilter === GROUP_FILTER_NONE ? GROUP_FILTER_NONE : deckListGroupFilter;
}

function toggleNewGroupInput() {
  const isNew = els.selectAddGroup?.value === '__new__';
  if (els.labelNewGroup) {
    els.labelNewGroup.classList.toggle('field--new-group--visible', isNew);
    els.labelNewGroup.setAttribute('aria-hidden', isNew ? 'false' : 'true');
  }
  if (!isNew && els.inputNewGroupName) els.inputNewGroupName.value = '';
}

function refreshWordDatalist() {
  const dl = els.datalistWords;
  if (!dl) return;
  dl.textContent = '';
  let gFilter = '';
  if (els.selectAddGroup?.value === '__new__') gFilter = (els.inputNewGroupName?.value || '').trim();
  else gFilter = (els.selectAddGroup?.value || '').trim();
  for (const c of getCards()) {
    const cg = (c.groupLabel || '').trim();
    if (cg !== gFilter) continue;
    const opt = document.createElement('option');
    opt.value = c.word;
    dl.appendChild(opt);
  }
}

/** @returns {string} */
function getAddFormGroupLabel() {
  const v = els.selectAddGroup?.value;
  if (v === '__new__') return (els.inputNewGroupName?.value || '').trim();
  return (v || '').trim();
}

/** @type {ReturnType<typeof setTimeout> | null} */
let deckSearchDebounceTimer = null;

function scheduleRenderDeckList() {
  if (!els.deckList) return;
  clearTimeout(deckSearchDebounceTimer);
  deckSearchDebounceTimer = setTimeout(() => {
    deckSearchDebounceTimer = null;
    renderDeckList();
  }, 200);
}

/** @param {{ id: string, word: string, translation: string, nextReview: number, groupLabel?: string, srsStep?: number }[]} all */
function cardsMatchingDeckFilters(all) {
  let list = all.slice().sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }));
  if (deckListGroupFilter === GROUP_FILTER_NONE) list = list.filter((c) => !(c.groupLabel || '').trim());
  else if (deckListGroupFilter !== '') list = list.filter((c) => (c.groupLabel || '').trim() === deckListGroupFilter);
  const q = (els.deckSearch?.value || '').trim().toLowerCase();
  if (q)
    list = list.filter(
      (c) => c.word.toLowerCase().includes(q) || c.translation.toLowerCase().includes(q)
    );
  return list;
}

function closeAllDeckEdits() {
  els.deckList?.querySelectorAll('.deck-row__editor').forEach((n) => n.remove());
}

/**
 * @param {HTMLDivElement} row
 * @param {{ id: string, word: string, translation: string, nextReview: number, groupLabel?: string, srsStep?: number }} card
 */
function openDeckEdit(row, card) {
  closeAllDeckEdits();
  const ed = document.createElement('div');
  ed.className = 'deck-row__editor';
  const iw = document.createElement('input');
  iw.type = 'text';
  iw.value = card.word;
  iw.className = 'deck-edit-input';
  iw.setAttribute('aria-label', t('fieldWord'));
  const it = document.createElement('input');
  it.type = 'text';
  it.value = card.translation;
  it.className = 'deck-edit-input';
  it.setAttribute('aria-label', t('fieldTranslation'));
  const sg = document.createElement('select');
  sg.className = 'select-lang deck-edit-select';
  sg.setAttribute('aria-label', t('fieldCardGroup'));
  const curG = (card.groupLabel || '').trim();
  const o0 = document.createElement('option');
  o0.value = '';
  o0.textContent = t('groupUngrouped');
  sg.appendChild(o0);
  const seen = new Set(['']);
  for (const g of distinctSortedGroups(getCards())) {
    const o = document.createElement('option');
    o.value = g;
    o.textContent = g;
    sg.appendChild(o);
    seen.add(g);
  }
  if (curG && !seen.has(curG)) {
    const o = document.createElement('option');
    o.value = curG;
    o.textContent = curG;
    sg.appendChild(o);
  }
  sg.value = curG;
  const btnS = document.createElement('button');
  btnS.type = 'button';
  btnS.className = 'btn btn--secondary deck-edit-save';
  btnS.textContent = t('deckSave');
  const btnC = document.createElement('button');
  btnC.type = 'button';
  btnC.className = 'btn btn--ghost deck-edit-cancel';
  btnC.textContent = t('deckCancel');
  btnC.addEventListener('click', () => {
    ed.remove();
  });
  btnS.addEventListener('click', async () => {
    const ok = await updateCardFields(card.id, {
      word: iw.value,
      translation: it.value,
      groupLabel: sg.value,
    });
    if (!ok) {
      showToast(t('alertDuplicateWord'));
      return;
    }
    ed.remove();
    showToast(t('toastCardUpdated'));
    renderDashboard();
  });
  ed.appendChild(iw);
  ed.appendChild(it);
  ed.appendChild(sg);
  ed.appendChild(btnS);
  ed.appendChild(btnC);
  row.appendChild(ed);
}

async function confirmDeleteDeckCard(id) {
  if (!confirm(t('confirmDeleteCard'))) return;
  await deleteCard(id);
  showToast(t('toastCardDeleted'));
  renderDashboard();
}

function renderDeckList() {
  if (!els.deckList) return;
  const list = cardsMatchingDeckFilters(getCards());
  els.deckList.textContent = '';
  if (list.length === 0) {
    const p = document.createElement('p');
    p.className = 'deck-empty';
    p.textContent = t('deckEmpty');
    els.deckList.appendChild(p);
    return;
  }
  for (const card of list) {
    const row = document.createElement('div');
    row.className = 'deck-row';
    const main = document.createElement('div');
    main.className = 'deck-row__main';
    const w = document.createElement('span');
    w.className = 'deck-row__word';
    w.textContent = card.word;
    const tr = document.createElement('span');
    tr.className = 'deck-row__trans';
    tr.textContent = card.translation;
    const badge = document.createElement('span');
    badge.className = 'deck-row__badge';
    badge.textContent = (card.groupLabel || '').trim() || t('groupUngrouped');
    const actions = document.createElement('div');
    actions.className = 'deck-row__actions';
    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'btn btn--ghost deck-row__btn';
    btnEdit.textContent = t('deckEdit');
    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'btn btn--ghost deck-row__btn deck-row__btn--danger';
    btnDel.textContent = t('deckDelete');
    btnEdit.addEventListener('click', () => openDeckEdit(row, card));
    btnDel.addEventListener('click', () => void confirmDeleteDeckCard(card.id));
    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);
    main.appendChild(w);
    main.appendChild(tr);
    main.appendChild(badge);
    row.appendChild(main);
    row.appendChild(actions);
    els.deckList.appendChild(row);
  }
}

function focusStartReview() {
  requestAnimationFrame(() => {
    try {
      els.btnStartReview?.focus();
    } catch {
      /* ignore */
    }
  });
}

/** @type {ReturnType<typeof setTimeout> | null} */
let footerSyncCheckTimer = null;

/** @type {{ id: string, word: string, translation: string, nextReview: number, groupLabel?: string, srsStep?: number }[]} */
let queue = [];
let queueIndex = 0;
/** Prevents overlapping `grade()` (e.g. double tap / swipe + key) from reusing stale `queue[queueIndex]` / `srsStep`. */
let gradeInFlight = false;
let toastTimer = null;

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
    updateSyncLabel();
  }, 2200);
}

/**
 * @param {unknown} data Parsed JSON from translate_a/single
 * @returns {string}
 */
function parseGtxTranslation(data) {
  const row = data?.[0];
  if (!Array.isArray(row)) return '';
  const parts = [];
  for (let i = 0; i < row.length; i++) {
    const seg = row[i];
    if (Array.isArray(seg) && typeof seg[0] === 'string') parts.push(seg[0]);
  }
  return parts.join('').trim();
}

async function fetchGtxTranslation(word) {
  const sl = els.selectLangSource?.value?.trim() || 'pt';
  const tl = els.selectLangTarget?.value?.trim() || 'en';
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(word)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('http');
  const data = await res.json();
  const text = parseGtxTranslation(data);
  if (!text) throw new Error('parse');
  return text;
}

function shakeWordField() {
  const w = els.fieldWordWrap;
  if (!w) return;
  w.classList.remove('field-word-wrap--shake');
  void w.offsetWidth;
  w.classList.add('field-word-wrap--shake');
  setTimeout(() => w.classList.remove('field-word-wrap--shake'), 500);
}

function flashTranslationFieldBorder() {
  const wrap = els.inputTranslation?.closest('.field-input-wrap');
  if (!wrap) return;
  wrap.classList.remove('field-input-wrap--flash');
  void wrap.offsetWidth;
  wrap.classList.add('field-input-wrap--flash');
  setTimeout(() => wrap.classList.remove('field-input-wrap--flash'), 700);
}

async function runAutoTranslate() {
  const word = els.inputWord.value.trim();
  if (!word) {
    shakeWordField();
    return;
  }
  const btn = els.btnTranslateWand;
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add('is-busy');
  try {
    const text = await fetchGtxTranslation(word);
    const normWord = word.toLowerCase();
    const normOut = text.toLowerCase();
    if (normOut === normWord) {
      showToast(t('toastTranslationNotFound'));
      return;
    }
    els.inputTranslation.value = text;
    flashTranslationFieldBorder();
  } catch {
    showToast(t('alertTranslationFailed'));
  } finally {
    btn.disabled = false;
    btn.classList.remove('is-busy');
  }
}

function updateSyncLabel() {
  const s = getSyncState();
  els.syncStatus.classList.remove('sync-status--action');
  els.app?.classList.remove('app--sync-active', 'app--syncing');
  els.syncDynamicRow?.classList.remove('sync-dynamic-row--visible');

  if (s === 'offline') {
    els.syncStatus.textContent = t('syncOffline');
    els.syncStatus.removeAttribute('role');
    els.syncStatus.removeAttribute('tabindex');
    els.app?.classList.add('app--sync-active');
    els.syncDynamicRow?.classList.add('sync-dynamic-row--visible');
  } else if (s === 'syncing') {
    els.syncStatus.innerHTML = `<span class="sync-spinner" aria-hidden="true"></span><span class="sync-syncing-text">${t('syncSyncing')}</span>`;
    els.syncStatus.removeAttribute('role');
    els.syncStatus.removeAttribute('tabindex');
    els.app?.classList.add('app--sync-active', 'app--syncing');
    els.syncDynamicRow?.classList.add('sync-dynamic-row--visible');
  } else if (s === 'error') {
    els.syncStatus.textContent = t('syncError');
    const errHint = getLastSyncError() || getLastOutboxFlushError();
    if (errHint) els.syncStatus.setAttribute('title', errHint);
    else els.syncStatus.removeAttribute('title');
    els.syncStatus.classList.add('sync-status--action');
    els.syncStatus.setAttribute('role', 'button');
    els.syncStatus.setAttribute('tabindex', '0');
    els.app?.classList.add('app--sync-active');
    els.syncDynamicRow?.classList.add('sync-dynamic-row--visible');
  } else {
    els.syncStatus.textContent = '';
    els.syncStatus.removeAttribute('title');
    els.syncStatus.removeAttribute('role');
    els.syncStatus.removeAttribute('tabindex');
  }
}

function setStudyChromeActive(active) {
  els.app?.classList.toggle('app--study', active);
}

function renderDashboard() {
  populateStudyGroupSelect();
  populateAddGroupSelect();
  populateDeckGroupFilter();
  refreshWordDatalist();

  const allCards = getCards();
  const filtered = cardsMatchingStudyFilter(allCards);
  const due = dueNowQueue(filtered);
  const dueCount = due.length;
  const poolTotal = filtered.length;
  const total = allCards.length;
  const brainFill = poolTotal ? Math.min(1, Math.max(0, dueCount / poolTotal)) : 0;
  els.dueBrainVisual?.style.setProperty('--brain-fill', String(brainFill));
  if (dueCount === 0) els.dueBrainVisual?.classList.add('due-brain-visual--drained');
  else els.dueBrainVisual?.classList.remove('due-brain-visual--drained');

  els.statTotal.textContent = String(total);

  els.progressCount.textContent =
    poolTotal === 0 ? t('progressZeroDue') : t('progressDueInPool', { due: dueCount, total: poolTotal });

  const gradesN = getGradesTodayCount();
  if (els.progressGradesToday) {
    if (gradesN > 0) {
      els.progressGradesToday.hidden = false;
      els.progressGradesToday.textContent = t('gradesToday', { n: gradesN });
    } else {
      els.progressGradesToday.hidden = true;
      els.progressGradesToday.textContent = '';
    }
  }

  if (poolTotal === 0) {
    if (total === 0) els.reviewHint.textContent = t('reviewHintEmptyDeck');
    else els.reviewHint.textContent = t('reviewHintNoCardsInGroup');
    els.btnStartReview.disabled = true;
  } else if (dueCount === 0) {
    els.reviewHint.textContent = t('reviewHintFullPool');
    els.btnStartReview.disabled = false;
  } else {
    els.reviewHint.textContent = '';
    els.btnStartReview.disabled = false;
  }

  const uid = getLastSyncedUserId();
  const obErr = getLastOutboxFlushError();
  if (uid) {
    els.accountHint.hidden = false;
    els.accountHint.textContent = t('accountHint', { id: uid.slice(-8) });
    if (obErr) els.accountHint.setAttribute('title', obErr);
    else els.accountHint.removeAttribute('title');
  } else {
    els.accountHint.hidden = true;
    els.accountHint.textContent = '';
    els.accountHint.removeAttribute('title');
  }

  if (els.deckPanel?.classList.contains('deck-panel--open')) {
    renderDeckList();
  }
  updateSyncLabel();
}

function updateSessionProgress() {
  const total = queue.length;
  if (total === 0) {
    els.studyRemainingLabel.textContent = '';
    els.sessionBarFill.style.width = '0%';
    els.sessionBarWrap.setAttribute('aria-valuenow', '0');
    return;
  }
  const remaining = Math.max(0, total - queueIndex);
  const done = queueIndex;
  const pct = Math.round((done / total) * 100);
  els.studyRemainingLabel.textContent =
    remaining === 1 ? t('studyRemainingOne') : t('studyRemaining', { n: remaining });
  els.sessionBarFill.style.width = `${pct}%`;
  els.sessionBarWrap.setAttribute('aria-valuenow', String(pct));
}

function showStudyCard() {
  const card = queue[queueIndex];
  if (!card) {
    finishStudySession();
    return;
  }
  els.studyFront.textContent = card.word;
  els.studyBack.textContent = card.translation;
  els.studyBackWrap.classList.remove('flash-back-wrap--revealed');
  els.studyBackWrap.classList.add('flash-back-wrap--closed');
  els.studyBackWrap.setAttribute('aria-hidden', 'true');
  els.btnShowAnswer.hidden = false;
  els.gradeRow.hidden = true;
  updateSessionProgress();
  requestAnimationFrame(() => {
    try {
      els.btnShowAnswer.focus();
    } catch {
      /* ignore */
    }
  });
}

function finishStudySession() {
  detachStudyKeyboard();
  setStudyChromeActive(false);
  els.viewStudy.classList.remove('view--active');
  els.viewStudy.hidden = true;
  els.viewDashboard.classList.add('view--active');
  els.viewDashboard.hidden = false;
  renderDashboard();
  focusStartReview();
  showToast(t('toastSessionComplete'));
}

function revealStudyAnswer() {
  if (els.btnShowAnswer.hidden) return;
  els.studyBackWrap.classList.remove('flash-back-wrap--closed');
  void els.studyBackWrap.offsetWidth;
  els.studyBackWrap.classList.add('flash-back-wrap--revealed');
  els.studyBackWrap.setAttribute('aria-hidden', 'false');
  els.btnShowAnswer.hidden = true;
  els.gradeRow.hidden = false;
}

let studyKeyboardAttached = false;

/** @param {KeyboardEvent} e */
function onStudyKeydown(e) {
  if (!els.viewStudy.classList.contains('view--active')) return;
  const target = /** @type {HTMLElement | null} */ (e.target);
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

  if (!e.repeat && (e.key === ' ' || e.key === 'Enter')) {
    if (!els.btnShowAnswer.hidden) {
      e.preventDefault();
      revealStudyAnswer();
    }
    return;
  }

  if (els.gradeRow.hidden) return;
  const ch = e.key.length === 1 ? e.key.toLowerCase() : '';
  if (e.repeat) return;
  if (ch === 'h' || e.key === '1') {
    e.preventDefault();
    void grade(true);
    return;
  }
  if (ch === 'e' || e.key === '2') {
    e.preventDefault();
    void grade(false);
  }
}

function attachStudyKeyboard() {
  if (studyKeyboardAttached) return;
  studyKeyboardAttached = true;
  window.addEventListener('keydown', onStudyKeydown);
}

function detachStudyKeyboard() {
  if (!studyKeyboardAttached) return;
  studyKeyboardAttached = false;
  window.removeEventListener('keydown', onStudyKeydown);
}

function startReview() {
  const filtered = cardsMatchingStudyFilter(getCards());
  if (filtered.length === 0) {
    showToast(t('toastNoCardsDue'));
    return;
  }
  queue = filtered.slice();
  shuffleInPlace(queue);
  queueIndex = 0;
  setStudyChromeActive(true);
  els.viewDashboard.classList.remove('view--active');
  els.viewDashboard.hidden = true;
  els.viewStudy.classList.add('view--active');
  els.viewStudy.hidden = false;
  showStudyCard();
  attachStudyKeyboard();
  requestAnimationFrame(() => {
    try {
      els.btnShowAnswer.focus();
    } catch {
      /* ignore */
    }
  });
}

async function grade(hard) {
  if (gradeInFlight) {
    return;
  }
  const card = queue[queueIndex];
  if (!card) return;
  gradeInFlight = true;
  if (els.btnHard) els.btnHard.disabled = true;
  if (els.btnEasy) els.btnEasy.disabled = true;
  try {
    const now = Date.now();
    const srs = computeNextSrs(hard, card.srsStep ?? 0, now);
    await updateCardSrs(card.id, srs);
    bumpGradesToday();
    renderDashboard();
    const slot = queueIndex;
    const fresh = getCards().find((c) => c.id === card.id);
    if (fresh && slot >= 0 && slot < queue.length) queue[slot] = fresh;

    queueIndex += 1;
    if (queueIndex >= queue.length) {
      updateSessionProgress();
      finishStudySession();
      return;
    }
    showStudyCard();
  } finally {
    gradeInFlight = false;
    if (els.btnHard) els.btnHard.disabled = false;
    if (els.btnEasy) els.btnEasy.disabled = false;
  }
}

function onAddCardFormSubmit(e) {
  e.preventDefault();
  e.stopPropagation();
  void runAddCardFlow();
}

async function runAddCardFlow() {
  const word = els.inputWord.value.trim();
  const translation = els.inputTranslation.value.trim();
  if (!word || !translation) return;

  if (els.selectAddGroup?.value === '__new__') {
    const ng = (els.inputNewGroupName?.value || '').trim();
    if (!ng) {
      showToast(t('toastEnterNewGroup'));
      els.inputNewGroupName?.focus();
      return;
    }
  }

  const submitBtn = els.formAddCardSubmit;
  if (submitBtn) submitBtn.disabled = true;

  const clearForm = () => {
    els.inputWord.value = '';
    els.inputTranslation.value = '';
    els.inputWord.focus();
  };

  const groupLabel = getAddFormGroupLabel();

  try {
    const card = await addCard(word, translation, groupLabel);
    if (card === null) {
      showToast(t('alertDuplicateWord'));
      return;
    }
    clearForm();
    renderDashboard();
    showToast(t('toastCardAdded'));
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

els.formAddCard.addEventListener('submit', onAddCardFormSubmit);

if (els.btnTranslateWand) {
  els.btnTranslateWand.addEventListener('click', () => {
    void runAutoTranslate();
  });
}

els.btnStartReview.addEventListener('click', startReview);

els.selectLangSource?.addEventListener('change', saveLangPair);
els.selectLangTarget?.addEventListener('change', saveLangPair);

els.selectStudyGroup?.addEventListener('change', () => {
  if (!els.selectStudyGroup) return;
  studyGroupFilter = els.selectStudyGroup.value;
  saveStudyGroupFilter(studyGroupFilter);
  renderDashboard();
});

els.selectAddGroup?.addEventListener('change', () => {
  toggleNewGroupInput();
  refreshWordDatalist();
});

els.inputNewGroupName?.addEventListener('input', () => {
  refreshWordDatalist();
});

els.deckToggle?.addEventListener('click', () => {
  if (!els.deckContent || !els.deckToggle || !els.deckPanel) return;
  const willOpen = !els.deckPanel.classList.contains('deck-panel--open');
  els.deckPanel.classList.toggle('deck-panel--open', willOpen);
  els.deckContent.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
  els.deckToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  if (willOpen) renderDeckList();
});

els.deckSearch?.addEventListener('input', () => {
  scheduleRenderDeckList();
});

els.selectDeckGroupFilter?.addEventListener('change', () => {
  deckListGroupFilter = els.selectDeckGroupFilter?.value || '';
  renderDeckList();
});

let swipePtrId = null;
let swipeStartX = 0;
const SWIPE_MIN_PX = 56;

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function canStudySwipe() {
  return (
    !prefersReducedMotion() &&
    !!els.viewStudy?.classList.contains('view--active') &&
    !!els.btnShowAnswer?.hidden &&
    !els.gradeRow?.hidden
  );
}

/** @param {PointerEvent} e */
function onStudySwipePointerDown(e) {
  if (e.pointerType !== 'touch' || !canStudySwipe()) return;
  swipePtrId = e.pointerId;
  swipeStartX = e.clientX;
  try {
    els.studyCard?.setPointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
}

/** @param {PointerEvent} e */
function onStudySwipePointerUp(e) {
  if (swipePtrId !== e.pointerId) return;
  swipePtrId = null;
  if (e.pointerType !== 'touch' || !canStudySwipe()) return;
  const dx = e.clientX - swipeStartX;
  if (dx < -SWIPE_MIN_PX) void grade(true);
  else if (dx > SWIPE_MIN_PX) void grade(false);
}

function attachStudySwipe() {
  const el = els.studyCard;
  if (!el || el.dataset.swipeBound === '1') return;
  el.dataset.swipeBound = '1';
  el.addEventListener('pointerdown', onStudySwipePointerDown);
  el.addEventListener('pointerup', onStudySwipePointerUp);
  el.addEventListener('pointercancel', onStudySwipePointerUp);
}

function restoreFooterSyncLabel() {
  els.btnForceSync.classList.remove('btn-footer-sync--success');
  els.btnForceSync.removeAttribute('aria-label');
  if (els.btnFooterSyncText) els.btnFooterSyncText.textContent = t('forceSync');
}

els.btnForceSync.addEventListener('click', async () => {
  if (footerSyncCheckTimer) {
    clearTimeout(footerSyncCheckTimer);
    footerSyncCheckTimer = null;
  }
  restoreFooterSyncLabel();
  els.btnForceSync.disabled = true;
  try {
    const r = await forceFullSyncFromSupabase();
    if (r.ok && r.skippedStale) {
      showToast(t('toastSyncStaleRetrying'));
    } else if (r.ok) {
      els.btnForceSync.classList.add('btn-footer-sync--success');
      if (els.btnFooterSyncText) els.btnFooterSyncText.textContent = '✅';
      els.btnForceSync.setAttribute('aria-label', t('footerSyncCompleteAria'));
      footerSyncCheckTimer = setTimeout(() => {
        restoreFooterSyncLabel();
        footerSyncCheckTimer = null;
      }, 1500);
    } else if (r.reason === 'offline') showToast(t('toastOfflineCloud'));
    else if (r.detail) showToast(t('toastSyncFailedReason', { reason: r.detail }));
    else showToast(t('toastSyncFailed'));
  } finally {
    els.btnForceSync.disabled = false;
    renderDashboard();
  }
});
els.btnExitStudy.addEventListener('click', () => {
  detachStudyKeyboard();
  queue = [];
  queueIndex = 0;
  setStudyChromeActive(false);
  els.viewStudy.classList.remove('view--active');
  els.viewStudy.hidden = true;
  els.viewDashboard.classList.add('view--active');
  els.viewDashboard.hidden = false;
  renderDashboard();
  focusStartReview();
});

els.btnShowAnswer.addEventListener('click', () => {
  revealStudyAnswer();
});

els.btnHard.addEventListener('click', () => grade(true));
els.btnEasy.addEventListener('click', () => grade(false));

function onSyncStatusActivate() {
  if (getSyncState() === 'error') void refreshFromRemote().then(() => renderDashboard());
}

els.syncStatus.addEventListener('click', onSyncStatusActivate);
els.syncStatus.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onSyncStatusActivate();
  }
});

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('./sw.js')
    .then((reg) => {
      void reg.update();
    })
    .catch((err) => {
      console.error('[SW] Registration failed:', err);
    });
}

applyUiStrings();
attachStudySwipe();

els.howtoToggle?.addEventListener('click', () => {
  const panel = els.howtoPanel;
  const btn = els.howtoToggle;
  const content = els.howtoContent;
  if (!panel || !btn) return;
  const open = !panel.classList.contains('howto-panel--open');
  panel.classList.toggle('howto-panel--open', open);
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  content?.setAttribute('aria-hidden', open ? 'false' : 'true');
});

try {
  await initDataStore({
    onUpdate: () => renderDashboard(),
  });
} catch (err) {
  console.error('[App] initDataStore failed:', err);
  showToast('Could not connect. Check your connection and reload.');
}
renderDashboard();
registerSW();
