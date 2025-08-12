'use client'

import { useState, useEffect } from 'react'
import { subscribeToPushNotifications, savePushSubscription, sendTestNotification } from '@/lib/pushNotifications'

export default function PushNotificationSetup() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permissionState, setPermissionState] = useState<string>('default')

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (supported) {
      // Check permission state
      setPermissionState(Notification.permission)
      
      // Check if user is already subscribed
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription)
        })
      })
    }
  }, [])

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      // Check notification permission first
      if (Notification.permission === 'denied') {
        alert('❌ Notifications are blocked! Please:\n\n1. Click the 🔒 icon in your address bar\n2. Change "Notifications" to "Allow"\n3. Refresh the page and try again')
        setIsLoading(false)
        return
      }

      const subscription = await subscribeToPushNotifications()
      if (subscription) {
        const saved = await savePushSubscription(subscription)
        if (saved) {
          setIsSubscribed(true)
          alert('🎉 Push notifications enabled!\n\nYou\'ll now receive instant booking confirmations on this device.')
        } else {
          alert('❌ Failed to save push subscription.\n\nPlease refresh the page and try again.')
        }
      } else {
        // More detailed error message based on permission state
        const permission = Notification.permission
        if (permission === 'default') {
          alert('❌ Push notifications setup incomplete.\n\nPlease click "Allow" when your browser asks for notification permission.')
        } else if (permission === 'denied') {
          alert('❌ Notifications are blocked!\n\nTo enable:\n1. Click 🔒 in address bar\n2. Change notifications to "Allow"\n3. Refresh page')
        } else {
          alert('❌ Failed to setup push notifications.\n\nTry refreshing the page or use a different browser.')
        }
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      alert('❌ Error setting up push notifications.\n\nThis browser may not support push notifications. Try Chrome or Firefox.')
    }
    setIsLoading(false)
  }

  const handleTestNotification = async () => {
    setIsLoading(true)
    try {
      const success = await sendTestNotification()
      if (success) {
        alert('🎉 Test notification sent! Check your device.')
      } else {
        alert('❌ Failed to send test notification.')
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      alert('❌ Error sending test notification.')
    }
    setIsLoading(false)
  }

  if (!isSupported) {
    return (
      <div style={{
        background: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#d97706',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          ⚠️ Push notifications are not supported on this device/browser
        </div>
        <div style={{
          color: '#92400e',
          fontSize: '12px',
          marginTop: '4px'
        }}>
          Try using Chrome, Firefox, or Safari on desktop/mobile
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      border: '2px solid #e8e9ff'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '700',
            color: '#333'
          }}>
            📱 Push Notifications
          </h3>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginTop: '4px'
          }}>
            Get instant booking confirmations on your device
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {isSubscribed ? (
            <button
              onClick={handleTestNotification}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#22c55e',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? '⏳' : '🧪 Test'}
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? '⏳ Setting up...' : '🔔 Enable'}
            </button>
          )}
        </div>
      </div>

      <div style={{
        background: isSubscribed ? '#f0fdf4' : permissionState === 'denied' ? '#fef2f2' : '#f8f9ff',
        padding: '12px',
        borderRadius: '8px',
        border: `2px solid ${isSubscribed ? '#bbf7d0' : permissionState === 'denied' ? '#fecaca' : '#e8e9ff'}`
      }}>
        <div style={{
          fontSize: '12px',
          color: isSubscribed ? '#15803d' : permissionState === 'denied' ? '#dc2626' : '#667eea',
          fontWeight: '600'
        }}>
          Status: {
            isSubscribed ? '✅ Enabled' : 
            permissionState === 'denied' ? '🚫 Blocked' : 
            permissionState === 'granted' ? '⚠️ Ready to Enable' : 
            '🔕 Disabled'
          }
        </div>
        <div style={{
          fontSize: '11px',
          color: isSubscribed ? '#166534' : permissionState === 'denied' ? '#991b1b' : '#4338ca',
          marginTop: '2px'
        }}>
          {isSubscribed 
            ? 'You\'ll receive push notifications for new bookings'
            : permissionState === 'denied' 
            ? 'Click the 🔒 icon in address bar → Change notifications to "Allow"'
            : 'Click "Enable" to receive instant booking notifications'
          }
        </div>
      </div>
    </div>
  )
}