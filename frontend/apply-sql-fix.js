const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xgfkhrxabdkjkzduvqnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZmtocnhhYmRramt6ZHV2cW51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0OTQyMCwiZXhwIjoyMDY1NTI1NDIwfQ.c7o-x7m4oxiElzdPCxc-Skg90CY6_IX7IeybtIrUw8Y'
);

// Unfortunately, Supabase JS client doesn't support raw SQL execution directly
// We need to use the Postgres REST API directly

async function executeSQLCommands() {
  const sqlCommands = [
    `DROP POLICY IF EXISTS "Users can create own bookings" ON callabo_bookings`,
    `DROP POLICY IF EXISTS "Users can view all bookings" ON callabo_bookings`,
    `DROP POLICY IF EXISTS "Users can update own bookings" ON callabo_bookings`,
    `CREATE POLICY "Anyone can view bookings" ON callabo_bookings FOR SELECT USING (true)`,
    `CREATE POLICY "Authenticated users can create bookings" ON callabo_bookings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM callabo_investors WHERE callabo_investors.id = callabo_bookings.investor_id) OR investor_id IS NULL)`,
    `CREATE POLICY "Users can update own bookings" ON callabo_bookings FOR UPDATE USING (investor_id IN (SELECT id FROM callabo_investors WHERE user_id = auth.uid()))`,
    `CREATE POLICY "Users can delete own bookings" ON callabo_bookings FOR DELETE USING (investor_id IN (SELECT id FROM callabo_investors WHERE user_id = auth.uid()))`
  ];

  console.log('🔧 Applying booking policy fixes...\n');

  for (const sql of sqlCommands) {
    console.log(`Executing: ${sql.substring(0, 50)}...`);
    
    // Use fetch to call the Postgres HTTP API directly
    const response = await fetch('https://xgfkhrxabdkjkzduvqnu.supabase.co/rest/v1/rpc/exec', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZmtocnhhYmRramt6ZHV2cW51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0OTQyMCwiZXhwIjoyMDY1NTI1NDIwfQ.c7o-x7m4oxiElzdPCxc-Skg90CY6_IX7IeybtIrUw8Y',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZmtocnhhYmRramt6ZHV2cW51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0OTQyMCwiZXhwIjoyMDY1NTI1NDIwfQ.c7o-x7m4oxiElzdPCxc-Skg90CY6_IX7IeybtIrUw8Y',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Failed: ${error}`);
    } else {
      console.log(`✅ Success`);
    }
  }

  console.log('\n✅ Policy fixes attempted. Note: Some operations may not be available via API.');
  console.log('If bookings still fail, the SQL needs to be run manually in the Supabase Dashboard.');
}

executeSQLCommands();