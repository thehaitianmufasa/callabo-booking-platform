const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './frontend/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const currentUserId = 'user_30zDHHwL4VIWZVKu78u1SxA4ehp'

async function addTestBookings() {
  try {
    console.log('🔍 Looking for investor record...')
    
    // First, get the investor ID for the current user
    const { data: investor, error: investorError } = await supabase
      .from('callabo_investors')
      .select('id, name')
      .eq('clerk_user_id', currentUserId)
      .single()

    if (investorError || !investor) {
      console.error('❌ No investor record found for user:', currentUserId)
      console.log('💡 The user needs to log in first to create their investor record')
      return
    }

    console.log('✅ Found investor:', investor.name, 'ID:', investor.id)

    // First, check for any existing bookings for this user
    const { data: existingBookings, error: existingError } = await supabase
      .from('callabo_bookings')
      .select('id, start_date, end_date, booking_type, guest_name')
      .eq('investor_id', investor.id)

    if (existingBookings && existingBookings.length > 0) {
      console.log('🗑️  Found', existingBookings.length, 'existing bookings. Cleaning up...')
      const { error: deleteError } = await supabase
        .from('callabo_bookings')
        .delete()
        .eq('investor_id', investor.id)
      
      if (deleteError) {
        console.error('❌ Error deleting existing bookings:', deleteError)
      } else {
        console.log('✅ Cleaned up existing bookings')
      }
    }

    // Create test bookings for the current month with different types
    // Use dates that are spaced apart to avoid overlap constraint
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    const testBookings = [
      // Personal use (investor) - Blue (Aug 12-13)
      {
        investor_id: investor.id,
        start_date: new Date(currentYear, currentMonth, 12).toISOString().split('T')[0],
        end_date: new Date(currentYear, currentMonth, 13).toISOString().split('T')[0],
        guest_name: investor.name,
        guest_contact: 'personal@example.com',
        booking_type: 'investor',
        amount: 0,
        status: 'confirmed',
        notes: 'Personal use - weekend getaway'
      },
      // Friends & Family - Yellow (Aug 16 single day)
      {
        investor_id: investor.id,
        start_date: new Date(currentYear, currentMonth, 16).toISOString().split('T')[0],
        end_date: new Date(currentYear, currentMonth, 16).toISOString().split('T')[0],
        guest_name: 'Sarah Martinez',
        guest_contact: 'sarah.martinez@example.com',
        booking_type: 'friend',
        amount: 50,
        status: 'confirmed',
        notes: 'Sister visiting for the day'
      },
      // Paying Client - Red (Aug 30-31)
      {
        investor_id: investor.id,
        start_date: new Date(currentYear, currentMonth, 30).toISOString().split('T')[0],
        end_date: new Date(currentYear, currentMonth, 31).toISOString().split('T')[0],
        guest_name: 'Creative Workshop LLC',
        guest_contact: 'booking@creativeworkshop.com',
        booking_type: 'guest',
        amount: 200,
        status: 'confirmed',
        notes: 'Photography workshop rental'
      }
    ]

    console.log('📝 Adding test bookings...')

    // Insert the test bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('callabo_bookings')
      .insert(testBookings)
      .select()

    if (bookingError) {
      console.error('❌ Error creating bookings:', bookingError)
      return
    }

    console.log('✅ Successfully added', bookings.length, 'test bookings:')
    bookings.forEach(booking => {
      const typeLabel = {
        'investor': '🔵 Personal Use',
        'friend': '🟡 Friends & Family',
        'guest': '🔴 Paying Client'
      }[booking.booking_type]
      
      console.log(`  ${typeLabel}: ${booking.start_date} - ${booking.guest_name} ($${booking.amount})`)
    })

    console.log('\n🎉 Test bookings added! The calendar should now show colors:')
    console.log('  🔵 Blue: Personal use (investor bookings)')
    console.log('  🟡 Yellow: Friends & Family')
    console.log('  🔴 Red: Paying Clients')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addTestBookings()