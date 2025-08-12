import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await request.json()

    // Get user's investor record
    const { data: investor, error: investorError } = await supabase
      .from('callabo_investors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (investorError) {
      console.error('Error finding investor:', investorError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Save push subscription to database
    const { data, error } = await supabase
      .from('callabo_push_subscriptions')
      .upsert({
        investor_id: investor.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Error saving push subscription:', error)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    console.log('✅ Push subscription saved for user:', userId)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}