# 🎨 CALLABO - Phase 3 Implementation PRP
## Mobile-First UI Development (Glide-Inspired Design)

### CONTEXT
You are building the frontend UI for Callabo with a clean, Glide-inspired mobile-first design. The database is set up, and now you need to create the beautiful, intuitive interface that looks exactly like the Glide mockup shown earlier.

### DESIGN SPECIFICATIONS
- **Primary Colors**: Black (#000000), White (#FFFFFF), Gray (#F5F5F5)
- **Typography**: System fonts (-apple-system, BlinkMacSystemFont)
- **Border Radius**: 8px for small elements, 20px for cards, 30px for phone mockup
- **Shadows**: Subtle (0 10px 30px rgba(0,0,0,0.1))
- **Mobile First**: 375px base, max-width 768px for mobile views

### PHASE 3 IMPLEMENTATION

#### 1. TAILWIND CONFIGURATION
Update `frontend/tailwind.config.js`:
```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'callabo-black': '#000000',
        'callabo-gray': '#F5F5F5',
        'callabo-gray-dark': '#E0E0E0',
        'callabo-gray-text': '#666666',
      },
      borderRadius: {
        'callabo': '20px',
        'callabo-lg': '30px',
      },
      boxShadow: {
        'callabo': '0 10px 30px rgba(0,0,0,0.1)',
        'callabo-lg': '0 10px 30px rgba(0,0,0,0.3)',
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

#### 2. GLOBAL STYLES
Update `frontend/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-system bg-callabo-gray text-black;
  }
}

@layer components {
  .callabo-card {
    @apply bg-white rounded-callabo p-6 shadow-callabo;
  }
  
  .callabo-button {
    @apply bg-black text-white px-6 py-3 rounded-lg font-semibold 
           transition-transform hover:transform hover:-translate-y-0.5;
  }
  
  .callabo-input {
    @apply w-full px-4 py-3 border border-callabo-gray-dark rounded-lg
           focus:outline-none focus:border-black transition-colors;
  }
  
  .status-badge {
    @apply inline-flex px-3 py-1 rounded-full text-xs font-medium;
  }
  
  .status-available {
    @apply bg-green-100 text-green-800;
  }
  
  .status-booked {
    @apply bg-red-100 text-red-800;
  }
}
```

#### 3. LAYOUT COMPONENT
Create `frontend/app/layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import MobileNav from '@/components/MobileNav'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-callabo-gray">
            <div className="max-w-md mx-auto bg-white min-h-screen relative">
              {children}
              <MobileNav />
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

#### 4. CALENDAR COMPONENT
Create `frontend/components/Calendar.tsx`:
```typescript
'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns'

interface CalendarProps {
  onDateSelect: (date: Date) => void
  bookings: Array<{
    start_date: string
    end_date: string
    guest_name: string
  }>
}

export default function Calendar({ onDateSelect, bookings }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const isBooked = (date: Date) => {
    return bookings.some(booking => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      return date >= start && date <= end
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateSelect(date)
  }

  return (
    <div className="p-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
          className="p-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
          className="p-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center text-xs text-callabo-gray-text p-2">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const booked = isBooked(day)
          const selected = selectedDate && day.toDateString() === selectedDate.toDateString()
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={booked}
              className={`
                aspect-square border rounded-lg text-sm
                ${booked ? 'bg-red-100 border-red-300 cursor-not-allowed' : 'hover:bg-callabo-gray'}
                ${selected ? 'bg-black text-white' : ''}
                ${!booked && !selected ? 'bg-green-50 border-green-200' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

#### 5. BOOKING DETAILS COMPONENT
Create `frontend/components/BookingDetails.tsx`:
```typescript
interface BookingDetailsProps {
  date: Date
  investors: Array<{
    id: string
    name: string
    nights_used: number
  }>
}

export default function BookingDetails({ date, investors }: BookingDetailsProps) {
  return (
    <div className="p-4 border-t border-callabo-gray-dark">
      <h3 className="font-semibold mb-4">
        {format(date, 'MMMM d')} - Available
      </h3>
      
      <div className="space-y-3">
        {investors.map(investor => (
          <div key={investor.id} className="flex justify-between items-center">
            <div>
              <span className="font-medium">{investor.name}</span>
              <span className="text-sm text-callabo-gray-text ml-2">
                {investor.nights_used}/3 nights used
              </span>
            </div>
            <span className="text-sm text-green-600">Free</span>
          </div>
        ))}
        
        <div className="flex justify-between items-center pt-3 border-t">
          <span>Friend/Family Rate</span>
          <span className="font-semibold">$50/night</span>
        </div>
      </div>
    </div>
  )
}
```

#### 6. FLOATING ACTION BUTTON
Create `frontend/components/FloatingActionButton.tsx`:
```typescript
interface FABProps {
  onClick: () => void
}

export default function FloatingActionButton({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 w-14 h-14 bg-black text-white 
                 rounded-full shadow-callabo-lg flex items-center justify-center
                 hover:scale-105 transition-transform z-50"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
```

#### 7. MOBILE NAVIGATION
Create `frontend/components/MobileNav.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', icon: '📅', label: 'Calendar' },
    { href: '/bookings', icon: '📋', label: 'Bookings' },
    { href: '/analytics', icon: '📊', label: 'Analytics' },
    { href: '/profile', icon: '👤', label: 'Profile' },
  ]
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-callabo-gray-dark">
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center py-3 text-xs
                ${pathname === item.href ? 'text-black' : 'text-callabo-gray-text'}
              `}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
```

#### 8. HOME PAGE
Update `frontend/app/page.tsx`:
```typescript
'use client'

import { useState, useEffect } from 'react'
import Calendar from '@/components/Calendar'
import BookingDetails from '@/components/BookingDetails'
import FloatingActionButton from '@/components/FloatingActionButton'
import { useUser } from '@clerk/nextjs'

export default function Home() {
  const { user } = useUser()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [bookings, setBookings] = useState([])
  const [investors, setInvestors] = useState([])

  useEffect(() => {
    // Fetch bookings and investors data
    fetchBookings()
    fetchInvestors()
  }, [])

  const fetchBookings = async () => {
    const res = await fetch('/api/bookings')
    const data = await res.json()
    setBookings(data.bookings)
  }

  const fetchInvestors = async () => {
    const res = await fetch('/api/investors')
    const data = await res.json()
    setInvestors(data.investors)
  }

  const handleCreateBooking = () => {
    // Navigate to booking creation
    window.location.href = '/bookings/new'
  }

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="bg-black text-white p-6 text-center">
        <h1 className="text-2xl font-bold">Creative Space</h1>
        <p className="text-sm opacity-80 mt-1">Hapeville, GA</p>
      </div>

      {/* Calendar */}
      <Calendar 
        onDateSelect={setSelectedDate}
        bookings={bookings}
      />

      {/* Booking Details */}
      {selectedDate && (
        <BookingDetails 
          date={selectedDate}
          investors={investors}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleCreateBooking} />
    </div>
  )
}
```

#### 9. BOOKING CREATION MODAL
Create `frontend/app/bookings/new/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function NewBooking() {
  const router = useRouter()
  const { user } = useUser()
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    guest_name: '',
    guest_contact: '',
    booking_type: 'investor',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">New Booking</h2>
          <button onClick={() => router.back()} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Check-in Date</label>
            <input
              type="date"
              required
              className="callabo-input"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Check-out Date</label>
            <input
              type="date"
              required
              className="callabo-input"
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Booking Type</label>
            <select
              className="callabo-input"
              value={formData.booking_type}
              onChange={(e) => setFormData({...formData, booking_type: e.target.value})}
            >
              <option value="investor">Personal Use (Free)</option>
              <option value="guest">Friend/Family ($50/night)</option>
            </select>
          </div>

          {formData.booking_type === 'guest' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Guest Name</label>
                <input
                  type="text"
                  required
                  className="callabo-input"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Guest Contact</label>
                <input
                  type="text"
                  required
                  className="callabo-input"
                  value={formData.guest_contact}
                  onChange={(e) => setFormData({...formData, guest_contact: e.target.value})}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              className="callabo-input"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <button type="submit" className="callabo-button w-full">
            Create Booking
          </button>
        </form>
      </div>
    </div>
  )
}
```

### VALIDATION CHECKLIST
- [ ] Mobile-first responsive design
- [ ] Calendar displays correctly with availability
- [ ] Booking creation flow works
- [ ] Navigation between screens smooth
- [ ] Clerk authentication integrated
- [ ] API calls functioning
- [ ] Loading states implemented
- [ ] Error handling in place

### SUCCESS CRITERIA
✅ Looks exactly like Glide mockup
✅ Smooth mobile experience
✅ Calendar clearly shows availability
✅ Easy booking creation process
✅ Real-time updates working
✅ Clean, minimal aesthetic maintained

### NEXT STEPS
1. Test on actual mobile devices
2. Add loading and error states
3. Implement real-time updates with Supabase
4. Begin Phase 4: Booking Logic Implementation