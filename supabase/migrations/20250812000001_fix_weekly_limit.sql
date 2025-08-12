-- Fix booking limits to be weekly (3 days per week) instead of quarterly
-- This applies to friends/family bookings only, personal use has no limits

-- Update the table structure to track weekly usage instead of quarterly
ALTER TABLE callabo_investors 
DROP COLUMN IF EXISTS nights_used,
DROP COLUMN IF EXISTS quarter_start;

-- Add weekly tracking (we'll calculate this dynamically instead of storing it)
-- No persistent columns needed - we'll calculate from bookings table

-- Update the night limit check function for weekly limits
CREATE OR REPLACE FUNCTION callabo_check_night_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_week_nights INTEGER;
    booking_nights INTEGER;
    week_start DATE;
    week_end DATE;
BEGIN
    -- Only check for friends/family bookings (not personal investor use)
    IF NEW.booking_type = 'friend' THEN
        -- Calculate current week boundaries (Monday to Sunday)
        week_start := date_trunc('week', NEW.start_date);
        week_end := week_start + INTERVAL '6 days';
        
        -- Calculate nights for this booking
        booking_nights := NEW.end_date - NEW.start_date + 1;
        
        -- Get current week's confirmed friends/family bookings for this investor
        SELECT COALESCE(SUM(b.end_date - b.start_date + 1), 0)
        INTO current_week_nights
        FROM callabo_bookings b
        WHERE b.investor_id = NEW.investor_id
        AND b.booking_type = 'friend'
        AND b.status = 'confirmed'
        AND b.start_date >= week_start
        AND b.start_date <= week_end
        AND b.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
        
        -- Check if adding this booking would exceed weekly limit
        IF current_week_nights + booking_nights > 3 THEN
            RAISE EXCEPTION 'Weekly friends/family limit exceeded. Current week usage: %, Requested: %, Limit: 3 days per week', 
                current_week_nights, booking_nights;
        END IF;
    END IF;
    
    -- Personal use (investor) bookings have no weekly limits
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove the old nights tracking trigger since we're calculating dynamically
DROP TRIGGER IF EXISTS callabo_update_investor_nights ON callabo_bookings;
DROP FUNCTION IF EXISTS callabo_update_nights_used();

-- Remove the quarterly reset function since it's no longer needed
DROP FUNCTION IF EXISTS callabo_reset_quarterly_nights();

-- Update comments to reflect the new business logic
COMMENT ON FUNCTION callabo_check_night_limit() IS 'Enforces 3-day weekly limit for friends/family bookings only. Personal use has no limits.';