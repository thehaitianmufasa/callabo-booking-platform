-- Create messages table for platform communication
-- Migration: Add messaging system with SMS support

CREATE TABLE callabo_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES callabo_investors(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES callabo_investors(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_sms BOOLEAN DEFAULT false,
  sms_id TEXT, -- Twilio message ID
  status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'sms_failed')) DEFAULT 'sent',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_callabo_messages_sender ON callabo_messages(sender_id);
CREATE INDEX idx_callabo_messages_recipient ON callabo_messages(recipient_id);
CREATE INDEX idx_callabo_messages_created ON callabo_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE callabo_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see messages they sent or received
CREATE POLICY "Users can view their own messages" ON callabo_messages
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT clerk_user_id FROM callabo_investors 
      WHERE id IN (sender_id, recipient_id)
    )
  );

CREATE POLICY "Users can send messages" ON callabo_messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = (
      SELECT clerk_user_id FROM callabo_investors 
      WHERE id = sender_id
    )
  );

CREATE POLICY "Users can update their own messages" ON callabo_messages
  FOR UPDATE USING (
    auth.uid()::text IN (
      SELECT clerk_user_id FROM callabo_investors 
      WHERE id IN (sender_id, recipient_id)
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_callabo_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_callabo_messages_timestamp
  BEFORE UPDATE ON callabo_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_callabo_messages_updated_at();