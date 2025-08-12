-- Migration to switch from Clerk to Supabase Auth
-- Updates the callabo_investors table to use Supabase user IDs

-- First, add the new user_id column if it doesn't exist
ALTER TABLE callabo_investors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create an index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_callabo_investors_user_id ON callabo_investors(user_id);

-- Update RLS policies to use Supabase Auth
DROP POLICY IF EXISTS "Callabo investors can view own profile" ON callabo_investors;
DROP POLICY IF EXISTS "Callabo investors can update own profile" ON callabo_investors;
DROP POLICY IF EXISTS "Callabo admin can manage all investors" ON callabo_investors;

-- Enable RLS
ALTER TABLE callabo_investors ENABLE ROW LEVEL SECURITY;

-- New policies using Supabase Auth
CREATE POLICY "Users can view own investor profile" ON callabo_investors
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update own investor profile" ON callabo_investors
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can insert own investor profile" ON callabo_investors
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Update bookings policies
DROP POLICY IF EXISTS "Callabo all investors can view bookings" ON callabo_bookings;
DROP POLICY IF EXISTS "Callabo investors can create bookings" ON callabo_bookings;
DROP POLICY IF EXISTS "Callabo investors can update own bookings" ON callabo_bookings;

ALTER TABLE callabo_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all bookings" ON callabo_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM callabo_investors 
      WHERE callabo_investors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings" ON callabo_bookings
  FOR INSERT WITH CHECK (
    investor_id IN (
      SELECT id FROM callabo_investors 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own bookings" ON callabo_bookings
  FOR UPDATE USING (
    investor_id IN (
      SELECT id FROM callabo_investors 
      WHERE user_id = auth.uid()
    )
  );

-- Note: Keep clerk_user_id column for now for backward compatibility
-- Can be dropped later after confirming migration is successful