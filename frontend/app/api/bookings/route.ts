import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/bookings - Get all bookings with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    
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
    
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { investor_id, start_date, end_date, guest_name, guest_contact, booking_type, notes, start_time, end_time } = body
    
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
    const bookingData = {
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
    
    // Note: No night tracking needed - investors can book multiple times, 
    // just limited to 3 nights maximum per individual booking
    
    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}