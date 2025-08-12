import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG: Starting Supabase connection test')
  
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing',
      resendKey: process.env.RESEND_API_KEY ? '✅ Present' : '❌ Missing',
      clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Present' : '❌ Missing',
      clerkSecretKey: process.env.CLERK_SECRET_KEY ? '✅ Present' : '❌ Missing',
    },
    tests: {},
    errors: []
  }

  // Test 1: Clerk Authentication
  try {
    const supabaseClient = await createServerSupabaseClient(); const { data: { user } } = await supabaseClient.auth.getUser(); const userId = user?.id
    debugInfo.tests.clerkAuth = {
      status: '✅ Success',
      userId: userId || 'No user authenticated',
      authenticated: !!userId
    }
  } catch (error: any) {
    debugInfo.tests.clerkAuth = {
      status: '❌ Failed',
      error: error.message
    }
    debugInfo.errors.push(`Clerk auth error: ${error.message}`)
  }

  // Test 2: Supabase Connection with Service Role
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      )
      
      // Test basic connection
      const { error: pingError } = await supabase
        .from('callabo_investors')
        .select('count')
        .limit(1)
      
      if (pingError) {
        debugInfo.tests.supabaseConnection = {
          status: '❌ Failed',
          error: pingError.message,
          code: pingError.code,
          details: pingError.details,
          hint: pingError.hint
        }
        debugInfo.errors.push(`Supabase connection error: ${pingError.message}`)
      } else {
        debugInfo.tests.supabaseConnection = {
          status: '✅ Success',
          message: 'Connected to Supabase'
        }
        
        // Test 3: Count existing investors
        const { count, error: countError } = await supabase
          .from('callabo_investors')
          .select('*', { count: 'exact', head: true })
        
        if (countError) {
          debugInfo.tests.investorCount = {
            status: '❌ Failed',
            error: countError.message
          }
        } else {
          debugInfo.tests.investorCount = {
            status: '✅ Success',
            count: count || 0
          }
        }
        
        // Test 4: List all investors (for debugging)
        const { data: investors, error: listError } = await supabase
          .from('callabo_investors')
          .select('id, clerk_user_id, name, email, nights_used')
        
        if (listError) {
          debugInfo.tests.investorList = {
            status: '❌ Failed',
            error: listError.message
          }
        } else {
          debugInfo.tests.investorList = {
            status: '✅ Success',
            count: investors?.length || 0,
            investors: investors?.map(inv => ({
              ...inv,
              clerk_user_id: inv.clerk_user_id ? 
                (inv.clerk_user_id.startsWith('user_test') ? inv.clerk_user_id : 'user_***') 
                : null
            }))
          }
        }
        
        // Test 5: Try to insert a test record (then delete it)
        if (debugInfo.tests.clerkAuth.authenticated) {
          const testUserId = debugInfo.tests.clerkAuth.userId
          const testRecord = {
            clerk_user_id: `test_${Date.now()}`,
            name: 'Debug Test User',
            email: 'debug@test.com',
            phone: null,
            nights_used: 0,
            quarter_start: new Date().toISOString().split('T')[0]
          }
          
          const { data: insertData, error: insertError } = await supabase
            .from('callabo_investors')
            .insert(testRecord)
            .select()
            .single()
          
          if (insertError) {
            debugInfo.tests.insertTest = {
              status: '❌ Failed',
              error: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint
            }
            debugInfo.errors.push(`Insert test failed: ${insertError.message}`)
          } else {
            // Delete the test record immediately
            const { error: deleteError } = await supabase
              .from('callabo_investors')
              .delete()
              .eq('id', insertData.id)
            
            debugInfo.tests.insertTest = {
              status: '✅ Success',
              message: 'Insert and delete test passed',
              deletedId: insertData.id
            }
          }
        }
      }
    } catch (error: any) {
      debugInfo.tests.supabaseConnection = {
        status: '❌ Exception',
        error: error.message,
        stack: error.stack
      }
      debugInfo.errors.push(`Supabase exception: ${error.message}`)
    }
  } else {
    debugInfo.tests.supabaseConnection = {
      status: '❌ Missing Credentials',
      message: 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set'
    }
    debugInfo.errors.push('Missing Supabase credentials')
  }

  // Test 6: Check RLS status
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      
      // Query to check RLS status - this is a PostgreSQL system query
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('exec', {
          sql: `
            SELECT tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename LIKE 'callabo_%'
          `
        })
        .single()
      
      if (!rlsError && rlsStatus) {
        debugInfo.tests.rlsStatus = {
          status: '✅ Checked',
          tables: rlsStatus
        }
      } else {
        // RLS check might fail, that's okay - it's just for info
        debugInfo.tests.rlsStatus = {
          status: '⚠️ Could not check RLS',
          note: 'This is normal if exec function is not available'
        }
      }
    } catch (error: any) {
      debugInfo.tests.rlsStatus = {
        status: '⚠️ Could not check RLS',
        error: error.message
      }
    }
  }

  // Summary
  debugInfo.summary = {
    totalErrors: debugInfo.errors.length,
    status: debugInfo.errors.length === 0 ? '✅ All tests passed' : '❌ Some tests failed',
    recommendation: debugInfo.errors.length > 0 ? 
      'Check the errors array for details. Most likely the Supabase environment variables are not set correctly on Vercel.' :
      'Everything looks good! The connection to Supabase is working.'
  }

  return NextResponse.json(debugInfo, { 
    status: debugInfo.errors.length > 0 ? 500 : 200,
    headers: {
      'Content-Type': 'application/json',
    }
  })
}