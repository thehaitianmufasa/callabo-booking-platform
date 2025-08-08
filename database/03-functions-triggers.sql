-- CALLABO DATABASE FUNCTIONS & TRIGGERS
-- Business logic and automation

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION callabo_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables
DROP TRIGGER IF EXISTS update_callabo_investors_updated_at ON callabo_investors;
CREATE TRIGGER update_callabo_investors_updated_at 
    BEFORE UPDATE ON callabo_investors
    FOR EACH ROW EXECUTE FUNCTION callabo_update_updated_at_column();

DROP TRIGGER IF EXISTS update_callabo_bookings_updated_at ON callabo_bookings;
CREATE TRIGGER update_callabo_bookings_updated_at 
    BEFORE UPDATE ON callabo_bookings
    FOR EACH ROW EXECUTE FUNCTION callabo_update_updated_at_column();

DROP TRIGGER IF EXISTS update_callabo_analytics_updated_at ON callabo_analytics;
CREATE TRIGGER update_callabo_analytics_updated_at 
    BEFORE UPDATE ON callabo_analytics
    FOR EACH ROW EXECUTE FUNCTION callabo_update_updated_at_column();

-- Function to check and enforce night limits (3 nights per quarter)
CREATE OR REPLACE FUNCTION callabo_check_night_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_nights INTEGER;
    booking_nights INTEGER;
    quarter_start DATE;
BEGIN
    -- Only check for investor bookings
    IF NEW.booking_type = 'investor' THEN
        -- Get investor's quarter start and current nights used
        SELECT i.nights_used, i.quarter_start 
        INTO current_nights, quarter_start
        FROM callabo_investors i
        WHERE i.id = NEW.investor_id;
        
        -- Calculate nights for this booking
        booking_nights := NEW.end_date - NEW.start_date + 1;
        
        -- Check if within same quarter
        IF NEW.start_date >= quarter_start THEN
            IF current_nights + booking_nights > 3 THEN
                RAISE EXCEPTION 'Investor has exceeded 3 night quarterly limit. Current nights used: %, Requested: %', 
                    current_nights, booking_nights;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS callabo_enforce_night_limit ON callabo_bookings;
CREATE TRIGGER callabo_enforce_night_limit 
    BEFORE INSERT ON callabo_bookings
    FOR EACH ROW EXECUTE FUNCTION callabo_check_night_limit();

-- Function to update investor nights used
CREATE OR REPLACE FUNCTION callabo_update_nights_used()
RETURNS TRIGGER AS $$
DECLARE
    booking_nights INTEGER;
    old_booking_nights INTEGER;
BEGIN
    -- Calculate nights for new booking
    booking_nights := NEW.end_date - NEW.start_date + 1;
    
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.booking_type = 'investor' AND NEW.status = 'confirmed' THEN
            UPDATE callabo_investors 
            SET nights_used = nights_used + booking_nights
            WHERE id = NEW.investor_id;
        END IF;
    
    -- Handle UPDATE
    ELSIF TG_OP = 'UPDATE' THEN
        -- Calculate old booking nights
        old_booking_nights := OLD.end_date - OLD.start_date + 1;
        
        -- If status changed to confirmed
        IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' AND NEW.booking_type = 'investor' THEN
            UPDATE callabo_investors 
            SET nights_used = nights_used + booking_nights
            WHERE id = NEW.investor_id;
        
        -- If status changed from confirmed
        ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' AND OLD.booking_type = 'investor' THEN
            UPDATE callabo_investors 
            SET nights_used = nights_used - old_booking_nights
            WHERE id = OLD.investor_id;
        
        -- If dates changed while confirmed
        ELSIF OLD.status = 'confirmed' AND NEW.status = 'confirmed' AND NEW.booking_type = 'investor' 
            AND (OLD.start_date != NEW.start_date OR OLD.end_date != NEW.end_date) THEN
            UPDATE callabo_investors 
            SET nights_used = nights_used - old_booking_nights + booking_nights
            WHERE id = NEW.investor_id;
        END IF;
    
    -- Handle DELETE
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.booking_type = 'investor' AND OLD.status = 'confirmed' THEN
            old_booking_nights := OLD.end_date - OLD.start_date + 1;
            UPDATE callabo_investors 
            SET nights_used = nights_used - old_booking_nights
            WHERE id = OLD.investor_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS callabo_update_investor_nights ON callabo_bookings;
CREATE TRIGGER callabo_update_investor_nights 
    AFTER INSERT OR UPDATE OR DELETE ON callabo_bookings
    FOR EACH ROW EXECUTE FUNCTION callabo_update_nights_used();

-- Function to reset quarterly nights
CREATE OR REPLACE FUNCTION callabo_reset_quarterly_nights()
RETURNS void AS $$
BEGIN
    UPDATE callabo_investors
    SET nights_used = 0,
        quarter_start = CURRENT_DATE
    WHERE quarter_start <= CURRENT_DATE - INTERVAL '3 months';
    
    -- Create notifications for reset investors
    INSERT INTO callabo_notifications (investor_id, type, title, message)
    SELECT 
        id,
        'quarter_reset',
        'Quarterly Nights Reset',
        'Your quarterly night allocation has been reset. You now have 3 nights available for booking.'
    FROM callabo_investors
    WHERE quarter_start = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to create booking notification
CREATE OR REPLACE FUNCTION callabo_create_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO callabo_notifications (investor_id, type, title, message)
        VALUES (
            NEW.investor_id,
            'booking_created',
            'Booking Created',
            format('Your booking from %s to %s has been created with status: %s', 
                NEW.start_date, NEW.end_date, NEW.status)
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO callabo_notifications (investor_id, type, title, message)
        VALUES (
            NEW.investor_id,
            CASE 
                WHEN NEW.status = 'cancelled' THEN 'booking_cancelled'
                ELSE 'booking_created'
            END,
            format('Booking %s', initcap(NEW.status)),
            format('Your booking from %s to %s is now %s', 
                NEW.start_date, NEW.end_date, NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS callabo_booking_notification ON callabo_bookings;
CREATE TRIGGER callabo_booking_notification 
    AFTER INSERT OR UPDATE ON callabo_bookings
    FOR EACH ROW EXECUTE FUNCTION callabo_create_booking_notification();

-- Function to update analytics
CREATE OR REPLACE FUNCTION callabo_update_analytics()
RETURNS void AS $$
DECLARE
    current_month DATE;
    total_nights INTEGER;
    guest_night_count INTEGER;
    investor_night_count INTEGER;
    booking_count INTEGER;
    month_revenue DECIMAL;
    occupancy DECIMAL;
BEGIN
    current_month := date_trunc('month', CURRENT_DATE);
    
    -- Calculate metrics for current month
    SELECT 
        COUNT(*),
        COALESCE(SUM(CASE WHEN booking_type = 'guest' 
            THEN end_date - start_date + 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN booking_type = 'investor' 
            THEN end_date - start_date + 1 ELSE 0 END), 0),
        COALESCE(SUM(amount), 0)
    INTO 
        booking_count,
        guest_night_count,
        investor_night_count,
        month_revenue
    FROM callabo_bookings
    WHERE status = 'confirmed'
    AND start_date >= current_month
    AND start_date < current_month + INTERVAL '1 month';
    
    -- Calculate occupancy rate
    total_nights := guest_night_count + investor_night_count;
    occupancy := (total_nights::DECIMAL / DATE_PART('days', 
        date_trunc('month', current_month) + INTERVAL '1 month' - INTERVAL '1 day'))::DECIMAL * 100;
    
    -- Upsert analytics record
    INSERT INTO callabo_analytics (
        month, occupancy_rate, revenue, guest_nights, 
        investor_nights, total_bookings
    ) VALUES (
        current_month, occupancy, month_revenue, guest_night_count,
        investor_night_count, booking_count
    )
    ON CONFLICT (month) DO UPDATE SET
        occupancy_rate = EXCLUDED.occupancy_rate,
        revenue = EXCLUDED.revenue,
        guest_nights = EXCLUDED.guest_nights,
        investor_nights = EXCLUDED.investor_nights,
        total_bookings = EXCLUDED.total_bookings,
        updated_at = TIMEZONE('utc', NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to check availability before booking
CREATE OR REPLACE FUNCTION callabo_check_availability()
RETURNS TRIGGER AS $$
DECLARE
    blocked_dates DATE[];
BEGIN
    -- Check if any dates in the range are marked as unavailable
    SELECT ARRAY_AGG(date) INTO blocked_dates
    FROM callabo_space_availability
    WHERE date >= NEW.start_date 
    AND date <= NEW.end_date
    AND is_available = false;
    
    IF array_length(blocked_dates, 1) > 0 THEN
        RAISE EXCEPTION 'Some dates are not available: %', blocked_dates;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS callabo_check_availability_trigger ON callabo_bookings;
CREATE TRIGGER callabo_check_availability_trigger 
    BEFORE INSERT OR UPDATE ON callabo_bookings
    FOR EACH ROW EXECUTE FUNCTION callabo_check_availability();