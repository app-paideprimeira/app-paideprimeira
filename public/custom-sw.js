self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();

  const title = data.title || "Pai de Primeira";
  const options = {
    body: data.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: data.url || "/",
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || "/")
  );
});
