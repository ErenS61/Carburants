const CACHE_NAME = 'carburants-static-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './stations.js',
  './image/apple-touch-icon-192x192.png',
  './image/apple-touch-icon-512x512.png'
];

// Installation : cache uniquement les assets statiques
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())  // Prend le contrôle immédiatement
  );
});

// Nettoyage des anciens caches (optionnel mais recommandé)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
});

// Stratégie : 
// - Cache First pour les assets statiques
// - Network Only pour les données API
self.addEventListener('fetch', (e) => {
  // 1. Pas de cache pour les requêtes API
  if (e.request.url.includes('data.economie.gouv.fr')) {
    return fetch(e.request); // Toujours aller au réseau
  }

  // 2. Pour le reste (fichiers statiques), utiliser le cache
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request);
    })
  );
});