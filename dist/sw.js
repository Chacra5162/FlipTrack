/* ── FlipTrack Service Worker ─────────────────────────────────────────────
   Cache-first PWA with LRU eviction and network-first HTML.
   ──────────────────────────────────────────────────────────────────────── */

const CACHE_NAME = 'fliptrack-v4';
const MAX_CACHE_ENTRIES = 100;
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ── INSTALL ─────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── LRU CACHE EVICTION ──────────────────────────────────────────────────
async function trimCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_ENTRIES) {
    // Delete oldest entries (first in = oldest)
    const toDelete = keys.length - MAX_CACHE_ENTRIES;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// ── FETCH — network-first for API & HTML, cache-first for assets ────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin API calls (Supabase, etc.)
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // HTML navigation — network first, fall back to cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) — cache first, then network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Only cache successful responses for known static asset types
        if (res.ok && url.pathname.match(/\.(js|css|png|jpg|svg|ico|woff2?)$/)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => {
            c.put(e.request, clone);
            // Evict old entries after caching new ones
            trimCache();
          });
        }
        return res;
      });
    })
  );
});
