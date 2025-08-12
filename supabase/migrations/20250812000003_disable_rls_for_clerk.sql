-- Temporarily disable RLS for Clerk integration
-- Since we're using Clerk for auth, not Supabase Auth, the RLS policies won't work
-- We're using service role key which bypasses RLS anyway

ALTER TABLE callabo_investors DISABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_space_availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE callabo_messages DISABLE ROW LEVEL SECURITY;

-- Note: Security is still maintained through:
-- 1. Clerk authentication in the API routes
-- 2. Service role key is only on server-side
-- 3. API routes validate user access before queries