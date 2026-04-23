const CACHE_NAME = "app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html"
];

// ✅ INSTALL (required for PWA)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// ✅ ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ✅ FETCH (required for PWA installability)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});


self.addEventListener('push', function(event) {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error("Push parse error:", e);
  }

  self.registration.showNotification(data.title || "New Notification", {
    body: data.body || "Something happened",
    icon: '/asc-logo-color.svg',
    data: {
      url: data.url || "/"
    }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || "https://asc2026.vercel.app/";

  event.waitUntil(
    clients.openWindow(url)
  );
});