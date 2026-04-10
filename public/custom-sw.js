// public/custom-sw.js
// Handler de push notifications para o PWA Pai de Primeira

// ── Força NetworkOnly para todas as requisições do Supabase ──
self.addEventListener("fetch", function (event) {
  const url = event.request.url;
  if (url.includes("supabase.co/rest/")) {
    event.respondWith(fetch(event.request.clone()));
  }
});

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (_) {
    data = { title: "Pai de Primeira", body: event.data.text() };
  }

  const title   = data.title || "Pai de Primeira";
  const options = {
    body:    data.body  || "Você tem uma novidade esta semana.",
    icon:    "/icons/icon-192.png",
    badge:   "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    data:    { url: data.url || "/" },
    actions: data.url ? [{ action: "open", title: "Ver agora" }] : [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});