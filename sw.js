// Service Worker para PWA - Finanzas Mensuales
const CACHE_VERSION = 'v1.0.4';
const CACHE_NAME = `finanzas-mensuales-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/firebase-config.js',
  '/manifest.json',
  '/public/icon-72.png',
  '/public/icon-96.png',
  '/public/icon-128.png',
  '/public/icon-144.png',
  '/public/icon-152.png',
  '/public/icon-192.png',
  '/public/icon-384.png',
  '/public/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log(`[SW] Instalando Service Worker ${CACHE_VERSION}...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Archivos en caché');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[SW] Error al cachear archivos:', err);
      })
  );
  // NO hacer skipWaiting automáticamente, esperar mensaje del cliente
  // self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia de fetch: Network First, fallback to Cache
self.addEventListener('fetch', event => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar peticiones a Firebase y APIs externas para datos en tiempo real
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('firestore') ||
      event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, clonarla y guardarla en caché
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar obtener desde caché
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Si no está en caché, devolver página offline personalizada
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Manejo de mensajes desde el cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] ⚡ Recibido mensaje SKIP_WAITING - Activando nueva versión inmediatamente');
    self.skipWaiting();
  }
});

// Sincronización en segundo plano (cuando se recupera la conexión)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  console.log('[SW] Sincronizando transacciones...');
  // Aquí puedes implementar lógica para sincronizar datos pendientes
  // cuando se recupere la conexión a internet
}

// Notificaciones Push (opcional)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: '/public/icon-192.png',
    badge: '/public/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Finanzas Mensuales', options)
  );
});

// Manejo de click en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
