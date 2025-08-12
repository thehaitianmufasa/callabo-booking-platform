import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = await createServerSupabaseClient(); const { data: { user } } = await supabaseClient.auth.getUser(); const userId = user?.id
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone } = body

    // Check if user already exists in investors table
    const { data: existingInvestor, error: checkError } = await supabase
      .from('callabo_investors')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing investor:', checkError)
      return NextResponse.json({ error: 'Failed to check user' }, { status: 500 })
    }

    if (existingInvestor) {
      // User already exists, update their information
      const { data: updatedInvestor, error: updateError } = await supabase
        .from('callabo_investors')
        .update({
          name: name || 'User',
          email: email || '',
          phone: phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating investor:', updateError)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
      }

      return NextResponse.json({ investor: updatedInvestor, created: false })
    } else {
      // Create new investor record
      const { data: newInvestor, error: createError } = await supabase
        .from('callabo_investors')
        .insert({
          user_id: userId,
          name: name || 'User',
          email: email || '',
          phone: phone || null,
          nights_used: 0,
          quarter_start: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating investor:', createError)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      return NextResponse.json({ investor: newInvestor, created: true })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}