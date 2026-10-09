// OneSignal & Mobile System Notification Service Worker
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Background Scheduled System Notifications (Runs even when phone screen is locked or app is closed)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const delay = event.data.delay || 5000;
    const title = event.data.title || '🦉 Academia de Rimas • RimaLab';
    const options = event.data.options || {};

    setTimeout(() => {
      self.registration.showNotification(title, {
        body: options.body || 'Sua lição de hoje tá te esperando! Não perca sua ofensiva.',
        icon: options.icon || '/pwa-192x192.png',
        badge: options.badge || '/badge-icon.png',
        image: options.image || '/notification-icon.png',
        tag: options.tag || 'rimalab-duolingo-lesson',
        renotify: true,
        requireInteraction: true,
        vibrate: options.vibrate || [300, 100, 300, 100, 400],
        data: options.data || { url: '/', tab: 'lessons' },
        actions: options.actions || [
          { action: 'open_lesson', title: '🦉 Fazer Lição Agora' },
          { action: 'open_studio', title: '🎤 Treinar Flow' },
          { action: 'close', title: 'Depois' }
        ]
      });
    }, delay);
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const title = event.data.title || '🦉 Academia de Rimas • RimaLab';
    const options = event.data.options || {};
    self.registration.showNotification(title, options);
  }
});

// Handle System Notification Action clicks from Android status bar / lock screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  let targetTab = 'lessons';

  if (action === 'open_studio') {
    targetTab = 'studio';
  } else if (action === 'open_lesson') {
    targetTab = 'lessons';
  } else if (action === 'close') {
    return;
  } else if (event.notification.data && event.notification.data.tab) {
    targetTab = event.notification.data.tab;
  }

  const urlToOpen = new URL(`/?tab=${targetTab}`, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
