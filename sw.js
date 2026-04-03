const CACHE = 'lingolift-v16.2';

const TESSERACT_CDN = [
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
];

const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/i18n.js',
  './js/data-store.js',
  './js/supabase-config.js',
  './manifest.json',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  ...TESSERACT_CDN,
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.allSettled(ASSETS.map((url) => cache.add(url))).then(() => cache)
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
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

  // Debug v16.2: do not cache-first Tesseract-related requests until OCR is stable online.
  if (e.request.url.includes('tesseract')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Language data host (explicit worker `langPath`) — bypass SW interception.
  if (url.hostname === 'tessdata.projectnaptha.com') {
    e.respondWith(fetch(e.request));
    return;
  }

  if (url.hostname.endsWith('supabase.co')) {
    e.respondWith(fetch(e.request));
    return;
  }

  if (url.hostname === 'api.mymemory.translated.net') {
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

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
