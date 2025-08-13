import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function sendBookingNotification(booking: any, bookingData: any) {
  try {
    // Get the user's email from the investor record
    const { data: investor, error: investorError } = await supabase
      .from('callabo_investors')
      .select('email, name')
      .eq('id', booking.investor_id)
      .single()

    if (investorError || !investor) {
      console.error('❌ Could not get investor email for notification:', investorError)
      return false
    }

    // Simple email notification using fetch to avoid import issues
    try {
      if (process.env.RESEND_API_KEY) {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Callabo Creative Space <onboarding@resend.dev>',
            to: [investor.email],
            subject: `🎉 Booking Confirmed - ${bookingData.start_date}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #667eea;">🎉 Booking Confirmed!</h1>
                <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Guest:</strong> ${bookingData.guest_name}</p>
                  <p><strong>Dates:</strong> ${bookingData.start_date} to ${bookingData.end_date}</p>
                  <p><strong>Type:</strong> ${bookingData.booking_type}</p>
                  <p><strong>Amount:</strong> $${bookingData.amount}</p>
                  <p><strong>Contact:</strong> ${bookingData.guest_contact}</p>
                  ${bookingData.notes ? `<p><strong>Notes:</strong> ${bookingData.notes}</p>` : ''}
                </div>
                <p>📍 Callabo Creative Space, Hapeville, GA</p>
              </div>
            `,
          }),
        })

        if (resendResponse.ok) {
          console.log('📧 Email sent successfully via Resend API')
          return true
        } else {
          const errorData = await resendResponse.json()
          console.error('❌ Resend API error:', errorData)
        }
      }
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError)
    }

    // Fallback: Console log notification
    console.log('📧 EMAIL NOTIFICATION (FALLBACK):', {
      to: investor.email,
      subject: `🎉 Booking Confirmed - ${bookingData.start_date}`,
      guestName: bookingData.guest_name,
      bookingType: bookingData.booking_type,
      amount: bookingData.amount
    })

    return true

  } catch (error) {
    console.error('❌ Notification error:', error)
    return false
  }
}


// GET /api/bookings - Get all bookings with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const userId = searchParams.get('userId')
    
    let query = supabase
      .from('callabo_bookings')
      .select(`
        *,
        callabo_investors (
          name,
          email
        )
      `)
      .eq('status', 'confirmed')
    
    // Filter by user ID if provided (for user-specific bookings)
    if (userId) {
      // First get the investor record for this Supabase user
      const { data: investor, error: investorError } = await supabase
        .from('callabo_investors')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (investorError) {
        console.error('Error finding investor:', investorError)
        return NextResponse.json({ bookings: [] })
      }

      if (investor) {
        console.log('🔍 Found investor for user', userId, '- investor ID:', investor.id)
        query = query.eq('investor_id', investor.id)
      } else {
        console.log('❌ No investor found for user:', userId)
        // User doesn't exist in investors table yet, return empty bookings
        return NextResponse.json({ bookings: [] })
      }
    }
    
    // Filter by year/month if provided
    if (year && month) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
      query = query.gte('start_date', startDate).lte('start_date', endDate)
    }
    
    const { data: bookings, error } = await query
    
    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }
    
    console.log('📊 Query result - found', bookings?.length || 0, 'bookings for user', userId)
    if (bookings && bookings.length > 0) {
      console.log('📅 Bookings data:', bookings.map(b => ({
        id: b.id.slice(0,8),
        start_date: b.start_date,
        end_date: b.end_date,
        booking_type: b.booking_type,
        guest_name: b.guest_name
      })))
    }
    
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    console.log('📝 Booking POST request received');
    console.log('Headers:', request.headers.get('cookie'));
    
    const supabaseClient = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    console.log('Auth result:', { user: user?.id, email: user?.email, error: authError });
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized - No authenticated user found' }, { status: 401 })
    }
    
    const userId = user.id

    const body = await request.json()
    const { start_date, end_date, guest_name, guest_contact, booking_type, notes, start_time, end_time } = body
    
    // Get or create the investor record for the authenticated user
    let investor = null
    
    // First, try to find existing investor
    const { data: existingInvestor, error: findError } = await supabase
      .from('callabo_investors')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (existingInvestor) {
      investor = existingInvestor
    } else {
      // If not found, create a new investor record automatically
      console.log('Creating new investor record for user:', userId)
      
      // Get user details from the booking form (guest_name can be used as fallback)
      const { data: newInvestor, error: createError } = await supabase
        .from('callabo_investors')
        .insert({
          user_id: userId,
          name: guest_name || user.email?.split('@')[0] || 'Investor',
          email: guest_contact || user.email || 'investor@callabo.com',
          phone: user.phone || null,
          nights_used: 0,
          quarter_start: new Date().toISOString().split('T')[0]
        })
        .select('id')
        .single()
      
      if (createError) {
        console.error('Error creating investor:', createError)
        return NextResponse.json({ error: 'Failed to create investor record' }, { status: 500 })
      }
      
      investor = newInvestor
    }

    if (!investor) {
      console.error('Could not get or create investor record')
      return NextResponse.json({ error: 'Failed to process user account' }, { status: 500 })
    }

    const investor_id = investor.id
    
    // Validate required fields
    if (!start_date || !end_date || !guest_name || !guest_contact || !booking_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Validate dates
    const startDateObj = new Date(start_date)
    const endDateObj = new Date(end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (startDateObj < today) {
      return NextResponse.json({ error: 'Cannot book dates in the past' }, { status: 400 })
    }
    
    // Allow same-day bookings if times are specified, otherwise require different dates
    const isSameDay = startDateObj.getTime() === endDateObj.getTime()
    const hasTimeSlots = start_time && end_time
    
    if (!isSameDay && endDateObj < startDateObj) {
      return NextResponse.json({ error: 'Check-out date must be after check-in date' }, { status: 400 })
    }
    
    if (isSameDay && !hasTimeSlots) {
      return NextResponse.json({ error: 'Same-day bookings require start and end times' }, { status: 400 })
    }
    
    // Check for overlapping bookings
    const { data: existingBookings } = await supabase
      .from('callabo_bookings')
      .select('id, start_date, end_date')
      .neq('status', 'cancelled')
      .or(`and(start_date.lt.${end_date},end_date.gt.${start_date})`)
    
    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json({ 
        error: 'Booking dates conflict with existing reservation',
        conflictingDates: existingBookings 
      }, { status: 409 })
    }
    
    // Calculate nights (minimum 1 for same-day bookings)
    const nights = Math.max(1, Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)))
    
    // Check investor booking limits (max 3 nights per stay for personal use only)
    if (booking_type === 'investor') {
      if (nights > 3) {
        return NextResponse.json({ 
          error: `Personal use bookings are limited to 3 nights maximum per stay. You requested ${nights} nights.`
        }, { status: 400 })
      }
    }
    let amount = 0
    
    if (booking_type === 'investor') {
      amount = 0 // Free for investors
    } else if (booking_type === 'friend') {
      amount = nights * 50 // $50/night for friends/family
    } else if (booking_type === 'guest') {
      amount = nights * 100 // $100/night for paying clients (can be adjusted)
    }
    
    // Create the booking
    const bookingData: any = {
      investor_id: investor_id || null,
      start_date,
      end_date,
      guest_name,
      guest_contact,
      booking_type,
      amount,
      status: 'confirmed',
      notes
    }
    
    // Add time fields if provided (for same-day bookings)
    if (start_time) bookingData.start_time = start_time
    if (end_time) bookingData.end_time = end_time
    
    const { data: booking, error } = await supabase
      .from('callabo_bookings')
      .insert(bookingData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating booking:', error)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }
    
    // Send email notification
    try {
      await sendBookingNotification(booking, bookingData)
    } catch (emailError) {
      console.error('Error sending email notification:', emailError)
      // Don't fail the booking if email fails
    }
    
    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}