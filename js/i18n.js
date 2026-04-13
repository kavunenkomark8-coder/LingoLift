/**
 * English-only UI strings. `data-i18n` / `data-i18n-html` keys map here.
 */

export const strings = {
  tagline: 'Spaced repetition',
  howtoTitle: 'How to use',
  howtoLi1: 'Add words + translation.',
  howtoLi2: 'Tap "Repeat" to run through the whole filtered set (spaced repetition on each answer).',
  howtoLi3:
    'Progress syncs to the cloud under <strong>this browser\'s anonymous account</strong> (see account id on the dashboard). Another device uses a different id unless you add a shared sign-in later.',
  howtoLi4: 'Use "Cloud sync" at the bottom if the device lacks cards.',
  howtoLi5: 'Works offline — cards sync automatically when you reconnect.',
  howtoLi6:
    'In Supabase SQL, <code>count(*)</code> on <code>cards</code> counts every user\'s rows; the app only shows cards for the current account id.',
  howtoLi7:
    'Large screen: <kbd>Space</kbd> or <kbd>Enter</kbd> reveals the answer; <kbd>1</kbd> / <kbd>H</kbd> = Hard, <kbd>2</kbd> / <kbd>E</kbd> = Easy.',
  howtoLi8:
    'Use <strong>Group for review</strong> to repeat only one subset, or <strong>My deck</strong> to search and edit cards.',
  howtoLi9: 'Touch: after the answer is shown, swipe left on the card for Hard, right for Easy.',
  studyDesktopKeysHint:
    'Keyboard: Space or Enter to show answer; 1 or H for Hard; 2 or E for Easy.',
  dueToday: 'Due now',
  progressZeroDue: '0 / 0',
  progressDueInPool: '{due} / {total}',
  gradesToday: '{n} ratings saved today',
  startReview: 'Repeat',
  forceSync: 'Cloud sync',
  reviewHintEmptyDeck: 'Add your first card.',
  reviewHintNoCardsInGroup: 'No cards in this group.',
  reviewHintNoneToday: 'All done for today!',
  reviewHintFullPool:
    'Nothing due right now in this group. Repeat still runs every card (Hard schedules ~15 min ahead).',
  addCardTitle: 'Add card',
  fieldStudyGroup: 'Group for review',
  fieldCardGroup: 'Group',
  fieldNewGroupName: 'New group name',
  placeholderNewGroup: 'e.g. Travel',
  groupFilterAll: 'All groups',
  groupUngrouped: 'Ungrouped',
  groupNewOption: 'New group…',
  deckPanelTitle: 'My deck',
  deckSearchPlaceholder: 'Search word or translation…',
  deckEmpty: 'No cards match.',
  deckEdit: 'Edit',
  deckSave: 'Save',
  deckCancel: 'Cancel',
  deckDelete: 'Delete',
  deckGroupBadge: 'Group',
  toastCardUpdated: 'Saved.',
  toastCardDeleted: 'Removed.',
  confirmDeleteCard: 'Delete this card?',
  fieldSourceLang: 'Source language',
  fieldTargetLang: 'Target language',
  fieldWord: 'Word',
  fieldTranslation: 'Translation',
  placeholderWord: 'e.g. casa',
  placeholderTranslation: 'e.g. house',
  addCardSubmit: 'Add',
  statsDeckSuffix: 'cards',
  accountHint:
    'This device only · account …{id} · In Supabase SQL, add where user_id = your id to match this count (table totals include every user).',
  studyExit: '← Exit',
  showAnswer: 'Answer',
  gradeHard: 'Hard',
  gradeHardSub: 'soon',
  gradeEasy: 'Easy',
  gradeEasySub: 'later',
  studyRemaining: '{n} left in session',
  studyRemainingOne: '1 left in session',
  syncOffline: 'Offline · cached deck',
  syncSyncing: 'Syncing…',
  syncError: 'Sync error · tap to retry',
  toastSessionComplete: 'All done for today!',
  toastNoCardsDue: 'No cards in this review scope.',
  toastCardAdded: 'Added.',
  toastEnterNewGroup: 'Enter a name for the new group.',
  alertDuplicateWord: 'Word already exists in this group.',
  footerSyncCompleteAria: 'Sync complete',
  toastOfflineCloud: 'Offline.',
  toastSyncFailed: 'Sync failed.',
  toastSyncFailedReason: 'Sync failed: {reason}',
  toastSyncStaleRetrying: 'Saving in progress — cloud list will merge in a moment.',
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
