-- CALLABO DATABASE SCHEMA
-- Separate tables for Callabo booking platform
-- Database: Supabase PostgreSQL

-- Enable UUID extension (Supabase uses gen_random_uuid by default)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS callabo_notifications CASCADE;
DROP TABLE IF EXISTS callabo_analytics CASCADE;
DROP TABLE IF EXISTS callabo_bookings CASCADE;
DROP TABLE IF EXISTS callabo_space_availability CASCADE;
DROP TABLE IF EXISTS callabo_investors CASCADE;

-- Callabo Investors table
CREATE TABLE callabo_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  nights_used INTEGER DEFAULT 0,
  quarter_start DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Callabo Bookings table
CREATE TABLE callabo_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES callabo_investors(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_contact TEXT NOT NULL,
  booking_type TEXT CHECK (booking_type IN ('investor', 'guest')) NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT callabo_no_overlap EXCLUDE USING gist (daterange(start_date, end_date, '[]') WITH &&)
);

-- Callabo Space availability table
CREATE TABLE callabo_space_availability (
  date DATE PRIMARY KEY,
  is_available BOOLEAN DEFAULT true,
  blocked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Callabo Notifications table
CREATE TABLE callabo_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES callabo_investors(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('booking_created', 'booking_cancelled', 'reminder', 'quarter_reset')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Callabo Analytics table
CREATE TABLE callabo_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL UNIQUE,
  occupancy_rate DECIMAL(5, 2),
  revenue DECIMAL(10, 2),
  guest_nights INTEGER DEFAULT 0,
  investor_nights INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_callabo_bookings_dates ON callabo_bookings(start_date, end_date);
CREATE INDEX idx_callabo_bookings_investor ON callabo_bookings(investor_id);
CREATE INDEX idx_callabo_bookings_status ON callabo_bookings(status);
CREATE INDEX idx_callabo_notifications_investor ON callabo_notifications(investor_id);
CREATE INDEX idx_callabo_notifications_read ON callabo_notifications(read);
CREATE INDEX idx_callabo_analytics_month ON callabo_analytics(month);
CREATE INDEX idx_callabo_investors_clerk ON callabo_investors(clerk_user_id);

-- Add comments for documentation
COMMENT ON TABLE callabo_investors IS 'Stores investor information for the Callabo booking platform';
COMMENT ON TABLE callabo_bookings IS 'Stores all booking records with no-overlap constraint';
COMMENT ON TABLE callabo_space_availability IS 'Tracks daily availability of the creative space';
COMMENT ON TABLE callabo_notifications IS 'Stores user notifications for booking events';
COMMENT ON TABLE callabo_analytics IS 'Monthly analytics and metrics for the platform';

COMMENT ON COLUMN callabo_investors.nights_used IS 'Number of nights used in current quarter (max 3)';
COMMENT ON COLUMN callabo_investors.quarter_start IS 'Start date of current quarter for night tracking';
COMMENT ON COLUMN callabo_bookings.booking_type IS 'Type of booking: investor (free, limited) or guest (paid)';
COMMENT ON CONSTRAINT callabo_no_overlap ON callabo_bookings IS 'Prevents overlapping bookings';