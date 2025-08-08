-- Seed data for Callabo booking platform (Fixed version)
-- This migration adds sample investors and bookings for testing

-- First, drop the existing migration file if it failed
-- Insert sample investors (start with 0 nights used)
INSERT INTO callabo_investors (id, clerk_user_id, name, email, phone, nights_used, quarter_start, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'user_test_js', 'John Smith', 'john.smith@example.com', '+1-555-0101', 0, '2025-07-01', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'user_test_sj', 'Sarah Johnson', 'sarah.johnson@example.com', '+1-555-0102', 0, '2025-07-01', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'user_test_md', 'Michael Davis', 'michael.davis@example.com', '+1-555-0103', 0, '2025-07-01', NOW(), NOW())
ON CONFLICT (clerk_user_id) DO NOTHING;

-- Insert sample bookings for August 2025
-- John: 1 night (Aug 5-6)
INSERT INTO callabo_bookings (id, investor_id, start_date, end_date, guest_name, guest_contact, booking_type, amount, status, notes, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2025-08-05', '2025-08-06', 'John Smith', 'john.smith@example.com', 'investor', 0, 'confirmed', 'First night this quarter', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sarah: 1 night (Aug 12-13) - reduced to stay within limits  
INSERT INTO callabo_bookings (id, investor_id, start_date, end_date, guest_name, guest_contact, booking_type, amount, status, notes, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2025-08-12', '2025-08-13', 'Sarah Johnson', 'sarah.johnson@example.com', 'investor', 0, 'confirmed', 'Second booking this quarter', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Alex: Paid guest, 2 nights (Aug 20-22)
INSERT INTO callabo_bookings (id, investor_id, start_date, end_date, guest_name, guest_contact, booking_type, amount, status, notes, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440003', NULL, '2025-08-20', '2025-08-22', 'Alex Wilson', 'alex.wilson@example.com', 'guest', 100.00, 'confirmed', 'Friend of John - paid guest', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;