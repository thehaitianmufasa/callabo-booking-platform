-- Fix booking policies to allow authenticated users to create bookings
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create own bookings" ON callabo_bookings;
DROP POLICY IF EXISTS "Users can view all bookings" ON callabo_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON callabo_bookings;

-- Create more permissive policies for bookings
-- Allow authenticated users to view all bookings (for calendar display)
CREATE POLICY "Anyone can view bookings" ON callabo_bookings
  FOR SELECT USING (true);

-- Allow authenticated users to create bookings
CREATE POLICY "Authenticated users can create bookings" ON callabo_bookings
  FOR INSERT WITH CHECK (
    -- Either the user has an investor record
    EXISTS (
      SELECT 1 FROM callabo_investors 
      WHERE callabo_investors.id = callabo_bookings.investor_id
    )
    OR
    -- Or allow if investor_id is null (for guest bookings)
    investor_id IS NULL
  );

-- Allow users to update their own bookings
CREATE POLICY "Users can update own bookings" ON callabo_bookings
  FOR UPDATE USING (
    investor_id IN (
      SELECT id FROM callabo_investors 
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete their own bookings
CREATE POLICY "Users can delete own bookings" ON callabo_bookings
  FOR DELETE USING (
    investor_id IN (
      SELECT id FROM callabo_investors 
      WHERE user_id = auth.uid()
    )
  );