const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xgfkhrxabdkjkzduvqnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZmtocnhhYmRramt6ZHV2cW51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0OTQyMCwiZXhwIjoyMDY1NTI1NDIwfQ.c7o-x7m4oxiElzdPCxc-Skg90CY6_IX7IeybtIrUw8Y'
);

async function applyMigration() {
  console.log('🔧 Applying migration to add user_id column...');
  
  try {
    // First check current state
    const { data: beforeData, error: beforeError } = await supabase
      .from('callabo_investors')
      .select('*')
      .limit(1);
    
    if (beforeError) {
      console.log('❌ Cannot access table:', beforeError.message);
      return;
    }
    
    console.log('📊 Current columns:', beforeData.length > 0 ? Object.keys(beforeData[0]) : 'Table empty');
    
    // Check if user_id already exists
    if (beforeData.length > 0 && beforeData[0].hasOwnProperty('user_id')) {
      console.log('✅ user_id column already exists - migration not needed');
      return;
    }
    
    // Since we can't use exec_sql, we'll manually apply the key parts
    // First, let's create a temp user and try to insert with user_id to see if column exists
    console.log('🔧 Testing if we can add a user_id field...');
    
    // Try to update an existing record with user_id (this will fail if column doesn't exist)
    const { data: testData, error: testError } = await supabase
      .from('callabo_investors')
      .update({ user_id: null })
      .eq('id', 'test-id-that-wont-exist')
      .select();
    
    if (testError && testError.message.includes('column "user_id" does not exist')) {
      console.log('❌ user_id column does not exist');
      console.log('🏥 MANUAL MIGRATION REQUIRED');
      console.log('\nPlease execute this SQL in the Supabase Dashboard SQL Editor:');
      console.log('🔗 https://supabase.com/dashboard/project/xgfkhrxabdkjkzduvqnu/sql/new');
      console.log('\n--- MIGRATION SQL ---');
      console.log('ALTER TABLE callabo_investors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_callabo_investors_user_id ON callabo_investors(user_id);');
      console.log('--- END MIGRATION SQL ---\n');
      return;
    } else {
      console.log('✅ user_id column appears to exist or other error occurred');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

applyMigration().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('💥 Script failed:', err);
  process.exit(1);
});