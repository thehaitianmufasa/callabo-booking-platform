import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  console.log('🔍 Auth test endpoint called');
  console.log('Cookies:', request.headers.get('cookie'));
  
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    console.log('Auth test result:', { 
      userId: user?.id, 
      email: user?.email,
      error: error?.message 
    });
    
    if (error) {
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message,
        cookies: request.headers.get('cookie') 
      }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No user found',
        cookies: request.headers.get('cookie')
      }, { status: 401 })
    }
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone
      },
      cookies: request.headers.get('cookie')
    })
  } catch (error: any) {
    console.error('Auth test error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: error.message 
    }, { status: 500 })
  }
}