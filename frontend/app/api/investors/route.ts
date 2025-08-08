import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/investors - Get all investors
export async function GET(request: NextRequest) {
  try {
    const { data: investors, error } = await supabase
      .from('callabo_investors')
      .select('*')
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

// POST /api/investors - Create a new investor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clerk_user_id, name, email, phone } = body
    
    // Validate required fields
    if (!clerk_user_id || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const { data: investor, error } = await supabase
      .from('callabo_investors')
      .insert({
        clerk_user_id,
        name,
        email,
        phone,
        nights_used: 0,
        quarter_start: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating investor:', error)
      return NextResponse.json({ error: 'Failed to create investor' }, { status: 500 })
    }
    
    return NextResponse.json({ investor }, { status: 201 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}