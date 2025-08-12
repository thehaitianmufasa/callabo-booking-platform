// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/callabo-logo.png',
      badge: '/callabo-logo.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 'default'
      },
      actions: [
        {
          action: 'view',
          title: 'View Booking',
          icon: '/calendar-icon.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    // Open the app to the bookings page
    event.waitUntil(
      clients.openWindow('/')
    );
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  // Track notification close if needed
  console.log('Notification closed');
});