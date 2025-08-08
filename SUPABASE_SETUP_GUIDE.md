# 🚀 Callabo Supabase Setup Guide
**Step-by-Step Setup Without CLI Issues**

## 📍 Your Current Setup

You already have:
- ✅ Supabase project: `https://xgfkhrxabdkjkzduvqnu.supabase.co`
- ✅ Credentials configured in environment files
- ✅ Database schema files ready in `/database/` folder

---

## 🎯 Quick Setup (5 minutes)

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your project dashboard
4. Click **"SQL Editor"** in the left sidebar

### Step 2: Execute Database Schema
Copy and paste each file content into the SQL Editor and run them **in this order**:

#### File 1: `01-schema.sql`
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS callabo_notifications CASCADE;
DROP TABLE IF EXISTS callabo_analytics CASCADE;
DROP TABLE IF EXISTS callabo_bookings CASCADE;
DROP TABLE IF EXISTS callabo_space_availability CASCADE;
DROP TABLE IF EXISTS callabo_investors CASCADE;

-- [Continue with rest of schema file...]
```

#### File 2: `02-rls-policies.sql`
```sql
-- Enable RLS on all Callabo tables
ALTER TABLE callabo_investors ENABLE ROW LEVEL SECURITY;
-- [Continue with rest of RLS file...]
```

#### File 3: `03-functions-triggers.sql`
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION callabo_update_updated_at_column()
-- [Continue with rest of functions file...]
```

#### File 4: `04-sample-data.sql` (Optional)
```sql
-- Insert sample investors
INSERT INTO callabo_investors (clerk_user_id, name, email, phone, nights_used, quarter_start) VALUES
-- [Continue with rest of sample data...]
```

### Step 3: Verify Setup
After running all files, execute this verification query:
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'callabo_%'
ORDER BY table_name;
```

**Expected Results:**
- callabo_analytics
- callabo_bookings  
- callabo_investors
- callabo_notifications
- callabo_space_availability

---

## 🧪 Test Your Setup

### Test 1: Backend Connection
```bash
cd /Users/mufasa/callabo-booking-platform
npm run dev:backend
```

### Test 2: Health Check
```bash
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "service": "Callabo Backend",
  "database": "Connected",
  "timestamp": "2025-08-03T15:45:00.000Z"
}
```

### Test 3: Database Connection Test
```bash
cd database
node test-connection.js
```

---

## 🔧 Available API Endpoints

Once setup is complete, these endpoints will work:

### Public Endpoints
- `GET /api/health` - System status
- `GET /api/availability/2025/8` - August 2025 calendar

### Authenticated Endpoints (require Clerk token)
- `POST /api/bookings` - Create booking
- `GET /api/bookings/mine` - My bookings  
- `GET /api/investors/nights` - Night balance
- `PATCH /api/bookings/:id/status` - Update booking

---

## 📊 Environment Variables Summary

### Backend (`.env`)
```
SUPABASE_URL=https://xgfkhrxabdkjkzduvqnu.supabase.co
SUPABASE_SERVICE_KEY=[your_service_key]
CLERK_SECRET_KEY=[your_clerk_secret]
```

### Frontend (`.env.local`)  
```
NEXT_PUBLIC_SUPABASE_URL=https://xgfkhrxabdkjkzduvqnu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_anon_key]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[your_clerk_key]
```

---

## 🚨 Troubleshooting

### Issue: "relation does not exist"
**Solution:** Run the SQL files in order (01, 02, 03, 04)

### Issue: Backend won't start
**Solution:** Check `.env` files have correct keys

### Issue: API returns 500 errors
**Solution:** Verify RLS policies are applied (file 02)

### Issue: Bookings fail
**Solution:** Ensure triggers are installed (file 03)

---

## ✅ Success Checklist

- [ ] All 5 `callabo_` tables created
- [ ] RLS policies applied
- [ ] Functions and triggers working
- [ ] Backend starts without errors
- [ ] Health endpoint returns "Connected"
- [ ] Test connection script passes

---

## 🎯 What's Next?

After successful setup:
1. **Phase 3:** Mobile-First UI Development
2. **Calendar Interface:** Book dates visually
3. **Dashboard:** Track night usage
4. **Analytics:** View booking metrics

**Current Status:** Database layer complete, ready for UI development!