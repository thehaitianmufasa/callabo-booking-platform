-- Update booking types to match the application logic
-- Current API uses: 'investor', 'friend', 'guest'
-- Database constraint was: 'investor', 'guest'

-- Update the booking type constraint to include all three types
ALTER TABLE callabo_bookings 
DROP CONSTRAINT IF EXISTS callabo_bookings_booking_type_check;

ALTER TABLE callabo_bookings 
ADD CONSTRAINT callabo_bookings_booking_type_check 
CHECK (booking_type IN ('investor', 'friend', 'guest'));

-- Update existing 'investor' bookings to match the new Personal Use terminology
-- Note: We'll keep 'investor' in DB but display as "Personal Use" in UI

-- Update the comments to reflect correct business logic
COMMENT ON COLUMN callabo_bookings.booking_type IS 
'Type of booking: investor (personal use, no limits), friend (friends/family, 3 days/week limit), guest (paying clients)';

-- Create a view for easier weekly usage tracking
CREATE OR REPLACE VIEW callabo_weekly_usage AS
SELECT 
    i.id as investor_id,
    i.name,
    i.email,
    i.clerk_user_id,
    date_trunc('week', b.start_date)::DATE as week_start,
    SUM(b.end_date - b.start_date + 1) as days_used
FROM callabo_investors i
LEFT JOIN callabo_bookings b ON i.id = b.investor_id
WHERE b.booking_type = 'friend' 
AND b.status = 'confirmed'
AND b.start_date >= date_trunc('week', CURRENT_DATE - INTERVAL '4 weeks')
GROUP BY i.id, i.name, i.email, i.clerk_user_id, date_trunc('week', b.start_date)
ORDER BY week_start DESC;

COMMENT ON VIEW callabo_weekly_usage IS 'Shows weekly friends/family booking usage for the last 4 weeks';