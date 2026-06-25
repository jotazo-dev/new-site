const CACHE_NAME = 'minhaconta-v2';
const ASSETS_TO_CACHE = [
  '/minhaconta',
  '/minhaconta/',
  '/minhaconta-offline.html',
  '/minhaconta.webmanifest',
  '/minhaconta-icon-192.png',
  '/minhaconta-icon-512.png',
  '/minhaconta-apple-touch-180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS_TO_CACHE).catch(() => {})
    )
  );
  // Não chamamos skipWaiting() automaticamente — aguardamos comando do app.
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
    );
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/minhaconta') && !url.pathname.startsWith('/assets/')) return;
  if (url.pathname.includes('logout')) return;

  const isAsset = url.pathname.startsWith('/assets/');
  const isNavigate = request.mode === 'navigate';

  event.respondWith((async () => {
    try {
      const preload = isNavigate && event.preloadResponse ? await event.preloadResponse : null;
      const response = preload || await fetch(request);
      if (response && response.ok && (isAsset || isNavigate)) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (isNavigate && url.pathname.startsWith('/minhaconta')) {
        const offline = await caches.match('/minhaconta-offline.html');
        if (offline) return offline;
      }
      return Response.error();
    }
  })());
});
