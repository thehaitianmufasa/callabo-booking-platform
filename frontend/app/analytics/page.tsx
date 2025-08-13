'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'

interface Analytics {
  totalBookings: number
  totalNights: number
  nightsUsedThisQuarter: number
  nightsRemainingThisQuarter: number
  personalUseNights: number
  guestNights: number
  monthlyBookings: number
  occupancyRate: number
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<Analytics>({
    totalBookings: 0,
    totalNights: 0,
    nightsUsedThisQuarter: 0,
    nightsRemainingThisQuarter: 3,
    personalUseNights: 0,
    guestNights: 0,
    monthlyBookings: 0,
    occupancyRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserAnalytics()
    }
  }, [user])

  const fetchUserAnalytics = async () => {
    try {
      const res = await fetch(`/api/bookings?userId=${user?.id}`)
      const data = await res.json()
      
      if (res.ok) {
        const bookings = data.bookings || []
        
        // Calculate analytics from bookings data
        const totalBookings = bookings.length
        const totalNights = bookings.reduce((sum: number, booking: any) => sum + (booking.nights_count || 1), 0)
        
        // Current quarter calculation (quarters: Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
        const now = new Date()
        const currentQuarter = Math.floor((now.getMonth()) / 3) + 1
        const quarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1)
        const quarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0)
        
        const quarterBookings = bookings.filter((booking: any) => {
          const bookingDate = new Date(booking.start_date)
          return bookingDate >= quarterStart && bookingDate <= quarterEnd
        })
        
        const nightsUsedThisQuarter = quarterBookings
          .filter((booking: any) => booking.booking_type === 'Personal Use')
          .reduce((sum: number, booking: any) => sum + (booking.nights_count || 1), 0)
        
        const personalUseNights = bookings
          .filter((booking: any) => booking.booking_type === 'Personal Use')
          .reduce((sum: number, booking: any) => sum + (booking.nights_count || 1), 0)
        
        const guestNights = bookings
          .filter((booking: any) => booking.booking_type !== 'Personal Use')
          .reduce((sum: number, booking: any) => sum + (booking.nights_count || 1), 0)
        
        // This month's bookings
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()
        const monthlyBookings = bookings.filter((booking: any) => {
          const bookingDate = new Date(booking.start_date)
          return bookingDate.getMonth() === thisMonth && bookingDate.getFullYear() === thisYear
        }).length
        
        // Simple occupancy rate calculation (this would be more complex in reality)
        const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate()
        const monthlyNights = bookings
          .filter((booking: any) => {
            const bookingDate = new Date(booking.start_date)
            return bookingDate.getMonth() === thisMonth && bookingDate.getFullYear() === thisYear
          })
          .reduce((sum: number, booking: any) => sum + (booking.nights_count || 1), 0)
        
        const occupancyRate = Math.round((monthlyNights / daysInMonth) * 100)
        
        setAnalytics({
          totalBookings,
          totalNights,
          nightsUsedThisQuarter,
          nightsRemainingThisQuarter: Math.max(0, 3 - nightsUsedThisQuarter),
          personalUseNights,
          guestNights,
          monthlyBookings,
          occupancyRate: Math.min(100, occupancyRate)
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

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
          ANALYTICS
        </h1>
        <p style={{
          fontSize: '14px',
          opacity: 0.9,
          fontWeight: '300',
          margin: '8px 0 0 0'
        }}>
          Your booking insights and usage statistics
        </p>
      </div>
      
      <div style={{ padding: '0 20px' }}>
        {/* Current Quarter Usage */}
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
            Current Quarter Usage
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#667eea',
                marginBottom: '4px'
              }}>
                {loading ? '...' : `${analytics.nightsUsedThisQuarter}/3`}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Nights Used
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#22c55e',
                marginBottom: '4px'
              }}>
                {loading ? '...' : analytics.nightsRemainingThisQuarter}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Remaining
              </div>
            </div>
          </div>
        </div>

        {/* This Month Stats */}
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
            This Month
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#667eea',
                marginBottom: '4px'
              }}>
                {loading ? '...' : `${analytics.occupancyRate}%`}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Occupancy Rate
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#22c55e',
                marginBottom: '4px'
              }}>
                {loading ? '...' : analytics.monthlyBookings}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Bookings
              </div>
            </div>
          </div>
        </div>
        
        {/* All-Time Stats */}
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
            All-Time Statistics
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#667eea',
                marginBottom: '4px'
              }}>
                {loading ? '...' : analytics.totalBookings}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Bookings
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#22c55e',
                marginBottom: '4px'
              }}>
                {loading ? '...' : analytics.totalNights}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Nights
              </div>
            </div>
          </div>
        </div>
        
        {/* Booking Breakdown */}
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
            Booking Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0'
            }}>
              <span style={{ color: '#333', fontSize: '16px' }}>Personal Use Nights</span>
              <span style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#667eea'
              }}>
                {loading ? '...' : analytics.personalUseNights}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0'
            }}>
              <span style={{ color: '#333', fontSize: '16px' }}>Guest Nights</span>
              <span style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#22c55e'
              }}>
                {loading ? '...' : analytics.guestNights}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}