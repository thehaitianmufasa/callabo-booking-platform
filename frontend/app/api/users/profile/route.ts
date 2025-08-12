import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile from database
    const { data: investor, error } = await supabase
      .from('callabo_investors')
      .select('id, name, email, phone, created_at, updated_at')
      .eq('clerk_user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching investor profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (!investor) {
      // User doesn't exist in database yet
      return NextResponse.json({ investor: null }, { status: 200 })
    }

    return NextResponse.json({ investor })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}