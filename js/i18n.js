/** @typedef {'en' | 'ru' | 'ua' | 'pt'} Lang */

export const LANG_STORAGE_KEY = 'lingolift-lang';
export const SUPPORTED_LANGS = /** @type {const} */ (['en', 'ru', 'ua', 'pt']);

/** @type {Lang} */
let currentLang = 'en';

/**
 * All UI strings. Keys used with data-i18n / data-i18n-html / data-i18n-placeholder, or t().
 * Use {name} placeholders where noted in t().
 */
export const translations = {
  en: {
    tagline: 'Vocabulary · Spaced repetition',
    howtoTitle: 'How to use',
    howtoLi1: 'Add words in <strong>Portuguese</strong> and their translation.',
    howtoLi2: 'Click <strong>Start review</strong> for spaced repetition learning.',
    howtoLi3: 'Your progress is <strong>automatically synced</strong> to the cloud.',
    howtoLi4: 'Use <strong>Force sync from cloud</strong> if you don’t see your cards on another device.',
    dueToday: 'Due today',
    progressZeroDue: '0 due today',
    progressLeftDue: '{remaining} left · {peak} due today',
    startReview: 'Start review',
    forceSync: 'Force sync from cloud',
    reviewHintEmptyDeck: 'Add your first card to begin.',
    reviewHintNoneToday: 'Nothing left for today.',
    syncHelpTitle: 'How sync works',
    syncHelpBody1:
      'The app loads <strong>every row</strong> from the <code>cards</code> table. New cards still store <code>user_id = auth.uid()</code> for auditing.',
    syncHelpBody2:
      'If you turn <strong>RLS</strong> back on, restrict reads/writes in policies or switch this app back to per-user queries.',
    addCardTitle: 'Add card',
    fieldWord: 'Word',
    fieldTranslation: 'Translation',
    placeholderWord: 'e.g. casa',
    placeholderTranslation: 'e.g. house',
    addCardSubmit: 'Add card',
    statsDeckSuffix: 'cards in deck',
    accountHint: 'Deck: all rows in table · new cards use …{id}',
    studyExit: '← Exit',
    showAnswer: 'Show answer',
    gradeHard: 'Hard',
    gradeHardSub: 'soon',
    gradeEasy: 'Easy',
    gradeEasySub: 'later',
    studyRemaining: '{n} cards left today',
    studyRemainingOne: '1 card left today',
    syncOffline: 'Offline · using saved deck',
    syncSyncing: 'Syncing…',
    syncError: 'Cloud sync issue · tap to retry',
    toastSessionComplete: 'Session complete.',
    toastNoCardsDue: 'No cards due today.',
    toastCardAdded: 'Card added.',
    alertDuplicateWord: 'This word is already in your deck!',
    toastSynced: 'Synced · {count} cards',
    toastOfflineCloud: 'Offline — cannot reach cloud.',
    toastSyncFailed: 'Sync failed — check console.',
    ariaDashboard: 'Dashboard',
    ariaStudy: 'Study',
    langSwitcherLabel: 'Language',
  },
  ru: {
    tagline: 'Словарь · Интервальные повторения',
    howtoTitle: 'Как пользоваться',
    howtoLi1: 'Добавляйте слова на <strong>португальском</strong> и их перевод.',
    howtoLi2: 'Нажмите <strong>Начать повторение</strong> для обучения с интервалами.',
    howtoLi3: 'Прогресс <strong>автоматически синхронизируется</strong> с облаком.',
    howtoLi4: 'Используйте <strong>Принудительная синхронизация</strong>, если на другом устройстве не видно карточек.',
    dueToday: 'Сегодня к повторению',
    progressZeroDue: '0 на сегодня',
    progressLeftDue: 'осталось {remaining} · всего на сегодня {peak}',
    startReview: 'Начать повторение',
    forceSync: 'Синхронизировать из облака',
    reviewHintEmptyDeck: 'Добавьте первую карточку.',
    reviewHintNoneToday: 'На сегодня всё сделано.',
    syncHelpTitle: 'Как работает синхронизация',
    syncHelpBody1:
      'Приложение загружает <strong>все строки</strong> из таблицы <code>cards</code>. Новые карточки сохраняют <code>user_id = auth.uid()</code> для учёта.',
    syncHelpBody2:
      'Если снова включить <strong>RLS</strong>, настройте политики чтения/записи или верните фильтрацию по пользователю.',
    addCardTitle: 'Добавить карточку',
    fieldWord: 'Слово',
    fieldTranslation: 'Перевод',
    placeholderWord: 'напр. casa',
    placeholderTranslation: 'напр. дом',
    addCardSubmit: 'Добавить',
    statsDeckSuffix: 'карточек в колоде',
    accountHint: 'Колода: все строки таблицы · новые карточки: …{id}',
    studyExit: '← Выход',
    showAnswer: 'Показать ответ',
    gradeHard: 'Сложно',
    gradeHardSub: 'скоро',
    gradeEasy: 'Легко',
    gradeEasySub: 'позже',
    studyRemaining: 'осталось карточек сегодня: {n}',
    studyRemainingOne: 'осталась 1 карточка сегодня',
    syncOffline: 'Офлайн · сохранённая колода',
    syncSyncing: 'Синхронизация…',
    syncError: 'Ошибка облака · нажмите для повтора',
    toastSessionComplete: 'Сессия завершена.',
    toastNoCardsDue: 'Сегодня нет карточек к повторению.',
    toastCardAdded: 'Карточка добавлена.',
    alertDuplicateWord: 'Это слово уже есть в колоде!',
    toastSynced: 'Синхронизировано · {count} карточек',
    toastOfflineCloud: 'Офлайн — нет связи с облаком.',
    toastSyncFailed: 'Сбой синхронизации — см. консоль.',
    ariaDashboard: 'Главная',
    ariaStudy: 'Повторение',
    langSwitcherLabel: 'Язык',
  },
  ua: {
    tagline: 'Словник · Інтервальні повторення',
    howtoTitle: 'Як користуватися',
    howtoLi1: 'Додавайте слова <strong>португальською</strong> та їх переклад.',
    howtoLi2: 'Натисніть <strong>Почати повторення</strong> для навчання з інтервалами.',
    howtoLi3: 'Прогрес <strong>автоматично синхронізується</strong> з хмарою.',
    howtoLi4: 'Скористайтеся <strong>Примусовою синхронізацією</strong>, якщо на іншому пристрої не видно карток.',
    dueToday: 'Сьогодні до повторення',
    progressZeroDue: '0 на сьогодні',
    progressLeftDue: 'залишилось {remaining} · усього на сьогодні {peak}',
    startReview: 'Почати повторення',
    forceSync: 'Синхронізувати з хмари',
    reviewHintEmptyDeck: 'Додайте першу картку.',
    reviewHintNoneToday: 'На сьогодні все зроблено.',
    syncHelpTitle: 'Як працює синхронізація',
    syncHelpBody1:
      'Застосунок завантажує <strong>всі рядки</strong> з таблиці <code>cards</code>. Нові картки зберігають <code>user_id = auth.uid()</code> для обліку.',
    syncHelpBody2:
      'Якщо знову увімкнути <strong>RLS</strong>, налаштуйте політики читання/запису або поверніть фільтрацію за користувачем.',
    addCardTitle: 'Додати картку',
    fieldWord: 'Слово',
    fieldTranslation: 'Переклад',
    placeholderWord: 'напр. casa',
    placeholderTranslation: 'напр. дім',
    addCardSubmit: 'Додати',
    statsDeckSuffix: 'карток у колоді',
    accountHint: 'Колода: усі рядки таблиці · нові картки: …{id}',
    studyExit: '← Вихід',
    showAnswer: 'Показати відповідь',
    gradeHard: 'Важко',
    gradeHardSub: 'незабаром',
    gradeEasy: 'Легко',
    gradeEasySub: 'пізніше',
    studyRemaining: 'залишилось карток сьогодні: {n}',
    studyRemainingOne: 'залишилась 1 картка сьогодні',
    syncOffline: 'Офлайн · збережена колода',
    syncSyncing: 'Синхронізація…',
    syncError: 'Помилка хмари · натисніть для повтору',
    toastSessionComplete: 'Сесію завершено.',
    toastNoCardsDue: 'Сьогодні немає карток до повторення.',
    toastCardAdded: 'Картку додано.',
    alertDuplicateWord: 'Це слово вже є в колоді!',
    toastSynced: 'Синхронізовано · {count} карток',
    toastOfflineCloud: 'Офлайн — немає зв’язку з хмарою.',
    toastSyncFailed: 'Збій синхронізації — див. консоль.',
    ariaDashboard: 'Головна',
    ariaStudy: 'Повторення',
    langSwitcherLabel: 'Мова',
  },
  pt: {
    tagline: 'Vocabulário · Repetição espaçada',
    howtoTitle: 'Como usar',
    howtoLi1: 'Adicione palavras em <strong>português</strong> e a tradução.',
    howtoLi2: 'Clique em <strong>Iniciar revisão</strong> para estudar com repetição espaçada.',
    howtoLi3: 'O seu progresso é <strong>sincronizado automaticamente</strong> na nuvem.',
    howtoLi4: 'Use <strong>Sincronizar da nuvem</strong> se não vir os cartões noutro dispositivo.',
    dueToday: 'Para hoje',
    progressZeroDue: '0 para hoje',
    progressLeftDue: 'faltam {remaining} · {peak} para hoje',
    startReview: 'Iniciar revisão',
    forceSync: 'Sincronizar da nuvem',
    reviewHintEmptyDeck: 'Adicione o primeiro cartão.',
    reviewHintNoneToday: 'Nada pendente para hoje.',
    syncHelpTitle: 'Como funciona a sincronização',
    syncHelpBody1:
      'A app carrega <strong>todas as linhas</strong> da tabela <code>cards</code>. Novos cartões guardam <code>user_id = auth.uid()</code> para auditoria.',
    syncHelpBody2:
      'Se voltar a ativar <strong>RLS</strong>, restrinja leituras/escritas nas políticas ou volte a filtrar por utilizador.',
    addCardTitle: 'Adicionar cartão',
    fieldWord: 'Palavra',
    fieldTranslation: 'Tradução',
    placeholderWord: 'ex.: casa',
    placeholderTranslation: 'ex.: house',
    addCardSubmit: 'Adicionar cartão',
    statsDeckSuffix: 'cartões no baralho',
    accountHint: 'Baralho: todas as linhas da tabela · novos cartões usam …{id}',
    studyExit: '← Sair',
    showAnswer: 'Mostrar resposta',
    gradeHard: 'Difícil',
    gradeHardSub: 'em breve',
    gradeEasy: 'Fácil',
    gradeEasySub: 'depois',
    studyRemaining: '{n} cartões restantes hoje',
    studyRemainingOne: '1 cartão restante hoje',
    syncOffline: 'Offline · baralho guardado',
    syncSyncing: 'A sincronizar…',
    syncError: 'Erro na nuvem · toque para tentar de novo',
    toastSessionComplete: 'Sessão concluída.',
    toastNoCardsDue: 'Não há cartões para hoje.',
    toastCardAdded: 'Cartão adicionado.',
    alertDuplicateWord: 'Esta palavra já está no baralho!',
    toastSynced: 'Sincronizado · {count} cartões',
    toastOfflineCloud: 'Offline — sem ligação à nuvem.',
    toastSyncFailed: 'Falha na sincronização — veja a consola.',
    ariaDashboard: 'Painel',
    ariaStudy: 'Estudo',
    langSwitcherLabel: 'Idioma',
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
 * Applies static strings from translations to [data-i18n], [data-i18n-html], [data-i18n-placeholder].
 * Sets document lang (uk for UA). Updates language button active state.
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

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    const isActive = btn.getAttribute('data-lang') === currentLang;
    btn.classList.toggle('lang-btn--active', isActive);
    if (btn instanceof HTMLButtonElement) btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  const dash = document.getElementById('view-dashboard');
  const study = document.getElementById('view-study');
  if (dash) dash.setAttribute('aria-label', t(currentLang, 'ariaDashboard'));
  if (study) study.setAttribute('aria-label', t(currentLang, 'ariaStudy'));

  const sw = document.querySelector('.lang-switch');
  if (sw) sw.setAttribute('aria-label', t(currentLang, 'langSwitcherLabel'));
}
