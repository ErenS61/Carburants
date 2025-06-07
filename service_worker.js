// Service Worker ultra-minimaliste
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Prend contrôle immédiat
});

self.addEventListener('activate', (e) => {
  // Supprime tous les caches existants
  caches.keys().then(cacheNames => {
    return Promise.all(cacheNames.map(cache => caches.delete(cache)));
  });
});

self.addEventListener('fetch', (e) => {
  // Stratégie "Network Only" (pas de cache du tout)
  e.respondWith(
    fetch(e.request).catch(() => new Response('Erreur de connexion'))
  );
});