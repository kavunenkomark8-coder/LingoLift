/**
 * English-only UI strings. `data-i18n` / `data-i18n-html` keys map here.
 */

export const strings = {
  tagline: 'Spaced repetition',
  howtoTitle: 'How to use',
  howtoLi1: 'Add words + translation.',
  howtoLi2: 'Tap "Repeat" for spaced repetition.',
  howtoLi3: 'Progress syncs to the cloud.',
  howtoLi4: 'Use "Cloud sync" at the bottom if the device lacks cards.',
  howtoLi5: 'Works offline — cards sync automatically when you reconnect.',
  howtoLi6: 'Use "Cloud sync" on any new device to restore your full deck.',
  dueToday: 'Due today',
  progressZeroDue: '0 today',
  progressLeftDue: '{remaining} left · {peak} today',
  startReview: 'Repeat',
  randomOrderLabel: 'Random card order',
  forceSync: 'Cloud sync',
  reviewHintEmptyDeck: 'Add your first card.',
  reviewHintNoneToday: 'All done for today!',
  addCardTitle: 'Add card',
  fieldSourceLang: 'Source language',
  fieldTargetLang: 'Target language',
  fieldWord: 'Word',
  fieldTranslation: 'Translation',
  placeholderWord: 'e.g. casa',
  placeholderTranslation: 'e.g. house',
  addCardSubmit: 'Add',
  statsDeckSuffix: 'cards',
  accountHint: 'Synced · account …{id}',
  studyExit: '← Exit',
  showAnswer: 'Answer',
  gradeHard: 'Hard',
  gradeHardSub: 'soon',
  gradeEasy: 'Easy',
  gradeEasySub: 'later',
  studyRemaining: '{n} left today',
  studyRemainingOne: '1 left today',
  syncOffline: 'Offline · cached deck',
  syncSyncing: 'Syncing…',
  syncError: 'Sync error · tap to retry',
  toastSessionComplete: 'All done for today!',
  toastNoCardsDue: 'Nothing due today.',
  toastCardAdded: 'Added.',
  alertDuplicateWord: 'Word already in deck.',
  footerSyncCompleteAria: 'Sync complete',
  toastOfflineCloud: 'Offline.',
  toastSyncFailed: 'Sync failed.',
  ariaDashboard: 'Dashboard',
  ariaStudy: 'Study',
  translateWandTooltip: 'Auto-translate',
  toastTranslationNotFound: 'Translation not found',
  alertTranslationFailed: 'Translation failed',
};

/**
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 */
export function t(key, vars) {
  let str = key in strings ? strings[/** @type {keyof typeof strings} */ (key)] : key;
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : `{${k}}`
    );
  }
  return str;
}

/** Applies English strings to all `[data-i18n*]` nodes. Document `<html lang="en">` is fixed. */
export function applyUiStrings() {
  try {
    localStorage.removeItem('lingolift-lang');
  } catch {
    /* ignore */
  }

  document.documentElement.lang = 'en';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (!key) return;
    el.innerHTML = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key || !('placeholder' in el)) return;
    el.placeholder = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (!key) return;
    const s = t(key);
    el.title = s;
    el.setAttribute('aria-label', s);
  });

  const dash = document.getElementById('view-dashboard');
  const study = document.getElementById('view-study');
  if (dash) dash.setAttribute('aria-label', t('ariaDashboard'));
  if (study) study.setAttribute('aria-label', t('ariaStudy'));
}
