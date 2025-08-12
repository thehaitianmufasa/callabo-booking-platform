import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { data: investors, error } = await supabase
      .from('callabo_investors')
      .select('id, name, email, clerk_user_id')
      .order('name')
    
    if (error) {
      console.error('Error fetching investors:', error)
      return NextResponse.json({ error: 'Failed to fetch investors' }, { status: 500 })
    }
    
    return NextResponse.json({ investors: investors || [] })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}