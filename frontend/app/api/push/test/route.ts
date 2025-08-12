import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import webpush from 'web-push'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:support@callabo.app',
  'BDB0PAVZh55THKruHw_IONnc5bVaX8Aqpvbhb62xBFbukP7xbLnrtLBNBm685d9a0mZ4MAnJf7dIj5UgGecgS10', // Public key
  'VefMOpiUO_XZJin-CH_2RNnBuurDP83ts7X5VSs0rs0' // Private key
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's investor record
    const { data: investor, error: investorError } = await supabase
      .from('callabo_investors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (investorError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('callabo_push_subscriptions')
      .select('*')
      .eq('investor_id', investor.id)

    if (subError || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No push subscriptions found' }, { status: 404 })
    }

    // Send test notification to all subscriptions
    const notificationPayload = {
      title: '🎉 Callabo Test Notification',
      body: 'Push notifications are working! You\'ll receive booking confirmations here.',
      primaryKey: 'test-notification'
    }

    const promises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key
        }
      }

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(notificationPayload))
        console.log('✅ Test notification sent successfully')
        return true
      } catch (error) {
        console.error('❌ Error sending push notification:', error)
        return false
      }
    })

    const results = await Promise.all(promises)
    const successCount = results.filter(r => r).length

    return NextResponse.json({ 
      success: true, 
      sent: successCount, 
      total: subscriptions.length 
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}