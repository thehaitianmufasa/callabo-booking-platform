const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xgfkhrxabdkjkzduvqnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZmtocnhhYmRramt6ZHV2cW51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk0OTQyMCwiZXhwIjoyMDY1NTI1NDIwfQ.c7o-x7m4oxiElzdPCxc-Skg90CY6_IX7IeybtIrUw8Y'
);

async function fixUserLinks() {
  console.log('🔧 Fixing user links in database...\n');
  
  try {
    // First, get all investor records
    const { data: investors, error: fetchError } = await supabase
      .from('callabo_investors')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching investors:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${investors.length} investor records\n`);
    
    // For each investor, try to link them to auth.users based on email
    for (const investor of investors) {
      console.log(`Processing: ${investor.name} (${investor.email})`);
      
      // Get the auth user by email
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('❌ Error listing users:', userError);
        continue;
      }
      
      // Find matching user by email or phone
      const matchingUser = users.find(u => 
        u.email === investor.email || 
        u.phone === investor.phone
      );
      
      if (matchingUser) {
        // Update the investor record with the user_id
        const { error: updateError } = await supabase
          .from('callabo_investors')
          .update({ user_id: matchingUser.id })
          .eq('id', investor.id);
        
        if (updateError) {
          console.error(`❌ Error updating ${investor.email}:`, updateError);
        } else {
          console.log(`✅ Linked ${investor.email} to user ${matchingUser.id}`);
        }
      } else {
        console.log(`⚠️  No auth user found for ${investor.email}`);
      }
    }
    
    console.log('\n✨ User linking complete!');
    
    // Verify the updates
    const { data: updatedInvestors, error: verifyError } = await supabase
      .from('callabo_investors')
      .select('name, email, user_id');
    
    console.log('\n📋 Final status:');
    updatedInvestors.forEach(inv => {
      console.log(`- ${inv.name}: ${inv.user_id ? '✅ Linked' : '❌ Not linked'}`);
    });
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

fixUserLinks();