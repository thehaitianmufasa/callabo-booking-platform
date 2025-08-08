'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface Booking {
  id: string
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  booking_type: string
  status: string
  nights_count: number
  created_at: string
}

export default function BookingsPage() {
  const { user } = useUser()
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [pastBookings, setPastBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserBookings()
    }
  }, [user])

  const fetchUserBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?userId=${user?.id}`)
      const data = await res.json()
      
      if (res.ok) {
        const now = new Date()
        const upcoming = data.bookings?.filter((booking: Booking) => 
          new Date(booking.start_date) >= now
        ) || []
        const past = data.bookings?.filter((booking: Booking) => 
          new Date(booking.end_date || booking.start_date) < now
        ) || []
        
        setUpcomingBookings(upcoming)
        setPastBookings(past)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const renderBooking = (booking: Booking) => (
    <div key={booking.id} style={{
      padding: '16px',
      borderRadius: '12px',
      background: '#f8f9ff',
      border: '1px solid #e8e9ff',
      marginBottom: '12px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '4px'
          }}>
            {formatDate(booking.start_date)}
            {booking.end_date && booking.end_date !== booking.start_date && 
              ` - ${formatDate(booking.end_date)}`
            }
          </div>
          {booking.start_time && (
            <div style={{
              fontSize: '14px',
              color: '#666'
            }}>
              {formatTime(booking.start_time)}
              {booking.end_time && ` - ${formatTime(booking.end_time)}`}
            </div>
          )}
        </div>
        <div style={{
          padding: '4px 8px',
          borderRadius: '8px',
          background: booking.booking_type === 'Personal Use' ? '#dcfce7' : '#fef3c7',
          color: booking.booking_type === 'Personal Use' ? '#16a34a' : '#d97706',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {booking.booking_type}
        </div>
      </div>
      <div style={{
        fontSize: '14px',
        color: '#666'
      }}>
        {booking.nights_count} night{booking.nights_count !== 1 ? 's' : ''} • 
        Status: {booking.status}
      </div>
    </div>
  )

  return (
    <div style={{
      paddingBottom: '80px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      minHeight: '100vh'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px 20px 20px',
        color: 'white',
        position: 'relative'
      }}>
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
          }}
        >
          ←
        </button>
        
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          margin: 0,
          letterSpacing: '2px'
        }}>
          MY BOOKINGS
        </h1>
        <p style={{
          fontSize: '14px',
          opacity: 0.9,
          fontWeight: '300',
          margin: '8px 0 0 0'
        }}>
          View and manage your reservations
        </p>
      </div>
      
      <div style={{ padding: '0 20px' }}>
        {/* Upcoming Bookings */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 20px 0',
            color: '#333'
          }}>
            Upcoming Bookings ({upcomingBookings.length})
          </h3>
          {loading ? (
            <p style={{ color: '#666' }}>Loading...</p>
          ) : upcomingBookings.length > 0 ? (
            upcomingBookings.map(renderBooking)
          ) : (
            <p style={{ color: '#666' }}>No upcoming bookings found.</p>
          )}
        </div>
        
        {/* Past Bookings */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 20px 0',
            color: '#333'
          }}>
            Past Bookings ({pastBookings.length})
          </h3>
          {loading ? (
            <p style={{ color: '#666' }}>Loading...</p>
          ) : pastBookings.length > 0 ? (
            pastBookings.map(renderBooking)
          ) : (
            <p style={{ color: '#666' }}>No past bookings found.</p>
          )}
        </div>
      </div>
    </div>
  )
}