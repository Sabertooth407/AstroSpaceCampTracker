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
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});