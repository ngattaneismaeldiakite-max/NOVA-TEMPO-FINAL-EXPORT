// Service Worker NovaTempo pour notifications push arrière-plan et écran verrouillé

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Événement clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('studio.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/studio.html');
      }
    })
  );
});

// Événement push générique
self.addEventListener('push', (event) => {
  let payload = { title: "🎉 Ta chanson NovaTempo est prête !", body: "Cliquez ici pour l'écouter !" };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch(e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body || "Ta chanson est prête !",
    icon: 'assets/images/logo.png',
    badge: 'assets/images/logo.png',
    vibrate: [200, 100, 200],
    data: { url: payload.url || '/studio.html' }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "🎉 NovaTempo", options)
  );
});
