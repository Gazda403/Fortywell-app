const CACHE_NAME = 'fortywell-pwa-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/apple-touch-icon.png',
  '/silent.wav',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only cache same-origin resources or static fonts/assets
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // Strictly NETWORK-FIRST for HTML / page navigations to always load latest code
  if (request.mode === 'navigate' || request.destination === 'document' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Cache first for hashed static assets (_expo/static, images, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Return null or placeholder if offline
      });
    })
  );
});

// ── Active Workout Lock Screen Notifications ─────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_WORKOUT_NOTIFICATION') {
    const { title, options } = event.data;
    if (self.registration && typeof self.registration.showNotification === 'function') {
      self.registration.showNotification(title || '🟢 Workout Active', {
        icon: '/apple-touch-icon.png',
        badge: '/apple-touch-icon.png',
        tag: 'active-workout',
        renotify: false,
        silent: true,
        requireInteraction: true,
        ...options,
      }).catch((err) => console.warn('[SW] showNotification warning:', err));
    }
  } else if (event.data.type === 'CLEAR_WORKOUT_NOTIFICATION') {
    if (self.registration && typeof self.registration.getNotifications === 'function') {
      self.registration.getNotifications({ tag: 'active-workout' }).then((notifications) => {
        notifications.forEach((n) => n.close());
      }).catch(() => {});
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  try {
    event.notification.close();
  } catch (_) {}

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
