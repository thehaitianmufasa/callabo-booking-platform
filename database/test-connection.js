// Test Supabase Connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend
dotenv.config({ path: join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Testing Callabo Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? '✓ Found' : '✗ Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test 1: Check if tables exist
    console.log('\n1. Checking Callabo tables...');
    const { data: tables, error: tableError } = await supabase
      .from('callabo_investors')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log('   ✗ Error accessing tables:', tableError.message);
      console.log('   → Please run the SQL files in /database folder first');
    } else {
      console.log('   ✓ Tables accessible');
    }

    // Test 2: Count existing records
    console.log('\n2. Counting existing records...');
    
    const { count: investorCount } = await supabase
      .from('callabo_investors')
      .select('*', { count: 'exact', head: true });
    
    const { count: bookingCount } = await supabase
      .from('callabo_bookings')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   - Investors: ${investorCount || 0}`);
    console.log(`   - Bookings: ${bookingCount || 0}`);
    
    // Test 3: Create test investor
    console.log('\n3. Testing data insertion...');
    const testData = {
      clerk_user_id: `test_${Date.now()}`,
      name: 'Test Investor',
      email: `test${Date.now()}@callabo.com`
    };
    
    const { data: newInvestor, error: insertError } = await supabase
      .from('callabo_investors')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.log('   ✗ Insert failed:', insertError.message);
    } else {
      console.log('   ✓ Test investor created:', newInvestor.id);
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('callabo_investors')
        .delete()
        .eq('id', newInvestor.id);
      
      if (!deleteError) {
        console.log('   ✓ Test data cleaned up');
      }
    }
    
    console.log('\n✅ Database connection test complete!');
    console.log('\nNext steps:');
    console.log('1. If tables don\'t exist, run SQL files in Supabase SQL Editor');
    console.log('2. Start the backend: npm run dev:backend');
    console.log('3. Test API endpoints with curl or Postman');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify Supabase project is active');
    console.log('3. Confirm environment variables are correct');
  }
  
  process.exit(0);
}

testConnection();