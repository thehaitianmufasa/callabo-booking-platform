'use client'

import { useState, useEffect } from 'react'
import Calendar from '@/components/Calendar'
import BookingDetails from '@/components/BookingDetails'
import FloatingActionButton from '@/components/FloatingActionButton'
import UserProfile from '@/components/UserProfile'
import MessagingPanel from '@/components/MessagingPanel'
import { useAuth } from '@/components/AuthProvider'
import AuthModal from '@/components/AuthModal'

export default function Home() {
  console.log('🏠 Home component rendering...')
  
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  console.log('👤 Current user:', user?.id, user?.email)
  console.log('🔑 Auth loaded:', !loading, 'User signed in:', !!user)
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [investors, setInvestors] = useState<any[]>([])
  const [showProfile, setShowProfile] = useState(true)
  const [showMessages, setShowMessages] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Debug: Log bookings state changes
  console.log('🔄 Main component bookings state:', bookings.length, bookings)
  
  // Debug: Log when bookings state changes
  useEffect(() => {
    console.log('📊 Bookings state updated:', bookings.length, bookings)
  }, [bookings])

  useEffect(() => {
    console.log('⚡ useEffect triggered with user:', user?.id)
    if (user) {
      console.log('⚡ User exists, calling sync and fetch functions...')
      // Sync user data to database first
      syncUserData()
      // Then fetch bookings and investors data
      fetchBookings()
      fetchInvestors()
    } else {
      console.log('⚡ No user, skipping fetch')
    }
  }, [user])

  const syncUserData = async () => {
    if (!user) return
    
    try {
      const userData = {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: user.phone || ''
      }
      
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
    } catch (error) {
      console.error('Error syncing user data:', error)
    }
  }

  const fetchBookings = async () => {
    if (!user) return
    
    console.log('🚀 Starting fetchBookings for user:', user.id)
    
    try {
      // Fetch user-specific bookings for calendar
      console.log('📡 Making fetch request to:', `/api/bookings?userId=${user.id}`)
      const res = await fetch(`/api/bookings?userId=${user.id}`)
      console.log('📡 Response status:', res.status, res.statusText)
      
      const data = await res.json()
      console.log('📡 Raw response data:', data)
      
      if (res.ok) {
        console.log('✅ Response OK - processing data')
        console.log('📊 Bookings API response:', data)
        console.log('📅 Frontend received bookings:', data.bookings?.length || 0, data.bookings)
        console.log('🔧 About to setBookings with:', data.bookings || [])
        setBookings(data.bookings || [])
        console.log('✅ setBookings completed')
      } else {
        console.error('❌ API Error:', data.error)
        setBookings([])
      }
      
      // Fetch all investors for the investor list (if needed)
      const investorsRes = await fetch('/api/investors')
      if (investorsRes.ok) {
        const investorsData = await investorsRes.json()
        setInvestors(investorsData.investors || [])
      } else {
        // Fallback to current user only
        setInvestors([{
          id: user.id,
          name: user.fullName || user.firstName + ' ' + user.lastName || 'User',
          email: user.primaryEmailAddress?.emailAddress || ''
        }])
      }
    } catch (error) {
      console.error('💥 Error fetching data:', error)
      console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      setBookings([])
      setInvestors([])
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

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        marginTop: '50px', 
        color: 'white' 
      }}>
        <h2>Loading...</h2>
      </div>
    )
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div style={{ 
        textAlign: 'center', 
        marginTop: '50px', 
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
          letterSpacing: '4px'
        }}>
          COLLABO
        </h1>
        <p style={{
          fontSize: '16px',
          opacity: 0.9,
          fontWeight: '300',
          marginBottom: '40px'
        }}>
          Hapeville, GA - Creative Space Booking
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button 
            onClick={() => setShowAuthModal(true)}
            style={{
              padding: '15px 30px',
              borderRadius: '25px',
              border: 'none',
              background: 'white',
              color: '#667eea',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}>
            Sign In
          </button>
          <button 
            onClick={() => setShowAuthModal(true)}
            style={{
              padding: '15px 30px',
              borderRadius: '25px',
              border: '2px solid white',
              background: 'transparent',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              Sign Up
            </button>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    )
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
      
      {/* Auth Modal (not shown when user is authenticated) */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}