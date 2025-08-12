// Push Notification utilities
const VAPID_PUBLIC_KEY = 'BDB0PAVZh55THKruHw_IONnc5bVaX8Aqpvbhb62xBFbukP7xbLnrtLBNBm685d9a0mZ4MAnJf7dIj5UgGecgS10';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Request permission and get push subscription
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    // Check if service worker and push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications are not supported');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get push subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('p256dh')!)))),
        auth: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(subscription.getKey('auth')!))))
      }
    };

    console.log('Push subscription created:', subscriptionData);
    return subscriptionData;

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

// Save push subscription to database
export async function savePushSubscription(subscription: PushSubscription): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return response.ok;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return false;
  }
}

// Send a test push notification
export async function sendTestNotification(): Promise<boolean> {
  try {
    const response = await fetch('/api/push/test', {
      method: 'POST',
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}