-- Create push_subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS callabo_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES callabo_investors(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(investor_id, endpoint)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_investor_id ON callabo_push_subscriptions(investor_id);

-- Enable RLS (Row Level Security)
ALTER TABLE callabo_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage their own push subscriptions
CREATE POLICY "Users can manage their own push subscriptions" ON callabo_push_subscriptions
  FOR ALL USING (
    investor_id IN (
      SELECT id FROM callabo_investors 
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );