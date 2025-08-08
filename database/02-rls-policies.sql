-- CALLABO ROW LEVEL SECURITY (RLS) POLICIES
-- Secure access control for all tables

-- Enable RLS on all Callabo tables
ALTER TABLE callabo_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_space_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Callabo investors can view own profile" ON callabo_investors;
DROP POLICY IF EXISTS "Callabo investors can update own profile" ON callabo_investors;
DROP POLICY IF EXISTS "Callabo admin can manage all investors" ON callabo_investors;
DROP POLICY IF EXISTS "Callabo all investors can view bookings" ON callabo_bookings;
DROP POLICY IF EXISTS "Callabo investors can create bookings" ON callabo_bookings;
DROP POLICY IF EXISTS "Callabo investors can update own bookings" ON callabo_bookings;
DROP POLICY IF EXISTS "Callabo all can view availability" ON callabo_space_availability;
DROP POLICY IF EXISTS "Callabo investors view own notifications" ON callabo_notifications;
DROP POLICY IF EXISTS "Callabo investors update own notifications" ON callabo_notifications;
DROP POLICY IF EXISTS "Callabo all investors can view analytics" ON callabo_analytics;

-- Investors policies
CREATE POLICY "Callabo investors can view own profile" ON callabo_investors
  FOR SELECT USING (
    clerk_user_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Callabo investors can update own profile" ON callabo_investors
  FOR UPDATE USING (
    clerk_user_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Callabo admin can manage all investors" ON callabo_investors
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Bookings policies (all investors can view all bookings for transparency)
CREATE POLICY "Callabo all investors can view bookings" ON callabo_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM callabo_investors 
      WHERE callabo_investors.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Callabo investors can create bookings" ON callabo_bookings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM callabo_investors 
      WHERE callabo_investors.id = investor_id 
      AND callabo_investors.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Callabo investors can update own bookings" ON callabo_bookings
  FOR UPDATE USING (
    investor_id IN (
      SELECT id FROM callabo_investors 
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Space availability policies (all can view, only admin can modify)
CREATE POLICY "Callabo all can view availability" ON callabo_space_availability
  FOR SELECT USING (true);

CREATE POLICY "Callabo admin can manage availability" ON callabo_space_availability
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Notifications policies
CREATE POLICY "Callabo investors view own notifications" ON callabo_notifications
  FOR SELECT USING (
    investor_id IN (
      SELECT id FROM callabo_investors 
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Callabo investors update own notifications" ON callabo_notifications
  FOR UPDATE USING (
    investor_id IN (
      SELECT id FROM callabo_investors 
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Analytics policies (all investors can view)
CREATE POLICY "Callabo all investors can view analytics" ON callabo_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM callabo_investors 
      WHERE callabo_investors.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Callabo admin can manage analytics" ON callabo_analytics
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );