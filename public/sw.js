// Service Worker para Push Notifications
// Este arquivo deve estar na raiz do public/

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || "",
      icon: data.icon || "/favicon/android-chrome-192x192.png",
      badge: data.badge || "/favicon/android-chrome-96x96.png",
      image: data.image,
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: "open",
          title: "Abrir",
        },
        {
          action: "close",
          title: "Fechar",
        },
      ],
      tag: data.data?.notificationId || "primebet-notification",
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "PrimeBet", options)
    );
  } catch (error) {
    console.error("Erro ao processar push:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Verificar se já tem uma aba aberta
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // Abrir nova aba
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Ativar o service worker imediatamente
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
