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
  const req = event.request;

  // ❌ Do NOT touch non-GET (POST, PUT, etc.)
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // ❌ Do NOT touch external APIs (Supabase, Google, etc.)
  if (url.origin !== self.location.origin) return;

  // ❌ Do NOT touch websocket / realtime
  if (url.protocol === "ws:" || url.protocol === "wss:") return;

  // ✅ Only cache your static files
  event.respondWith(
    caches.match(req).then((response) => {
      return response || fetch(req);
    })
  );
});


self.addEventListener('push', function(event) {
  const data = event.data.json();

  self.registration.showNotification(data.title || "New Notification", {
    body: data.body || "Something happened",
    icon: '/asc-logo-color.svg',
    data: {
      url: data.url
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