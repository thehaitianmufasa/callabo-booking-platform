'use client'

import { useState, useEffect } from 'react'
import Calendar from '@/components/Calendar'
import BookingDetails from '@/components/BookingDetails'
import FloatingActionButton from '@/components/FloatingActionButton'
import UserProfile from '@/components/UserProfile'
import MessagingPanel from '@/components/MessagingPanel'
import { useUser } from '@clerk/nextjs'

export default function Home() {
  const { user } = useUser()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [investors, setInvestors] = useState<any[]>([])
  const [showProfile, setShowProfile] = useState(true)
  const [showMessages, setShowMessages] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Fetch bookings and investors data
    fetchBookings()
    fetchInvestors()
  }, [])

  const fetchBookings = async () => {
    try {
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const res = await fetch(`/api/availability/${year}/${month}`)
      const data = await res.json()
      
      if (res.ok) {
        setBookings(data.bookings || [])
        setInvestors(data.investors || [])
      } else {
        console.error('API Error:', data.error)
        // Fallback to mock data if API fails
        setInvestors([
          { id: '1', name: 'John Smith', nights_used: 1 },
          { id: '2', name: 'Sarah Johnson', nights_used: 2 },
          { id: '3', name: 'Michael Davis', nights_used: 0 },
        ])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Fallback to mock data if API fails
      setInvestors([
        { id: '1', name: 'John Smith', nights_used: 1 },
        { id: '2', name: 'Sarah Johnson', nights_used: 2 },
        { id: '3', name: 'Michael Davis', nights_used: 0 },
      ])
    }
  }

  const fetchInvestors = async () => {
    // This is now handled in fetchBookings to reduce API calls
    return
  }

  const handleCreateBooking = () => {
    // Navigate to booking creation
    window.location.href = '/bookings/new'
  }

  return (
    <>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        color: 'white'
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 20px',
          background: 'white',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}>
          <img 
            src="/callabo-logo.jpg" 
            alt="Callabo Logo" 
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'contain'
            }}
          />
        </div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '8px',
          letterSpacing: '4px',
          margin: '0 0 8px 0'
        }}>
          COLLABO
        </h1>
        <p style={{
          fontSize: '16px',
          opacity: 0.9,
          fontWeight: '300',
          margin: 0
        }}>
          Hapeville, GA
        </p>
      </div>

      {/* Toggle Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => {
            setShowProfile(!showProfile)
            setShowMessages(false)
          }}
          style={{
            padding: '12px 24px',
            borderRadius: '24px',
            border: 'none',
            background: showProfile ? 'white' : 'rgba(255,255,255,0.2)',
            color: showProfile ? '#667eea' : 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
        >
          My Profile
        </button>
        <button
          onClick={() => {
            setShowMessages(!showMessages)
            setShowProfile(false)
          }}
          style={{
            padding: '12px 24px',
            borderRadius: '24px',
            border: 'none',
            background: showMessages ? 'white' : 'rgba(255,255,255,0.2)',
            color: showMessages ? '#667eea' : 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            position: 'relative'
          }}
        >
          Messages
          {/* Notification Badge */}
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#dc2626',
              color: 'white',
              fontSize: '11px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* User Profile */}
      {showProfile && <UserProfile />}

      {/* Messaging */}
      {showMessages && <MessagingPanel />}

      {/* Booking Card */}
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        marginBottom: '30px'
      }}>
        {/* Calendar Section */}
        <Calendar 
          onDateSelect={setSelectedDate}
          bookings={bookings}
        />

        {/* Booking Details Section */}
        {selectedDate && (
          <BookingDetails 
            date={selectedDate}
            investors={investors}
          />
        )}
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleCreateBooking} />
    </>
  )
}