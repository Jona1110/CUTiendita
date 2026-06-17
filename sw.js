const CACHE_NAME = 'cutiendita-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/micuenta.html',
  '/styles.css',
  '/script.js',
  '/LOGO_CUTIENDITA.png'
];

// Instala el Service Worker y almacena los archivos estáticos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activa el Service Worker y limpia versiones antiguas de caché si existen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de Red: Intenta cargar desde internet; si falla (sin señal), usa la caché
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones de anuncios o externas (como las de Google AdSense o Apps Script)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, guardamos una copia actualizada en caché
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red (aulas sin señal), recupera el recurso desde la caché local
        return caches.match(event.request);
      })
  );
});