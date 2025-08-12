import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = await createServerSupabaseClient(); const { data: { user } } = await supabaseClient.auth.getUser(); const userId = user?.id
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user already has an investor record
    const { data: existing } = await supabase
      .from('callabo_investors')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return NextResponse.json({ 
        message: 'Account already linked',
        investor: existing,
        clerkUserId: userId
      })
    }

    // Get unclaimed investor accounts (ones with test IDs)
    const { data: unclaimed } = await supabase
      .from('callabo_investors')
      .select('*')
      .like('user_id', 'user_test_%')

    return NextResponse.json({ 
      message: 'Account not linked',
      clerkUserId: userId,
      unclaimedAccounts: unclaimed,
      instructions: 'Call POST /api/link-account with investorId to claim an account'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to check account' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = await createServerSupabaseClient(); const { data: { user } } = await supabaseClient.auth.getUser(); const userId = user?.id
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { investorId } = await request.json()

    if (!investorId) {
      return NextResponse.json({ error: 'investorId required' }, { status: 400 })
    }

    // Update the investor record to link it to this Clerk user
    const { data, error } = await supabase
      .from('callabo_investors')
      .update({ user_id: userId })
      .eq('id', investorId)
      .like('user_id', 'user_test_%') // Only allow claiming test accounts
      .select()
      .single()

    if (error) {
      console.error('Error linking account:', error)
      return NextResponse.json({ error: 'Failed to link account' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Invalid or already claimed account' }, { status: 400 })
    }

    // Get all bookings for this investor
    const { data: bookings } = await supabase
      .from('callabo_bookings')
      .select('*')
      .eq('investor_id', investorId)

    return NextResponse.json({ 
      success: true,
      message: 'Account successfully linked!',
      investor: data,
      bookings: bookings || [],
      clerkUserId: userId
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to link account' }, { status: 500 })
  }
}