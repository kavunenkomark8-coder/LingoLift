const CACHE = 'lingolift-v73-deck-scroll-smooth-ease';

const ASSETS = [
  './',
  './index.html',
  './css/styles.css?v=70-dashboard-grid-align',
  './js/app.js',
  './js/i18n.js',
  './js/data-store.js',
  './js/supabase-config.js',
  './manifest.json',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.allSettled(ASSETS.map((url) => cache.add(url))).then(() => cache)
      )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (key === CACHE ? Promise.resolve(true) : caches.delete(key)))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Cache-first for CDN libs (offline after first load).
 * @param {FetchEvent} e
 */
function respondCacheFirstCdn(e) {
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      if (cached) return cached;
      try {
        const res = await fetch(e.request);
        if (res.ok) await cache.put(e.request, res.clone());
        return res;
      } catch (err) {
        const stale = await cache.match(e.request);
        if (stale) return stale;
        throw err;
      }
    })
  );
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.hostname.endsWith('supabase.co')) {
    e.respondWith(fetch(e.request));
    return;
  }

  if (url.hostname === 'translate.googleapis.com') {
    e.respondWith(fetch(e.request));
    return;
  }

  if (url.hostname === 'esm.sh') {
    respondCacheFirstCdn(e);
    return;
  }

  if (url.hostname === 'cdn.jsdelivr.net') {
    respondCacheFirstCdn(e);
    return;
  }

  /** Same-origin app shell: network-first so Hard/Due-now fixes are not stuck behind stale SW cache. */
  const path = url.pathname;
  const pathOrQuery = path + url.search;
  const isAppShell =
    url.origin === self.location.origin &&
    (path.endsWith('.html') ||
      path.endsWith('.js') ||
      /\.css(\?|$)/i.test(pathOrQuery) ||
      path.endsWith('/'));

  if (isAppShell) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        fetch(e.request)
          .then((res) => {
            if (res.ok) void cache.put(e.request, res.clone());
            return res;
          })
          .catch(() => cache.match(e.request))
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
