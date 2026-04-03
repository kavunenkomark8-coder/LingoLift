/** @typedef {'en' | 'ru' | 'ua' | 'pt'} Lang */

export const LANG_STORAGE_KEY = 'lingolift-lang';
export const SUPPORTED_LANGS = /** @type {const} */ (['en', 'ru', 'ua', 'pt']);

/** UI cycle order: RU → UA → EN → PT → RU */
export const LANG_CYCLE = /** @type {const} */ (['ru', 'ua', 'en', 'pt']);

/** @type {Lang} */
let currentLang = 'en';

/**
 * All UI strings. Buttons/headers kept short for single-line layout (nowrap + compact copy).
 */
export const translations = {
  en: {
    tagline: 'Vocabulary · Spaced repetition',
    howtoTitle: 'How to use',
    howtoLi1: 'Add <strong>Portuguese</strong> words + translation.',
    howtoLi2: 'Tap <strong>Review</strong> for spaced repetition.',
    howtoLi3: 'Progress <strong>syncs</strong> to the cloud.',
    howtoLi4: 'Use bottom <strong>Cloud sync</strong> if a device lacks cards.',
    syncHelpBody1:
      'Loads <strong>all rows</strong> from <code>cards</code>; new rows use <code>user_id = auth.uid()</code>.',
    syncHelpBody2: 'Re-enable <strong>RLS</strong>? Adjust policies or per-user filters.',
    dueToday: 'Due today',
    progressZeroDue: '0 today',
    progressLeftDue: '{remaining} left · {peak} today',
    startReview: 'Review',
    forceSync: 'Cloud sync',
    reviewHintEmptyDeck: 'Add your first card.',
    reviewHintNoneToday: 'All done for today.',
    addCardTitle: 'Add card',
    fieldWord: 'Word',
    fieldTranslation: 'Translation',
    placeholderWord: 'e.g. casa',
    placeholderTranslation: 'e.g. house',
    addCardSubmit: 'Add',
    statsDeckSuffix: 'cards',
    accountHint: 'All rows · new: …{id}',
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
    toastSessionComplete: 'Done.',
    toastNoCardsDue: 'Nothing due today.',
    toastCardAdded: 'Added.',
    alertDuplicateWord: 'Word already in deck.',
    toastSynced: '{count} cards synced',
    toastOfflineCloud: 'Offline.',
    toastSyncFailed: 'Sync failed.',
    ariaDashboard: 'Dashboard',
    ariaStudy: 'Study',
    langCycleAria: 'Change language',
  },
  ru: {
    tagline: 'Словарь · Повторения',
    howtoTitle: 'Как пользоваться',
    howtoLi1: 'Слова на <strong>португальском</strong> + перевод.',
    howtoLi2: 'Кнопка <strong>Повтор</strong> — интервалы.',
    howtoLi3: 'Прогресс в <strong>облаке</strong>.',
    howtoLi4: 'Внизу <strong>Синхр.</strong> — нет карт на другом устройстве.',
    syncHelpBody1:
      'Все строки <code>cards</code>; новые с <code>user_id = auth.uid()</code>.',
    syncHelpBody2: '<strong>RLS</strong> — настройте политики.',
    dueToday: 'Сегодня',
    progressZeroDue: '0 сегодня',
    progressLeftDue: '{remaining} из {peak}',
    startReview: 'Повтор',
    forceSync: 'Синхр.',
    reviewHintEmptyDeck: 'Добавьте карту.',
    reviewHintNoneToday: 'Всё на сегодня.',
    addCardTitle: 'Карта',
    fieldWord: 'Слово',
    fieldTranslation: 'Перевод',
    placeholderWord: 'casa',
    placeholderTranslation: 'дом',
    addCardSubmit: 'Внести',
    statsDeckSuffix: 'карт',
    accountHint: 'Все строки · новые: …{id}',
    studyExit: '← Выход',
    showAnswer: 'Ответ',
    gradeHard: 'Сложно',
    gradeHardSub: 'скоро',
    gradeEasy: 'Легко',
    gradeEasySub: 'позже',
    studyRemaining: 'ещё {n}',
    studyRemainingOne: 'ещё 1',
    syncOffline: 'Офлайн',
    syncSyncing: 'Синхр…',
    syncError: 'Ошибка · тап',
    toastSessionComplete: 'Готово.',
    toastNoCardsDue: 'Нет карт.',
    toastCardAdded: 'Добавлено.',
    alertDuplicateWord: 'Уже есть.',
    toastSynced: '{count} карт',
    toastOfflineCloud: 'Офлайн.',
    toastSyncFailed: 'Сбой.',
    ariaDashboard: 'Главная',
    ariaStudy: 'Повтор',
    langCycleAria: 'Язык',
  },
  ua: {
    tagline: 'Словник · Повторення',
    howtoTitle: 'Як користуватись',
    howtoLi1: '<strong>Португальські</strong> слова + переклад.',
    howtoLi2: 'Кнопка <strong>Повтор</strong> — інтервали.',
    howtoLi3: 'Прогрес у <strong>хмарі</strong>.',
    howtoLi4: 'Внизу <strong>Синхр.</strong> — нема карт на іншому пристрої.',
    syncHelpBody1: 'Усі рядки <code>cards</code>; нові з <code>user_id = auth.uid()</code>.',
    syncHelpBody2: '<strong>RLS</strong> — політики.',
    dueToday: 'Сьогодні',
    progressZeroDue: '0 сьогодні',
    progressLeftDue: '{remaining} з {peak}',
    startReview: 'Повтор',
    forceSync: 'Синхр.',
    reviewHintEmptyDeck: 'Додайте карту.',
    reviewHintNoneToday: 'Все на сьогодні.',
    addCardTitle: 'Картка',
    fieldWord: 'Слово',
    fieldTranslation: 'Переклад',
    placeholderWord: 'casa',
    placeholderTranslation: 'дім',
    addCardSubmit: 'Додати',
    statsDeckSuffix: 'карт',
    accountHint: 'Усі рядки · нові: …{id}',
    studyExit: '← Вихід',
    showAnswer: 'Відповідь',
    gradeHard: 'Важко',
    gradeHardSub: 'згодом',
    gradeEasy: 'Легко',
    gradeEasySub: 'пізніше',
    studyRemaining: 'ще {n}',
    studyRemainingOne: 'ще 1',
    syncOffline: 'Офлайн',
    syncSyncing: 'Синхр…',
    syncError: 'Помилка · тап',
    toastSessionComplete: 'Готово.',
    toastNoCardsDue: 'Нема карт.',
    toastCardAdded: 'Додано.',
    alertDuplicateWord: 'Вже є.',
    toastSynced: '{count} карт',
    toastOfflineCloud: 'Офлайн.',
    toastSyncFailed: 'Збій.',
    ariaDashboard: 'Головна',
    ariaStudy: 'Повтор',
    langCycleAria: 'Мова',
  },
  pt: {
    tagline: 'Vocabulário · SRS',
    howtoTitle: 'Como usar',
    howtoLi1: 'Palavras em <strong>português</strong> + tradução.',
    howtoLi2: '<strong>Revisar</strong> = repetição espaçada.',
    howtoLi3: 'Progresso na <strong>nuvem</strong>.',
    howtoLi4: '<strong>Sync</strong> em baixo se faltar cartões.',
    syncHelpBody1: 'Todas as linhas <code>cards</code>; novas com <code>user_id = auth.uid()</code>.',
    syncHelpBody2: '<strong>RLS</strong> — ajuste políticas.',
    dueToday: 'Hoje',
    progressZeroDue: '0 hoje',
    progressLeftDue: '{remaining} · {peak}',
    startReview: 'Revisar',
    forceSync: 'Sync',
    reviewHintEmptyDeck: 'Primeiro cartão.',
    reviewHintNoneToday: 'Nada hoje.',
    addCardTitle: 'Cartão',
    fieldWord: 'Palavra',
    fieldTranslation: 'Tradução',
    placeholderWord: 'casa',
    placeholderTranslation: 'house',
    addCardSubmit: 'Salvar',
    statsDeckSuffix: 'cartões',
    accountHint: 'Tudo na tabela · novos: …{id}',
    studyExit: '← Sair',
    showAnswer: 'Resposta',
    gradeHard: 'Difícil',
    gradeHardSub: 'já',
    gradeEasy: 'Fácil',
    gradeEasySub: 'depois',
    studyRemaining: '{n} hoje',
    studyRemainingOne: '1 hoje',
    syncOffline: 'Offline',
    syncSyncing: 'Sync…',
    syncError: 'Erro · toque',
    toastSessionComplete: 'Fim.',
    toastNoCardsDue: 'Nada hoje.',
    toastCardAdded: 'Ok.',
    alertDuplicateWord: 'Já existe.',
    toastSynced: '{count} ok',
    toastOfflineCloud: 'Offline.',
    toastSyncFailed: 'Falhou.',
    ariaDashboard: 'Painel',
    ariaStudy: 'Estudo',
    langCycleAria: 'Idioma',
  },
};

/**
 * @param {string} lang
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 */
export function t(lang, key, vars) {
  const L = translations[/** @type {Lang} */ (lang)] || translations.en;
  const fallback = translations.en;
  let str = L[key] ?? fallback[key] ?? key;
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : `{${k}}`
    );
  }
  return str;
}

/** @returns {Lang} */
export function getLang() {
  try {
    const s = localStorage.getItem(LANG_STORAGE_KEY);
    if (s && SUPPORTED_LANGS.includes(/** @type {Lang} */ (s))) return /** @type {Lang} */ (s);
  } catch {
    /* ignore */
  }
  return 'en';
}

export function getCurrentLang() {
  return currentLang;
}

/**
 * @param {string} lang
 */
export function applyLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(/** @type {Lang} */ (lang))) lang = 'en';
  currentLang = /** @type {Lang} */ (lang);

  try {
    localStorage.setItem(LANG_STORAGE_KEY, currentLang);
  } catch {
    /* ignore */
  }

  const htmlLang = currentLang === 'ua' ? 'uk' : currentLang;
  document.documentElement.lang = htmlLang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    el.textContent = t(currentLang, key);
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (!key) return;
    el.innerHTML = t(currentLang, key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key || !('placeholder' in el)) return;
    el.placeholder = t(currentLang, key);
  });

  const flagBtn = document.getElementById('btn-lang-cycle');
  if (flagBtn) {
    flagBtn.setAttribute('data-active-lang', currentLang);
    flagBtn.setAttribute('aria-label', t(currentLang, 'langCycleAria'));
  }

  const dash = document.getElementById('view-dashboard');
  const study = document.getElementById('view-study');
  if (dash) dash.setAttribute('aria-label', t(currentLang, 'ariaDashboard'));
  if (study) study.setAttribute('aria-label', t(currentLang, 'ariaStudy'));
}
