-- Add start_time and end_time columns to support same-day bookings
-- Migration: Add time fields for same-day booking slots

ALTER TABLE callabo_bookings 
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME;

-- Add comment to explain usage
COMMENT ON COLUMN callabo_bookings.start_time IS 'Start time for same-day bookings (optional)';
COMMENT ON COLUMN callabo_bookings.end_time IS 'End time for same-day bookings (optional)';