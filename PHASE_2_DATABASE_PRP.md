# 🚀 CALLABO - Phase 2 Implementation PRP
## Database Setup & Core Models

### CONTEXT
You are building the database layer for Callabo. Phase 1 foundation is complete with separated frontend/backend architecture. Now you need to set up Supabase with proper schema for booking management.

### PREREQUISITES
- [ ] Supabase account created
- [ ] Supabase project initialized
- [ ] Database URL obtained
- [ ] Clerk authentication configured

### PHASE 2 IMPLEMENTATION

#### 1. SUPABASE PROJECT SETUP
```bash
# 1. Go to https://supabase.com and create new project
# 2. Name: callabo-booking
# 3. Database Password: [generate strong password]
# 4. Region: US East (closest to Atlanta)
```

#### 2. DATABASE SCHEMA
Create these tables in Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Investors table
CREATE TABLE investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  nights_used INTEGER DEFAULT 0,
  quarter_start DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_contact TEXT NOT NULL,
  booking_type TEXT CHECK (booking_type IN ('investor', 'guest')) NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT no_overlap EXCLUDE USING gist (daterange(start_date, end_date, '[]') WITH &&)
);

-- Space availability table
CREATE TABLE space_availability (
  date DATE PRIMARY KEY,
  is_available BOOLEAN DEFAULT true,
  blocked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('booking_created', 'booking_cancelled', 'reminder', 'quarter_reset')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL UNIQUE,
  occupancy_rate DECIMAL(5, 2),
  revenue DECIMAL(10, 2),
  guest_nights INTEGER DEFAULT 0,
  investor_nights INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_investor ON bookings(investor_id);
CREATE INDEX idx_notifications_investor ON notifications(investor_id);
CREATE INDEX idx_analytics_month ON analytics(month);
```

#### 3. ROW LEVEL SECURITY (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Investors policies
CREATE POLICY "Investors can view own profile" ON investors
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "Investors can update own profile" ON investors
  FOR UPDATE USING (clerk_user_id = auth.uid()::text);

-- Bookings policies (all investors can view all bookings)
CREATE POLICY "All investors can view bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM investors 
      WHERE investors.clerk_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Investors can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM investors 
      WHERE investors.id = investor_id 
      AND investors.clerk_user_id = auth.uid()::text
    )
  );

-- Notifications policies
CREATE POLICY "Investors view own notifications" ON notifications
  FOR SELECT USING (
    investor_id IN (
      SELECT id FROM investors 
      WHERE clerk_user_id = auth.uid()::text
    )
  );

-- Analytics policies (all investors can view)
CREATE POLICY "All investors can view analytics" ON analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM investors 
      WHERE investors.clerk_user_id = auth.uid()::text
    )
  );
```

#### 4. DATABASE FUNCTIONS & TRIGGERS
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables
CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON investors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check and enforce night limits
CREATE OR REPLACE FUNCTION check_night_limit()
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
        FROM investors i
        WHERE i.id = NEW.investor_id;
        
        -- Calculate nights for this booking
        booking_nights := NEW.end_date - NEW.start_date + 1;
        
        -- Check if within same quarter
        IF NEW.start_date >= quarter_start THEN
            IF current_nights + booking_nights > 3 THEN
                RAISE EXCEPTION 'Investor has exceeded 3 night quarterly limit';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_night_limit BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION check_night_limit();

-- Function to update investor nights used
CREATE OR REPLACE FUNCTION update_nights_used()
RETURNS TRIGGER AS $$
DECLARE
    booking_nights INTEGER;
BEGIN
    IF NEW.booking_type = 'investor' AND NEW.status = 'confirmed' THEN
        booking_nights := NEW.end_date - NEW.start_date + 1;
        
        UPDATE investors 
        SET nights_used = nights_used + booking_nights
        WHERE id = NEW.investor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_investor_nights AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_nights_used();

-- Function to reset quarterly nights
CREATE OR REPLACE FUNCTION reset_quarterly_nights()
RETURNS void AS $$
BEGIN
    UPDATE investors
    SET nights_used = 0,
        quarter_start = CURRENT_DATE
    WHERE quarter_start <= CURRENT_DATE - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql;
```

#### 5. BACKEND API SETUP
Create `backend/src/services/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions
export const getAvailability = async (month, year) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_date, end_date, guest_name, investor_id')
    .gte('start_date', startDate.toISOString())
    .lte('end_date', endDate.toISOString())
    .eq('status', 'confirmed');
    
  return bookings;
};

export const createBooking = async (bookingData) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getInvestorNights = async (investorId) => {
  const { data } = await supabase
    .from('investors')
    .select('nights_used, quarter_start')
    .eq('id', investorId)
    .single();
    
  return {
    nightsUsed: data.nights_used,
    nightsRemaining: 3 - data.nights_used,
    quarterStart: data.quarter_start
  };
};
```

#### 6. API ROUTES IMPLEMENTATION
Create `backend/src/routes/bookings.js`:
```javascript
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { 
  getAvailability, 
  createBooking, 
  getInvestorNights 
} from '../services/supabase.js';

const router = express.Router();

// Get availability for a month
router.get('/availability/:year/:month', requireAuth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const bookings = await getAvailability(parseInt(month), parseInt(year));
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new booking
router.post('/bookings', requireAuth, async (req, res) => {
  try {
    const booking = await createBooking({
      ...req.body,
      investor_id: req.userId
    });
    res.json({ booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get investor nights remaining
router.get('/investors/nights', requireAuth, async (req, res) => {
  try {
    const nights = await getInvestorNights(req.userId);
    res.json(nights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

#### 7. ENVIRONMENT VARIABLES
Add to `backend/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
```

Add to `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### VALIDATION CHECKLIST
- [ ] All tables created successfully
- [ ] RLS policies applied and tested
- [ ] Triggers functioning (night limit enforcement)
- [ ] API endpoints returning data
- [ ] Real-time subscriptions configured
- [ ] Environment variables set correctly

### SUCCESS CRITERIA
✅ Database schema supports all booking requirements
✅ Night limits automatically enforced
✅ No double bookings possible (constraint)
✅ API endpoints functional
✅ Ready for UI development in Phase 3

### NEXT STEPS
1. Test all database functions with sample data
2. Verify RLS policies with different user roles
3. Set up real-time listeners for booking updates
4. Begin Phase 3: Mobile-First UI Development