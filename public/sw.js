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

  const url = event.notification.data?.url || "https://astro-space-camp-tracker.vercel.app/";

  event.waitUntil(
    clients.openWindow(url)
  );
});