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

    // Reset the user's nights used and quarter start
    const { data: updatedInvestor, error: updateError } = await supabase
      .from('callabo_investors')
      .update({
        nights_used: 0,
        quarter_start: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error resetting nights:', updateError)
      return NextResponse.json({ error: 'Failed to reset nights' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Nights reset successfully', 
      investor: updatedInvestor 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}