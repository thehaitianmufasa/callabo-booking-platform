-- Seed data for Callabo booking platform
-- This script adds sample investors and bookings for testing

-- Clear existing data
DELETE FROM callabo_notifications;
DELETE FROM callabo_bookings;
DELETE FROM callabo_investors;

-- Insert sample investors
INSERT INTO callabo_investors (id, clerk_user_id, name, email, phone, nights_used, quarter_start, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'user_test_js', 'John Smith', 'john.smith@example.com', '+1-555-0101', 1, '2025-01-01', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'user_test_sj', 'Sarah Johnson', 'sarah.johnson@example.com', '+1-555-0102', 2, '2025-01-01', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'user_test_md', 'Michael Davis', 'michael.davis@example.com', '+1-555-0103', 0, '2025-01-01', NOW(), NOW());

-- Insert sample bookings for August 2025
INSERT INTO callabo_bookings (id, investor_id, start_date, end_date, guest_name, guest_contact, booking_type, amount, status, notes, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2025-08-05', '2025-08-06', 'John Smith', 'john.smith@example.com', 'investor', 0, 'confirmed', 'First night this quarter', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2025-08-12', '2025-08-14', 'Sarah Johnson', 'sarah.johnson@example.com', 'investor', 0, 'confirmed', 'Second booking this quarter', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', NULL, '2025-08-20', '2025-08-22', 'Alex Wilson', 'alex.wilson@example.com', 'guest', 100.00, 'confirmed', 'Friend of John - paid guest', NOW(), NOW());

-- Insert space availability overrides (optional - for blocked dates)
-- INSERT INTO callabo_space_availability (date, is_available, blocked_reason, created_at) VALUES
-- ('2025-08-25', false, 'Maintenance day', NOW());

-- Verify data
SELECT 'Investors' as table_name, COUNT(*) as count FROM callabo_investors
UNION ALL
SELECT 'Bookings' as table_name, COUNT(*) as count FROM callabo_bookings;