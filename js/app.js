import {
  initDataStore,
  getCards,
  addCard,
  updateCardNextReview,
  getSyncState,
  getLastSyncedUserId,
  refreshFromRemote,
  forceFullSyncFromSupabase,
  HARD_MS,
  EASY_MS,
} from './data-store.js';
import { applyUiStrings, t } from './i18n.js';

const DAY_STATS_KEY = 'lingolift-day-stats';

/** @typedef {{ date: string, peakDue: number }} DayStats */

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** @returns {DayStats} */
function getDayStats(currentDueCount) {
  const key = todayKey();
  let s = null;
  try {
    s = JSON.parse(localStorage.getItem(DAY_STATS_KEY) || 'null');
  } catch {
    s = null;
  }
  if (!s || s.date !== key || typeof s.peakDue !== 'number') {
    s = { date: key, peakDue: currentDueCount };
  } else {
    s.peakDue = Math.max(s.peakDue, currentDueCount);
  }
  localStorage.setItem(DAY_STATS_KEY, JSON.stringify(s));
  return s;
}

/** @param {{ id: string, word: string, translation: string, nextReview: number }[]} cards */
function dueTodayQueue(cards) {
  const end = endOfToday();
  const out = [];
  for (const c of cards) {
    if (c.nextReview <= end) out.push(c);
  }
  out.sort((a, b) => a.nextReview - b.nextReview);
  return out;
}

const els = {
  app: document.getElementById('app'),
  syncDynamicRow: document.getElementById('sync-dynamic-row'),
  viewDashboard: document.getElementById('view-dashboard'),
  viewStudy: document.getElementById('view-study'),
  progressCount: document.getElementById('progress-count'),
  progressFill: document.getElementById('progress-fill'),
  progressBarWrap: document.getElementById('progress-bar-wrap'),
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
};

/** @type {ReturnType<typeof setTimeout> | null} */
let footerSyncCheckTimer = null;

/** @type {{ id: string, word: string, translation: string, nextReview: number }[]} */
let queue = [];
let queueIndex = 0;
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
    els.syncStatus.classList.add('sync-status--action');
    els.syncStatus.setAttribute('role', 'button');
    els.syncStatus.setAttribute('tabindex', '0');
    els.app?.classList.add('app--sync-active');
    els.syncDynamicRow?.classList.add('sync-dynamic-row--visible');
  } else {
    els.syncStatus.textContent = '';
    els.syncStatus.removeAttribute('role');
    els.syncStatus.removeAttribute('tabindex');
  }
}

function setStudyChromeActive(active) {
  els.app?.classList.toggle('app--study', active);
}

function renderDashboard() {
  const cards = getCards();
  const due = dueTodayQueue(cards);
  const remaining = due.length;
  const total = cards.length;
  const stats = getDayStats(remaining);
  const peak = stats.peakDue;
  const cleared = Math.max(0, peak - remaining);
  const pct = peak === 0 ? 0 : Math.min(100, Math.round((cleared / peak) * 100));

  els.statTotal.textContent = String(total);

  els.progressCount.textContent =
    peak === 0
      ? t('progressZeroDue')
      : t('progressLeftDue', { remaining, peak });
  els.progressFill.style.width = `${peak === 0 ? 0 : pct}%`;
  els.progressBarWrap.setAttribute('aria-valuenow', String(peak === 0 ? 0 : pct));
  els.progressBarWrap.setAttribute('aria-valuemax', '100');

  if (remaining === 0) {
    els.reviewHint.textContent =
      total === 0 ? t('reviewHintEmptyDeck') : t('reviewHintNoneToday');
    els.btnStartReview.disabled = true;
  } else {
    els.reviewHint.textContent = '';
    els.btnStartReview.disabled = false;
  }

  const uid = getLastSyncedUserId();
  if (uid) {
    els.accountHint.hidden = false;
    els.accountHint.textContent = t('accountHint', { id: uid.slice(-8) });
  } else {
    els.accountHint.hidden = true;
    els.accountHint.textContent = '';
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
}

function finishStudySession() {
  setStudyChromeActive(false);
  els.viewStudy.classList.remove('view--active');
  els.viewStudy.hidden = true;
  els.viewDashboard.classList.add('view--active');
  els.viewDashboard.hidden = false;
  renderDashboard();
  showToast(t('toastSessionComplete'));
}

function startReview() {
  const cards = getCards();
  queue = dueTodayQueue(cards);
  if (queue.length === 0) {
    showToast(t('toastNoCardsDue'));
    return;
  }
  queueIndex = 0;
  setStudyChromeActive(true);
  els.viewDashboard.classList.remove('view--active');
  els.viewDashboard.hidden = true;
  els.viewStudy.classList.add('view--active');
  els.viewStudy.hidden = false;
  showStudyCard();
}

async function grade(hard) {
  const card = queue[queueIndex];
  if (!card) return;
  const now = Date.now();
  const next = now + (hard ? HARD_MS : EASY_MS);
  await updateCardNextReview(card.id, next);

  queueIndex += 1;
  if (queueIndex >= queue.length) {
    updateSessionProgress();
    finishStudySession();
    return;
  }
  showStudyCard();
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

  const submitBtn = els.formAddCardSubmit;
  if (submitBtn) submitBtn.disabled = true;

  const clearForm = () => {
    els.inputWord.value = '';
    els.inputTranslation.value = '';
    els.inputWord.focus();
  };

  try {
    const card = await addCard(word, translation);
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
    if (r.ok) {
      els.btnForceSync.classList.add('btn-footer-sync--success');
      if (els.btnFooterSyncText) els.btnFooterSyncText.textContent = '✅';
      els.btnForceSync.setAttribute('aria-label', t('footerSyncCompleteAria'));
      footerSyncCheckTimer = setTimeout(() => {
        restoreFooterSyncLabel();
        footerSyncCheckTimer = null;
      }, 1500);
    } else if (r.reason === 'offline') showToast(t('toastOfflineCloud'));
    else showToast(t('toastSyncFailed'));
  } finally {
    els.btnForceSync.disabled = false;
    renderDashboard();
  }
});
els.btnExitStudy.addEventListener('click', () => {
  queue = [];
  queueIndex = 0;
  setStudyChromeActive(false);
  els.viewStudy.classList.remove('view--active');
  els.viewStudy.hidden = true;
  els.viewDashboard.classList.add('view--active');
  els.viewDashboard.hidden = false;
  renderDashboard();
});

els.btnShowAnswer.addEventListener('click', () => {
  els.studyBackWrap.classList.remove('flash-back-wrap--closed');
  void els.studyBackWrap.offsetWidth;
  els.studyBackWrap.classList.add('flash-back-wrap--revealed');
  els.studyBackWrap.setAttribute('aria-hidden', 'false');
  els.btnShowAnswer.hidden = true;
  els.gradeRow.hidden = false;
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
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.error('[SW] Registration failed:', err);
    });
  }
}

applyUiStrings();

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
