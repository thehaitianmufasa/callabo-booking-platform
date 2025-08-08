import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string; month: string } }
) {
  try {
    const { year, month } = params
    
    // Calculate month boundaries
    const startDate = `${year}-${month.padStart(2, '0')}-01`
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
    
    // Get all bookings for the month
    const { data: bookings, error: bookingsError } = await supabase
      .from('callabo_bookings')
      .select(`
        id,
        start_date,
        end_date,
        guest_name,
        booking_type,
        status,
        callabo_investors (
          name,
          email
        )
      `)
      .neq('status', 'cancelled')
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)
      .order('start_date')
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }
    
    // Get investors data
    const { data: investors, error: investorsError } = await supabase
      .from('callabo_investors')
      .select('id, name, nights_used')
      .order('name')
    
    if (investorsError) {
      console.error('Error fetching investors:', investorsError)
      return NextResponse.json({ error: 'Failed to fetch investors' }, { status: 500 })
    }
    
    // Get any availability overrides
    const { data: overrides, error: overridesError } = await supabase
      .from('callabo_space_availability')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
    
    if (overridesError) {
      console.error('Error fetching availability overrides:', overridesError)
    }
    
    return NextResponse.json({
      bookings: bookings || [],
      investors: investors || [],
      overrides: overrides || []
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}