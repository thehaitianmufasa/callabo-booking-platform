# Callabo Database Setup Guide

## Quick Setup Instructions

### Step 1: Access Supabase SQL Editor
1. Go to https://supabase.com and sign in
2. Navigate to your project dashboard
3. Click on "SQL Editor" in the left sidebar

### Step 2: Execute SQL Files in Order

Execute each SQL file in this sequence:

1. **01-schema.sql** - Creates all Callabo tables with proper prefixes
2. **02-rls-policies.sql** - Sets up Row Level Security policies
3. **03-functions-triggers.sql** - Creates business logic and automation
4. **04-sample-data.sql** - (Optional) Adds test data

### Step 3: Verify Installation

Run this verification query:
```sql
-- Check all Callabo tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'callabo_%'
ORDER BY table_name;
```

Expected result should show:
- callabo_analytics
- callabo_bookings
- callabo_investors
- callabo_notifications
- callabo_space_availability

### Step 4: Test the Setup

```sql
-- Test investor creation
INSERT INTO callabo_investors (clerk_user_id, name, email) 
VALUES ('test_clerk_id', 'Test User', 'test@callabo.com')
RETURNING *;

-- Test booking creation (will fail without proper investor_id)
-- This is expected behavior
```

## Environment Variables

Ensure these are set in your project files:

### Backend (.env)
```
SUPABASE_URL=https://xgfkhrxabdkjkzduvqnu.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xgfkhrxabdkjkzduvqnu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## API Endpoints

After setup, these endpoints will be available:

- `GET /api/health` - Check backend and database connection
- `GET /api/availability/:year/:month` - Get monthly availability
- `POST /api/bookings` - Create new booking (requires auth)
- `GET /api/bookings/mine` - Get user's bookings (requires auth)
- `GET /api/investors/nights` - Get nights remaining (requires auth)
- `PATCH /api/bookings/:id/status` - Update booking status (requires auth)

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure you're using the service key for backend operations
2. **Booking Overlap**: The constraint prevents double bookings automatically
3. **Night Limit Exceeded**: Investors are limited to 3 nights per quarter
4. **Authentication Issues**: Verify Clerk keys match between frontend and backend

### Reset Database

To completely reset and start fresh:
```sql
-- Drop all Callabo tables
DROP TABLE IF EXISTS callabo_notifications CASCADE;
DROP TABLE IF EXISTS callabo_analytics CASCADE;
DROP TABLE IF EXISTS callabo_bookings CASCADE;
DROP TABLE IF EXISTS callabo_space_availability CASCADE;
DROP TABLE IF EXISTS callabo_investors CASCADE;

-- Then re-run setup files 01-04
```

## Next Steps

1. Test the API endpoints using the backend health check
2. Verify Clerk authentication is working
3. Create test bookings through the API
4. Monitor the callabo_analytics table for metrics

## Support

For issues or questions:
- Check Supabase logs in the dashboard
- Review backend console output
- Verify environment variables are correctly set