# Callabo Booking Platform - Project Requirements and Planning (PRP)

## 🎯 PROJECT OVERVIEW

**Project Name:** Callabo Booking Platform  
**Type:** Creative Space Booking & Guest Management System  
**Location:** Hapeville, GA  
**Priority:** Revenue-generating feature (P1)  
**Estimated Timeline:** 4-6 weeks  
**Target Launch:** Q4 2025  

### Vision Statement
Create a modern, intuitive booking platform for Callabo creative space in Hapeville, GA that streamlines guest management, calendar coordination, and booking operations with a premium user experience.

### Business Objectives
- Increase booking efficiency by 80%
- Reduce manual scheduling overhead by 90%
- Generate $2,000-5,000/month recurring revenue
- Optimize creative space utilization
- Create competitive advantage in local market

---

## 🏗️ TECHNICAL ARCHITECTURE

### Tech Stack (Aligned with Jeff's Preferences)
- **Frontend:** Next.js 14+ with TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Logto (not NextAuth)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (frontend)
- **State Management:** Zustand or React Context
- **Testing:** Jest + React Testing Library + Playwright
- **Calendar:** Custom component with date-fns

### System Architecture
```
Frontend (Next.js) → API Routes → Supabase → Database
                  ↓
            Real-time Updates
                  ↓
            WebSocket/SSE
```

### Key Features
1. **Interactive Calendar** - Month/week views with real-time availability
2. **Guest Management** - Track usage, preferences, booking history  
3. **Smart Booking** - Conflict prevention, automatic confirmations
4. **Rate Management** - Dynamic pricing, friend/family rates
5. **Analytics Dashboard** - Revenue, occupancy, guest insights
6. **Mobile-First Design** - Responsive across all devices
7. **Real-time Updates** - Live availability sync

---

## 👥 USER STORIES & ACCEPTANCE CRITERIA

### Epic 1: Calendar Management
**AS A** property manager  
**I WANT TO** view and manage calendar availability  
**SO THAT** I can efficiently coordinate bookings and avoid conflicts  

#### User Stories:
1. **Calendar Display**
   - View monthly calendar with clear availability states
   - Navigate between months smoothly
   - See guest information for booked dates
   - **AC:** Calendar loads <2 seconds, shows 3 states (available/booked/selected)

2. **Date Selection**
   - Click dates to select booking periods
   - Visual feedback for selected ranges
   - Prevent selection of unavailable dates
   - **AC:** Date selection works on mobile, clear visual states

### Epic 2: Guest Management  
**AS A** property manager  
**I WANT TO** manage guest information and booking limits  
**SO THAT** I can track usage and maintain relationships  

#### User Stories:
1. **Guest Profiles**
   - View guest avatars and names
   - Track nights used vs. allocation
   - Manage guest permissions and rates
   - **AC:** Guest cards show usage (e.g., "2/3 nights used")

2. **Booking Limits**
   - Enforce per-guest night limits
   - Send notifications at 80% usage
   - Allow admin override for exceptions
   - **AC:** System prevents over-booking, clear warnings

### Epic 3: Booking Operations
**AS A** guest or manager  
**I WANT TO** create and manage bookings  
**SO THAT** the process is seamless and error-free  

#### User Stories:
1. **Create Booking**
   - Select dates and guest
   - Auto-calculate rates and totals
   - Send confirmation immediately
   - **AC:** Booking completes in <5 clicks, confirmation sent

2. **Modify Booking**
   - Change dates within availability
   - Update guest assignments
   - Handle cancellations gracefully
   - **AC:** Changes reflect real-time, no double bookings

---

## 🗄️ DATABASE SCHEMA

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'guest', 'manager')) DEFAULT 'guest',
  phone TEXT,
  emergency_contact JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### space_settings
```sql
CREATE TABLE space_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Callabo Creative Space',
  location TEXT NOT NULL DEFAULT 'Hapeville, GA',
  description TEXT,
  capacity INTEGER DEFAULT 1,
  base_rate DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  friend_family_rate DECIMAL(10,2) DEFAULT 50.00,
  amenities JSONB,
  rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### bookings
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  rate_per_night DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  special_requests TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent overlapping bookings
  CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
    daterange(check_in, check_out, '[)') WITH &&
  ) WHERE (status != 'cancelled')
);
```

#### guest_allocations
```sql
CREATE TABLE guest_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES users(id) ON DELETE CASCADE,
  allocated_nights INTEGER NOT NULL DEFAULT 3,
  used_nights INTEGER DEFAULT 0,
  allocation_period TEXT DEFAULT 'monthly',
  reset_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(guest_id)
);
```

#### availability_overrides
```sql
CREATE TABLE availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  is_available BOOLEAN NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔌 API SPECIFICATIONS

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/profile` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Calendar Endpoints
- `GET /api/calendar` - Get monthly availability
- `GET /api/calendar/:year/:month` - Specific month
- `POST /api/calendar/availability` - Override availability

### Booking Endpoints
- `GET /api/bookings` - List all bookings (with filters)
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/bookings/:id/confirm` - Confirm pending booking

### Guest Management Endpoints
- `GET /api/guests` - List all guests
- `POST /api/guests` - Add new guest
- `GET /api/guests/:id` - Get guest details
- `PUT /api/guests/:id` - Update guest info
- `GET /api/guests/:id/allocations` - Get night allocations
- `PUT /api/guests/:id/allocations` - Update allocations

### Analytics Endpoints
- `GET /api/analytics/overview` - Dashboard metrics
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/occupancy` - Occupancy rates

---

## 🎨 UI/UX DESIGN REQUIREMENTS

### Design System
- **Primary Colors:** Purple gradient (#667eea to #764ba2)
- **Secondary Colors:** Green (#4ade80) for available, Red (#dc2626) for booked
- **Typography:** System fonts (-apple-system, BlinkMacSystemFont, Segoe UI)
- **Spacing:** 8px base grid system
- **Border Radius:** 12px for cards, 20px for buttons
- **Shadows:** Subtle layered shadows for depth

### Component Requirements

#### Calendar Component
- 60px height day cells for easy touch targets
- Hover effects with 2px lift animation
- Color-coded states: Available (green), Booked (red), Selected (purple)
- Smooth month navigation transitions
- Loading states for async operations

#### Guest Cards  
- Avatar with initials fallback
- Progress indicators for night usage
- Hover effects with border color change
- Status badges with appropriate colors
- Mobile-optimized layout (stack on small screens)

#### Responsive Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

### Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- Screen reader compatibility
- Color contrast ratio ≥ 4.5:1
- Focus indicators on all focusable elements

---

## 📋 IMPLEMENTATION PHASES

### Phase 1: Foundation (Weeks 1-2)
**Deliverables:**
- Project setup with Next.js, TypeScript, Tailwind
- Supabase database setup with schema
- Logto authentication integration
- Basic calendar component
- Mobile-responsive layout

**Acceptance Criteria:**
- Calendar displays current month correctly
- Users can authenticate successfully
- Database schema deployed and seeded
- Mobile layout works on iOS/Android

### Phase 2: Core Booking (Weeks 3-4)
**Deliverables:**
- Complete booking CRUD operations
- Guest management system
- Availability conflict prevention
- Rate calculation logic
- Email notifications

**Acceptance Criteria:**
- Bookings prevent double-booking automatically
- Guest allocation tracking works correctly
- Rates calculate based on guest type
- Confirmation emails send within 30 seconds

### Phase 3: Advanced Features (Weeks 5-6)
**Deliverables:**
- Analytics dashboard
- Real-time updates via websockets
- Calendar export (iCal)
- Advanced filtering and search
- Performance optimization

**Acceptance Criteria:**
- Dashboard loads in <2 seconds
- Real-time updates work across devices
- Calendar export compatible with Google/Apple
- Site passes Core Web Vitals

---

## 🧪 TESTING STRATEGY

### Unit Testing (80% Coverage Target)
- All utility functions and hooks
- Form validation logic
- Date calculation functions
- Rate calculation algorithms

### Integration Testing
- API endpoint functionality
- Database constraint enforcement
- Authentication flow
- Booking conflict prevention

### End-to-End Testing
- Complete booking workflow
- Guest management operations
- Calendar navigation and selection
- Mobile responsiveness

### Performance Testing
- Calendar rendering with 365+ days
- Concurrent booking attempts
- Large guest list rendering
- Mobile performance on 3G

### Test Data
- 12 months of sample bookings
- 50+ guest profiles
- Various booking scenarios (conflicts, cancellations)
- Edge cases (holidays, blackout dates)

---

## 🚀 DEPLOYMENT STRATEGY

### Environment Setup
- **Development:** Local with Supabase local instance
- **Staging:** Vercel preview with Supabase staging
- **Production:** Vercel production with Supabase prod

### CI/CD Pipeline
1. **On PR:** Run tests, lint, type checking
2. **On staging push:** Deploy to staging environment
3. **On main push:** Deploy to production
4. **Weekly:** Run security scans and dependency updates

### Monitoring & Observability
- **Frontend:** Vercel Analytics + Core Web Vitals
- **Backend:** Supabase logging and metrics
- **Errors:** Sentry for error tracking
- **Uptime:** StatusPage monitoring

### Backup Strategy
- **Database:** Daily automated backups via Supabase
- **Code:** Git repository with multiple remotes
- **Assets:** Cloudinary or Supabase storage with CDN

---

## 📊 SUCCESS METRICS

### Business Metrics
- **Revenue:** $2,000-5,000/month recurring
- **Booking Efficiency:** 80% reduction in manual work
- **Guest Satisfaction:** >4.5/5 rating
- **Occupancy Rate:** >70% monthly average

### Technical Metrics
- **Performance:** <2s page load time
- **Availability:** 99.9% uptime
- **Error Rate:** <0.1% error rate
- **Test Coverage:** >80% code coverage

### User Experience Metrics
- **Task Completion:** >95% booking completion rate
- **Mobile Usage:** >60% mobile traffic
- **Return Users:** >70% monthly return rate
- **Support Tickets:** <5 tickets/month

---

## 🔄 MAINTENANCE & SCALING

### Regular Maintenance
- **Weekly:** Review and respond to guest feedback
- **Monthly:** Performance optimization review
- **Quarterly:** Security audit and dependency updates
- **Annually:** Feature roadmap and architecture review

### Scaling Considerations
- **User base growth:** Optimize for increased guest management
- **API rate limiting:** Implement as user base grows
- **Caching strategy:** Redis for session and query caching
- **CDN optimization:** Static asset delivery optimization

### Future Enhancements
- **Payment Integration:** Stripe for automated billing
- **Smart Pricing:** Dynamic rates based on demand
- **Guest App:** Dedicated mobile app for guests
- **Analytics Dashboard:** Advanced reporting and insights

---

## 📁 PROJECT STRUCTURE

```
/callabo-booking-platform/
├── src/
│   ├── app/                    # Next.js 14 app router
│   │   ├── api/               # API routes
│   │   ├── calendar/          # Calendar pages
│   │   ├── bookings/          # Booking management
│   │   ├── guests/            # Guest management
│   │   └── analytics/         # Analytics dashboard
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── calendar/         # Calendar components
│   │   ├── booking/          # Booking components
│   │   └── guest/            # Guest components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Helper functions
├── public/                   # Static assets
├── docs/                     # Documentation
├── tests/                    # Test files
│   ├── __mocks__/           # Mock files
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
├── .env.local               # Environment variables
├── .env.example             # Environment template
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

---

## 🔐 SECURITY CONSIDERATIONS

### Data Protection
- **Encryption:** All sensitive data encrypted at rest
- **PII Handling:** Minimal collection, secure storage
- **Access Control:** Role-based permissions (RBAC)
- **Audit Trail:** All booking changes logged

### API Security
- **Rate Limiting:** 100 requests/minute per user
- **Input Validation:** All inputs sanitized and validated
- **Authentication:** JWT tokens with refresh mechanism
- **CORS:** Restricted to approved domains only

### Compliance
- **GDPR:** Data export/deletion on request
- **CCPA:** California privacy compliance
- **PCI DSS:** If payment processing added
- **Local Laws:** Georgia/US privacy regulations

---

## 📞 SUPPORT & DOCUMENTATION

### User Documentation
- **Guest Guide:** How to book and manage stays
- **Manager Guide:** Complete platform administration
- **API Documentation:** For future integrations
- **Troubleshooting:** Common issues and solutions

### Technical Documentation
- **Setup Guide:** Development environment setup
- **Deployment Guide:** Production deployment steps
- **Architecture Overview:** System design documentation
- **Contributing Guide:** For future developers

---

## ✅ DEFINITION OF DONE

### Feature Complete Criteria
- [ ] All user stories implemented with acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E tests covering happy path scenarios
- [ ] Mobile responsive design verified
- [ ] Accessibility compliance verified (WCAG 2.1 AA)
- [ ] Performance benchmarks met (<2s load time)
- [ ] Security scan passed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Staging deployment successful
- [ ] Product owner acceptance received

### Production Readiness Criteria
- [ ] Production environment configured
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Monitoring and alerting active
- [ ] Backup procedures verified
- [ ] Rollback plan documented
- [ ] User training completed
- [ ] Go-live communication sent

---

**Last Updated:** August 3, 2025  
**Next Review:** August 17, 2025  
**Project Owner:** Jeff Chery  
**Technical Lead:** Claude Code Agent  
**Business Stakeholder:** Callabo Management
