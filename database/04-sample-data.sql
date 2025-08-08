-- CALLABO SAMPLE DATA FOR TESTING
-- Insert sample data for testing the platform

-- Insert sample investors
INSERT INTO callabo_investors (clerk_user_id, name, email, phone, nights_used, quarter_start) VALUES
('clerk_test_user_1', 'John Smith', 'john.smith@example.com', '404-555-0101', 1, CURRENT_DATE - INTERVAL '1 month'),
('clerk_test_user_2', 'Sarah Johnson', 'sarah.johnson@example.com', '404-555-0102', 2, CURRENT_DATE - INTERVAL '1 month'),
('clerk_test_user_3', 'Michael Davis', 'michael.davis@example.com', '404-555-0103', 0, CURRENT_DATE),
('clerk_test_user_4', 'Emily Wilson', 'emily.wilson@example.com', '404-555-0104', 3, CURRENT_DATE - INTERVAL '2 months');

-- Get investor IDs for booking creation
DO $$
DECLARE
    investor1_id UUID;
    investor2_id UUID;
    investor3_id UUID;
    investor4_id UUID;
BEGIN
    SELECT id INTO investor1_id FROM callabo_investors WHERE email = 'john.smith@example.com';
    SELECT id INTO investor2_id FROM callabo_investors WHERE email = 'sarah.johnson@example.com';
    SELECT id INTO investor3_id FROM callabo_investors WHERE email = 'michael.davis@example.com';
    SELECT id INTO investor4_id FROM callabo_investors WHERE email = 'emily.wilson@example.com';
    
    -- Insert sample bookings
    INSERT INTO callabo_bookings (investor_id, start_date, end_date, guest_name, guest_contact, booking_type, amount, status, notes) VALUES
    (investor1_id, CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '8 days', 'John Smith', 'john.smith@example.com', 'investor', 0, 'confirmed', 'Personal use - 1 night'),
    (investor2_id, CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '15 days', 'Sarah Johnson', 'sarah.johnson@example.com', 'investor', 0, 'confirmed', 'Weekend stay'),
    (investor2_id, CURRENT_DATE + INTERVAL '21 days', CURRENT_DATE + INTERVAL '22 days', 'Sarah Johnson', 'sarah.johnson@example.com', 'investor', 0, 'pending', 'Tentative booking'),
    (investor3_id, CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '32 days', 'Alex Thompson', 'alex.thompson@example.com', 'guest', 300, 'confirmed', 'Guest of Michael Davis - 3 nights'),
    (investor1_id, CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE + INTERVAL '47 days', 'Maria Garcia', 'maria.garcia@example.com', 'guest', 600, 'pending', 'Photography workshop rental');
    
    -- Insert sample notifications
    INSERT INTO callabo_notifications (investor_id, type, title, message, read) VALUES
    (investor1_id, 'booking_created', 'Booking Confirmed', 'Your booking for July 7-8 has been confirmed.', false),
    (investor2_id, 'booking_created', 'Booking Confirmed', 'Your booking for July 14-15 has been confirmed.', true),
    (investor2_id, 'booking_created', 'New Booking Created', 'Your booking for July 21-22 is pending confirmation.', false),
    (investor3_id, 'quarter_reset', 'Quarterly Nights Reset', 'Your quarterly night allocation has been reset. You now have 3 nights available.', false);
END $$;

-- Insert sample space availability blocks
INSERT INTO callabo_space_availability (date, is_available, blocked_reason) VALUES
(CURRENT_DATE + INTERVAL '60 days', false, 'Maintenance scheduled'),
(CURRENT_DATE + INTERVAL '61 days', false, 'Maintenance scheduled'),
(CURRENT_DATE + INTERVAL '90 days', false, 'Special event');

-- Insert sample analytics data
INSERT INTO callabo_analytics (month, occupancy_rate, revenue, guest_nights, investor_nights, total_bookings) VALUES
(date_trunc('month', CURRENT_DATE - INTERVAL '2 months'), 65.5, 4500.00, 12, 8, 15),
(date_trunc('month', CURRENT_DATE - INTERVAL '1 month'), 72.3, 5200.00, 14, 10, 18),
(date_trunc('month', CURRENT_DATE), 45.2, 2100.00, 8, 6, 10);

-- Display summary
SELECT 'Sample data inserted successfully!' as message;
SELECT COUNT(*) as investor_count FROM callabo_investors;
SELECT COUNT(*) as booking_count FROM callabo_bookings;
SELECT COUNT(*) as notification_count FROM callabo_notifications;
SELECT COUNT(*) as analytics_count FROM callabo_analytics;