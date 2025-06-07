const CACHE_NAME = "carburants-" + Date.now(); // Cache unique à chaque ouverture

self.addEventListener("install", (e) => {
  self.skipWaiting(); // Prend le contrôle immédiatement
  e.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Supprime tous les anciens caches
        return Promise.all(cacheNames.map((cache) => caches.delete(cache)));
      })
      .then(() => {
        // Recrée un cache vierge
        return caches.open(CACHE_NAME);
      })
  );
});

self.addEventListener("fetch", (e) => {
  // Stratégie "Network First" + mise à jour du cache
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Met à jour le cache en arrière-plan
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse.clone()));
        return networkResponse;
      })
      .catch(() => caches.match(e.request)) // Fallback très rare
  );
});

// Dans le Service Worker
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("data.economie.gouv.fr")) {
    // API toujours fraîche
    e.respondWith(fetch(e.request));
  } else {
    // Assets statiques en cache
    e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
  }
});
