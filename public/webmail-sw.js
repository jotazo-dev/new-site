// Webmail Jotazo — Service Worker
// Escopo restrito a /webmail/ (não interfere com /, /minhaconta, etc.)
const CACHE_NAME = 'webmail-v1';
const ASSETS_TO_CACHE = [
  '/webmail',
  '/webmail/',
  '/webmail-offline.html',
  '/webmail.webmanifest',
  '/webmail-icon-192.png',
  '/webmail-icon-512.png',
  '/webmail-apple-touch-180.png',
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

  // Mesmo origem só
  if (url.origin !== self.location.origin) return;

  // Cobre apenas /webmail e /assets/ (chunks do Vite)
  if (!url.pathname.startsWith('/webmail') && !url.pathname.startsWith('/assets/')) return;

  // Nunca cachear chamadas autenticadas / sensíveis
  if (url.pathname.includes('logout')) return;
  if (url.pathname.includes('/functions/v1/')) return;
  if (url.pathname.includes('/rest/v1/')) return;
  if (url.pathname.includes('/auth/v1/')) return;

  const isAsset = url.pathname.startsWith('/assets/');
  const isNavigate = request.mode === 'navigate';

  // NetworkFirst: tenta rede, cai em cache se offline
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
      if (isNavigate && url.pathname.startsWith('/webmail')) {
        const offline = await caches.match('/webmail-offline.html');
        if (offline) return offline;
      }
      return Response.error();
    }
  })());
});
