/** @typedef {'en' | 'ru' | 'ua' | 'pt'} Lang */

export const LANG_STORAGE_KEY = 'lingolift-lang';
export const SUPPORTED_LANGS = /** @type {const} */ (['en', 'ru', 'ua', 'pt']);

/** UI cycle order: RU → UA → EN → PT → RU */
export const LANG_CYCLE = /** @type {const} */ (['ru', 'ua', 'en', 'pt']);

/** @type {Lang} */
let currentLang = 'en';

/**
 * UI strings. How-to: six bullets (HTML) per language.
 */
export const translations = {
  en: {
    tagline: 'Spaced repetition',
    howtoTitle: 'How to use',
    howtoLi1: 'Add <strong>Portuguese</strong> words and translations in the form.',
    howtoLi2: 'Tap <strong>Repeat</strong> for spaced repetition: word → answer → Hard / Easy.',
    howtoLi3: 'Your <strong>schedule syncs</strong> to the cloud automatically when online.',
    howtoLi4: 'Missing cards on another device? Tap <strong>Cloud sync</strong> at the bottom.',
    howtoLi5:
      'The deck loads <strong>all rows</strong> from <code>cards</code>; new rows store <code>user_id</code> for the record.',
    howtoLi6: 'With <strong>RLS</strong> on in Supabase, adjust policies—or use per-user queries again.',
    dueToday: 'Due today',
    progressZeroDue: '0 today',
    progressLeftDue: '{remaining} left · {peak} today',
    startReview: 'Repeat',
    forceSync: 'Cloud sync',
    reviewHintEmptyDeck: 'Add your first card.',
    reviewHintNoneToday: 'All done for today!',
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
    toastSessionComplete: 'All done for today!',
    toastNoCardsDue: 'Nothing due today.',
    toastCardAdded: 'Added.',
    alertDuplicateWord: 'Word already in deck.',
    toastSynced: '{count} cards synced',
    toastOfflineCloud: 'Offline.',
    toastSyncFailed: 'Sync failed.',
    ariaDashboard: 'Dashboard',
    ariaStudy: 'Study',
    langCycleAria: 'Change language',
    translateWandTooltip: 'Auto-translate',
    toastEnterWord: 'Enter a word first.',
    alertTranslationFailed: 'Translation failed',
  },
  ru: {
    tagline: 'Интервальные повторения',
    howtoTitle: 'Как пользоваться',
    howtoLi1: 'Добавляйте слова на <strong>португальском</strong> и перевод в форме.',
    howtoLi2: 'Кнопка <strong>Повтор</strong>: слово → ответ → Сложно / Легко.',
    howtoLi3: '<strong>Расписание</strong> синхронизируется с облаком онлайн.',
    howtoLi4: 'Нет карт на другом устройстве? Внизу — <strong>Облако</strong>.',
    howtoLi5: 'Колода = <strong>все строки</strong> <code>cards</code>; новые с <code>user_id</code>.',
    howtoLi6: '<strong>RLS</strong> в Supabase — настройте политики или фильтр по пользователю.',
    dueToday: 'Сегодня',
    progressZeroDue: '0 сегодня',
    progressLeftDue: '{remaining} из {peak}',
    startReview: 'Повтор',
    forceSync: 'Облако',
    reviewHintEmptyDeck: 'Добавьте карту.',
    reviewHintNoneToday: 'На сегодня всё!',
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
    toastSessionComplete: 'На сегодня всё!',
    toastNoCardsDue: 'Нет карт.',
    toastCardAdded: 'Добавлено.',
    alertDuplicateWord: 'Уже есть.',
    toastSynced: '{count} карт',
    toastOfflineCloud: 'Офлайн.',
    toastSyncFailed: 'Сбой.',
    ariaDashboard: 'Главная',
    ariaStudy: 'Повтор',
    langCycleAria: 'Язык',
    translateWandTooltip: 'Автоперевод',
    toastEnterWord: 'Сначала введите слово.',
    alertTranslationFailed: 'Translation failed',
  },
  ua: {
    tagline: 'Інтервальні повторення',
    howtoTitle: 'Як користуватись',
    howtoLi1: 'Додавайте слова <strong>португальською</strong> та переклад у формі.',
    howtoLi2: 'Кнопка <strong>Повтор</strong>: слово → відповідь → Важко / Легко.',
    howtoLi3: '<strong>Розклад</strong> синхронізується з хмарою онлайн.',
    howtoLi4: 'Нема карт на іншому пристрої? Внизу — <strong>Хмара</strong>.',
    howtoLi5: 'Колода = <strong>усі рядки</strong> <code>cards</code>; нові з <code>user_id</code>.',
    howtoLi6: '<strong>RLS</strong> у Supabase — політики або фільтр за користувачем.',
    dueToday: 'Сьогодні',
    progressZeroDue: '0 сьогодні',
    progressLeftDue: '{remaining} з {peak}',
    startReview: 'Повтор',
    forceSync: 'Хмара',
    reviewHintEmptyDeck: 'Додайте карту.',
    reviewHintNoneToday: 'На сьогодні все!',
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
    toastSessionComplete: 'На сьогодні все!',
    toastNoCardsDue: 'Нема карт.',
    toastCardAdded: 'Додано.',
    alertDuplicateWord: 'Вже є.',
    toastSynced: '{count} карт',
    toastOfflineCloud: 'Офлайн.',
    toastSyncFailed: 'Збій.',
    ariaDashboard: 'Головна',
    ariaStudy: 'Повтор',
    langCycleAria: 'Мова',
    translateWandTooltip: 'Автопереклад',
    toastEnterWord: 'Спочатку введіть слово.',
    alertTranslationFailed: 'Translation failed',
  },
  pt: {
    tagline: 'Repetição espaçada',
    howtoTitle: 'Como usar',
    howtoLi1: 'Adicione palavras em <strong>português</strong> e tradução no formulário.',
    howtoLi2: '<strong>Revisar</strong>: palavra → resposta → Difícil / Fácil.',
    howtoLi3: 'O <strong>calendário sincroniza</strong> na nuvem quando online.',
    howtoLi4: 'Faltam cartões? Toque em <strong>Sincro</strong> em baixo.',
    howtoLi5: 'Baralho = <strong>todas as linhas</strong> de <code>cards</code>; novas com <code>user_id</code>.',
    howtoLi6: 'Com <strong>RLS</strong> no Supabase, ajuste políticas ou filtros por utilizador.',
    dueToday: 'Hoje',
    progressZeroDue: '0 hoje',
    progressLeftDue: '{remaining} · {peak}',
    startReview: 'Revisar',
    forceSync: 'Sincro',
    reviewHintEmptyDeck: 'Primeiro cartão.',
    reviewHintNoneToday: 'Tudo pronto por hoje!',
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
    toastSessionComplete: 'Tudo pronto por hoje!',
    toastNoCardsDue: 'Nada hoje.',
    toastCardAdded: 'Ok.',
    alertDuplicateWord: 'Já existe.',
    toastSynced: '{count} ok',
    toastOfflineCloud: 'Offline.',
    toastSyncFailed: 'Falhou.',
    ariaDashboard: 'Painel',
    ariaStudy: 'Estudo',
    langCycleAria: 'Idioma',
    translateWandTooltip: 'Traduzir',
    toastEnterWord: 'Escreva a palavra primeiro.',
    alertTranslationFailed: 'Translation failed',
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

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (!key) return;
    const s = t(currentLang, key);
    el.title = s;
    el.setAttribute('aria-label', s);
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
