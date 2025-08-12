import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test API - Environment variables check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Present' : 'Missing')
    
    // Test Clerk auth
    const supabaseClient = await createServerSupabaseClient(); const { data: { user } } = await supabaseClient.auth.getUser(); const userId = user?.id
    console.log('🔍 Clerk user ID:', userId)
    
    // Test Supabase connection
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      
      const { data, error } = await supabase
        .from('callabo_investors')
        .select('count')
        .limit(1)
      
      console.log('🔍 Supabase connection test:', error ? 'Failed' : 'Success')
      if (error) console.log('Supabase error:', error)
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing',
        resendKey: process.env.RESEND_API_KEY ? 'Present' : 'Missing',
        clerkUserId: userId || 'No user authenticated'
      }
    })
  } catch (error) {
    console.error('❌ Test API error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}