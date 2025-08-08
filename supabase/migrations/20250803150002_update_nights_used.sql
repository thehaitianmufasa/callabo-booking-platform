-- Update investor nights_used to match their bookings
UPDATE callabo_investors 
SET nights_used = 1 
WHERE id = '550e8400-e29b-41d4-a716-446655440001'; -- John Smith

UPDATE callabo_investors 
SET nights_used = 1 
WHERE id = '550e8400-e29b-41d4-a716-446655440002'; -- Sarah Johnson

-- Michael Davis remains at 0 (no bookings yet)