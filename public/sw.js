/* ── FlipTrack Service Worker v6 ─────────────────────────────────────────
   Smart caching strategies per asset type:
   • HTML navigation     → network-first  (always fresh, offline fallback)
   • Hashed JS/CSS       → stale-while-revalidate  (fast + always updated)
   • Non-hashed scripts  → network-first  (always get latest version)
   • Images & fonts      → cache-first    (rarely change, fast loads)

   v6 fixes the stale-cache bug where corrupted JS bundles were served
   forever because v5 used cache-first for ALL JS files.
   ──────────────────────────────────────────────────────────────────────── */

const CACHE_NAME = 'fliptrack-v6';
const MAX_CACHE_ENTRIES = 120;
const PRECACHE = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './ebay-callback.html',
  './etsy-callback.html',
  './offline.html',
];

// Regex: Vite hashed filenames like index-DZJH950b.js or index-CkgpLNDD.css
const HASHED_ASSET = /\/assets\/[^/]+-[A-Za-z0-9_-]{6,}\.(js|css)$/;

// ── INSTALL ─────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE — purge ALL old caches (v5 and earlier) ────────────────────
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
    const toDelete = keys.length - MAX_CACHE_ENTRIES;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// ── HELPERS ──────────────────────────────────────────────────────────────

/** Network-first: try network, fall back to cache */
async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('./offline.html');
      if (offlinePage) return offlinePage;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

/** Stale-while-revalidate: serve cache immediately, update in background */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Always fetch fresh copy in background
  const fetchPromise = fetch(request).then(res => {
    if (res.ok) {
      cache.put(request, res.clone());
      trimCache();
    }
    return res;
  }).catch(() => cached || new Response('Offline', { status: 503, statusText: 'Offline' }));

  // Return cached version immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

/** Cache-first: serve from cache, only fetch if not cached */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
      trimCache();
    }
    return res;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// ── FETCH ROUTER ────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin (Supabase API, CDNs, etc.)
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // 1. HTML navigation → network-first (always fresh page)
  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // 2. Hashed Vite assets (JS/CSS with content hash) → stale-while-revalidate
  //    These have unique filenames per build, so serving stale is safe
  //    while the fresh version loads in the background for next visit.
  if (HASHED_ASSET.test(url.pathname)) {
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }

  // 3. Non-hashed JS/CSS (sw.js, inline scripts) → network-first
  //    These can change without filename changes, so always try network.
  if (url.pathname.match(/\.(js|css)$/)) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // 4. Images, fonts, icons → cache-first (rarely change)
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|webp)$/)) {
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // 5. Everything else (manifest.json, etc.) → stale-while-revalidate
  e.respondWith(staleWhileRevalidate(e.request));
});

// ── VAPID PUSH NOTIFICATIONS ────────────────────────────────────────────
self.addEventListener('push', (e) => {
  if (!e.data) return;

  let payload;
  try {
    payload = e.data.json();
  } catch {
    payload = { title: 'FlipTrack', body: e.data.text() };
  }

  const title = payload.title || 'FlipTrack';
  const options = {
    body: payload.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: payload.tag || 'ft-push',
    data: payload.data || {},
    vibrate: [100, 50, 100],
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  const data = e.notification.data || {};
  // Determine which view to navigate to
  let targetUrl = './app.html';
  if (data.type === 'low-stock' || data.type === 'oos') {
    targetUrl = './app.html#inventory';
  }

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes('app.html')) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      return self.clients.openWindow(targetUrl);
    })
  );
});
