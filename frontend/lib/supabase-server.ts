import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

export async function getServerUser() {
  const supabase = await createServerSupabaseClient()
  
  // Get the session from the cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-access-token')?.value
  
  if (!token) {
    return null
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}