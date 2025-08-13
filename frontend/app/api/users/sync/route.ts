import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = await createServerSupabaseClient()
    const { data: { user } } = await supabaseClient.auth.getUser()
    const userId = user?.id
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone } = body
    console.log('🔄 Sync API - Received data:', { name, email, phone, userId })

    // Check if user already exists in investors table (by user_id or email)
    let existingInvestor = null
    
    // First check by user_id
    const { data: investorByUserId, error: userIdError } = await supabase
      .from('callabo_investors')
      .select('id')
      .eq('user_id', userId)
      .single()
      
    if (investorByUserId) {
      existingInvestor = investorByUserId
    } else {
      // Check by email (for cases where user_id was cleared)
      const { data: investorByEmail, error: emailError } = await supabase
        .from('callabo_investors')
        .select('id')
        .eq('email', email)
        .single()
        
      if (investorByEmail) {
        console.log('🔄 Found existing investor by email, updating user_id')
        existingInvestor = investorByEmail
      }
    }

    if (existingInvestor) {
      // User already exists, update their information
      const updateData: any = {
        user_id: userId, // Always update user_id to current auth user
        name: name || 'User',
        email: email || '',
        updated_at: new Date().toISOString()
      }
      
      // Only update phone if it's provided and not empty
      if (phone && phone.trim()) {
        updateData.phone = phone
      }
      
      const { data: updatedInvestor, error: updateError } = await supabase
        .from('callabo_investors')
        .update(updateData)
        .eq('id', existingInvestor.id)
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