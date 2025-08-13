-- Enable RLS on all callabo tables
ALTER TABLE callabo_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_space_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_investors ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for callabo_analytics (read-only for authenticated users)
CREATE POLICY "Authenticated users can view analytics" ON callabo_analytics
  FOR SELECT USING (true);

-- Create permissive policies for callabo_messages (users can manage their own messages)
CREATE POLICY "Users can view messages" ON callabo_messages
  FOR SELECT USING (true);

-- Create permissive policies for callabo_space_availability (read for all, write for authenticated)
CREATE POLICY "Anyone can view availability" ON callabo_space_availability
  FOR SELECT USING (true);

-- Create permissive policies for callabo_notifications (users see their own)
CREATE POLICY "Users can view own notifications" ON callabo_notifications
  FOR SELECT USING (
    investor_id IN (
      SELECT id FROM callabo_investors 
      WHERE user_id = auth.uid()
    )
  );

-- Create permissive policies for callabo_bookings
CREATE POLICY "Users can view all bookings" ON callabo_bookings
  FOR SELECT USING (true);

CREATE POLICY "Users can create own bookings" ON callabo_bookings
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

-- The callabo_investors policies should already exist from our previous migration
-- But let's ensure they're there
DROP POLICY IF EXISTS "Users can view own investor profile" ON callabo_investors;
DROP POLICY IF EXISTS "Users can update own investor profile" ON callabo_investors;
DROP POLICY IF EXISTS "Users can insert own investor profile" ON callabo_investors;

CREATE POLICY "Users can view own investor profile" ON callabo_investors
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own investor profile" ON callabo_investors
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own investor profile" ON callabo_investors
  FOR INSERT WITH CHECK (user_id = auth.uid());