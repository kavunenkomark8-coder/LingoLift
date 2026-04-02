const STORAGE_KEY = 'lingolift-cards';
const DAY_STATS_KEY = 'lingolift-day-stats';

/** @typedef {{ id: string, word: string, translation: string, nextReview: number }} Card */
/** @typedef {{ date: string, peakDue: number }} DayStats */

const HARD_MS = 6 * 60 * 60 * 1000;
const EASY_MS = 3 * 24 * 60 * 60 * 1000;

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

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

/** @returns {Card[]} */
function loadCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c) =>
        c &&
        typeof c.id === 'string' &&
        typeof c.word === 'string' &&
        typeof c.translation === 'string' &&
        typeof c.nextReview === 'number'
    );
  } catch {
    return [];
  }
}

/** @param {Card[]} cards */
function saveCards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

/** Due if nextReview is on or before end of today (includes overdue). */
function isDueToday(card) {
  return card.nextReview <= endOfToday();
}

/** @param {Card[]} cards */
function dueTodayQueue(cards) {
  return cards.filter(isDueToday).sort((a, b) => a.nextReview - b.nextReview);
}

const els = {
  viewDashboard: document.getElementById('view-dashboard'),
  viewStudy: document.getElementById('view-study'),
  progressCount: document.getElementById('progress-count'),
  progressFill: document.getElementById('progress-fill'),
  progressBarWrap: document.getElementById('progress-bar-wrap'),
  btnStartReview: document.getElementById('btn-start-review'),
  reviewHint: document.getElementById('review-hint'),
  formAddCard: document.getElementById('form-add-card'),
  inputWord: document.getElementById('input-word'),
  inputTranslation: document.getElementById('input-translation'),
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
};

/** @type {Card[]} */
let queue = [];
let queueIndex = 0;
let toastTimer = null;

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2200);
}

function renderDashboard() {
  const cards = loadCards();
  const due = dueTodayQueue(cards);
  const remaining = due.length;
  const total = cards.length;
  const stats = getDayStats(remaining);
  const peak = stats.peakDue;
  const cleared = Math.max(0, peak - remaining);
  const pct = peak === 0 ? 0 : Math.min(100, Math.round((cleared / peak) * 100));

  els.statTotal.textContent = String(total);

  els.progressCount.textContent =
    peak === 0 ? '0 due today' : `${remaining} left · ${peak} due today`;
  els.progressFill.style.width = `${peak === 0 ? 0 : pct}%`;
  els.progressBarWrap.setAttribute('aria-valuenow', String(peak === 0 ? 0 : pct));
  els.progressBarWrap.setAttribute('aria-valuemax', '100');

  if (remaining === 0) {
    els.reviewHint.textContent =
      total === 0 ? 'Add your first card to begin.' : 'Nothing left for today.';
    els.btnStartReview.disabled = true;
  } else {
    els.reviewHint.textContent = '';
    els.btnStartReview.disabled = false;
  }
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
  els.studyRemainingLabel.textContent = `${remaining} card${remaining === 1 ? '' : 's'} left today`;
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
  els.studyBackWrap.hidden = true;
  els.btnShowAnswer.hidden = false;
  els.gradeRow.hidden = true;
  updateSessionProgress();
}

function finishStudySession() {
  els.viewStudy.classList.remove('view--active');
  els.viewStudy.hidden = true;
  els.viewDashboard.classList.add('view--active');
  els.viewDashboard.hidden = false;
  renderDashboard();
  showToast('Session complete.');
}

function startReview() {
  const cards = loadCards();
  queue = dueTodayQueue(cards);
  if (queue.length === 0) {
    showToast('No cards due today.');
    return;
  }
  queueIndex = 0;
  els.viewDashboard.classList.remove('view--active');
  els.viewDashboard.hidden = true;
  els.viewStudy.classList.add('view--active');
  els.viewStudy.hidden = false;
  showStudyCard();
}

function grade(hard) {
  const card = queue[queueIndex];
  if (!card) return;
  const now = Date.now();
  const all = loadCards();
  const i = all.findIndex((c) => c.id === card.id);
  if (i === -1) return;
  all[i].nextReview = now + (hard ? HARD_MS : EASY_MS);
  saveCards(all);

  queueIndex += 1;
  if (queueIndex >= queue.length) {
    updateSessionProgress();
    finishStudySession();
    return;
  }
  showStudyCard();
}

els.formAddCard.addEventListener('submit', (e) => {
  e.preventDefault();
  const word = els.inputWord.value.trim();
  const translation = els.inputTranslation.value.trim();
  if (!word || !translation) return;
  const cards = loadCards();
  cards.push({
    id: uid(),
    word,
    translation,
    nextReview: Date.now(),
  });
  saveCards(cards);
  els.inputWord.value = '';
  els.inputTranslation.value = '';
  els.inputWord.focus();
  renderDashboard();
  showToast('Card added.');
});

els.btnStartReview.addEventListener('click', startReview);
els.btnExitStudy.addEventListener('click', () => {
  queue = [];
  queueIndex = 0;
  els.viewStudy.classList.remove('view--active');
  els.viewStudy.hidden = true;
  els.viewDashboard.classList.add('view--active');
  els.viewDashboard.hidden = false;
  renderDashboard();
});

els.btnShowAnswer.addEventListener('click', () => {
  els.studyBackWrap.hidden = false;
  els.btnShowAnswer.hidden = true;
  els.gradeRow.hidden = false;
});

els.btnHard.addEventListener('click', () => grade(true));
els.btnEasy.addEventListener('click', () => grade(false));

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

renderDashboard();
registerSW();
