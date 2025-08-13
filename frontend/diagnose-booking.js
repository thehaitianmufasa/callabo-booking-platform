const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xgfkhrxabdkjkzduvqnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZmtocnhhYmRramt6ZHV2cW51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0OTQyMCwiZXhwIjoyMDY1NTI1NDIwfQ.c7o-x7m4oxiElzdPCxc-Skg90CY6_IX7IeybtIrUw8Y'
);

async function diagnoseBookingIssue() {
  console.log('🔍 DIAGNOSING BOOKING CREATION ISSUE\n');
  console.log('=' .repeat(50));
  
  // Step 1: Check if the authenticated user exists
  console.log('\n1️⃣ CHECKING AUTH USERS:');
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('❌ Error fetching users:', userError);
    return;
  }
  
  const jeffUser = users.find(u => u.email === 'thejeffchery@gmail.com');
  if (jeffUser) {
    console.log('✅ Found auth user:', {
      id: jeffUser.id,
      email: jeffUser.email,
      phone: jeffUser.phone,
      created_at: jeffUser.created_at
    });
  } else {
    console.log('❌ User not found in auth.users');
  }
  
  // Step 2: Check investor record
  console.log('\n2️⃣ CHECKING INVESTOR RECORD:');
  const { data: investors, error: invError } = await supabase
    .from('callabo_investors')
    .select('*')
    .eq('email', 'thejeffchery@gmail.com');
  
  if (invError) {
    console.error('❌ Error fetching investor:', invError);
  } else if (investors && investors.length > 0) {
    console.log('✅ Found investor record:', {
      id: investors[0].id,
      name: investors[0].name,
      email: investors[0].email,
      user_id: investors[0].user_id,
      clerk_user_id: investors[0].clerk_user_id
    });
    
    // Check if user_id matches auth user
    if (jeffUser && investors[0].user_id === jeffUser.id) {
      console.log('✅ user_id correctly linked to auth user');
    } else {
      console.log('❌ user_id mismatch or missing');
    }
  } else {
    console.log('❌ No investor record found');
  }
  
  // Step 3: Check RLS policies on callabo_bookings
  console.log('\n3️⃣ CHECKING RLS STATUS:');
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .like('table_name', 'callabo_%');
  
  console.log('Tables with callabo_ prefix:', tables?.map(t => t.table_name).join(', '));
  
  // Step 4: Test booking creation directly
  console.log('\n4️⃣ TESTING DIRECT BOOKING CREATION:');
  
  if (jeffUser && investors && investors[0]) {
    const testBooking = {
      investor_id: investors[0].id,
      start_date: '2025-08-20',
      end_date: '2025-08-20',
      guest_name: 'Test Guest',
      guest_contact: 'test@example.com',
      booking_type: 'investor',
      amount: 0,
      status: 'confirmed',
      notes: 'Diagnostic test booking',
      start_time: '14:00',
      end_time: '18:00'
    };
    
    console.log('Attempting to create booking with:', testBooking);
    
    const { data: booking, error: bookingError } = await supabase
      .from('callabo_bookings')
      .insert(testBooking)
      .select()
      .single();
    
    if (bookingError) {
      console.error('❌ Booking creation failed:', bookingError);
    } else {
      console.log('✅ Booking created successfully:', booking);
      
      // Clean up test booking
      const { error: deleteError } = await supabase
        .from('callabo_bookings')
        .delete()
        .eq('id', booking.id);
      
      if (deleteError) {
        console.log('⚠️ Could not delete test booking:', deleteError);
      } else {
        console.log('🧹 Test booking cleaned up');
      }
    }
  }
  
  // Step 5: Check API route authentication
  console.log('\n5️⃣ TESTING API ROUTE:');
  console.log('Testing http://localhost:3000/api/bookings with curl...');
  
  const { exec } = require('child_process');
  exec('curl -X GET http://localhost:3000/api/bookings -I', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ API test error:', error);
      return;
    }
    console.log('API Response Headers:\n', stdout);
  });
  
  // Step 6: Check middleware
  console.log('\n6️⃣ CHECKING MIDDLEWARE:');
  const fs = require('fs');
  const middlewarePath = '/Users/mufasa/callabo-booking-platform/frontend/middleware.ts';
  if (fs.existsSync(middlewarePath)) {
    console.log('✅ Middleware file exists');
    const content = fs.readFileSync(middlewarePath, 'utf8');
    console.log('Middleware uses:', content.includes('@supabase/ssr') ? '@supabase/ssr' : 'unknown');
  } else {
    console.log('❌ No middleware file found');
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📋 DIAGNOSIS SUMMARY:');
  console.log('- Auth user exists:', !!jeffUser);
  console.log('- Investor record exists:', !!(investors && investors[0]));
  console.log('- user_id linked:', !!(jeffUser && investors && investors[0] && investors[0].user_id === jeffUser.id));
  console.log('- Direct booking works:', 'See results above');
  console.log('=' .repeat(50));
}

diagnoseBookingIssue();