'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

function NewBookingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    guest_name: '',
    guest_contact: '',
    booking_type: 'investor',
    investor_id: '',
    notes: '',
    start_time: '',
    end_time: ''
  })
  const [showCustomTime, setShowCustomTime] = useState(false)

  useEffect(() => {
    // Pre-fill form data from URL parameters (for quick booking)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const bookingType = searchParams.get('booking_type')
    const guestName = searchParams.get('guest_name')
    const notes = searchParams.get('notes')
    const timeSlot = searchParams.get('time_slot')
    const customTime = searchParams.get('custom_time')

    if (startDate) {
      setFormData(prev => ({
        ...prev,
        start_date: startDate,
        end_date: endDate || startDate,
        booking_type: bookingType || 'investor',
        guest_name: guestName || '',
        notes: notes || ''
      }))
    }

    if (timeSlot) {
      const [startTime, endTime] = timeSlot.split('-')
      setFormData(prev => ({
        ...prev,
        start_time: startTime || '',
        end_time: endTime || ''
      }))
    }

    if (customTime === 'true') {
      setShowCustomTime(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        guest_contact: formData.guest_contact || 'booking@callabo.com', // Default contact info
        investor_id: formData.booking_type === 'investor' ? '550e8400-e29b-41d4-a716-446655440003' : null, // Default to Michael Davis (0/3 nights) for investor bookings
        guest_name: formData.guest_name || (formData.booking_type === 'investor' ? 'Investor Booking' : '')
      }
      
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      })

      if (res.ok) {
        router.push('/')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: '30px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '24px', 
            fontWeight: '700',
            color: '#333',
            margin: 0
          }}>
            New Booking
          </h2>
          <button 
            onClick={() => router.back()} 
            style={{
              padding: '8px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
              color: '#666'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#333'
            }}>
              Check-in Date
            </label>
            <input
              type="date"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e8e9ff',
                fontSize: '16px',
                background: '#f8f9ff',
                transition: 'all 0.3s ease'
              }}
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e8e9ff'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#333'
            }}>
              Check-out Date
            </label>
            <input
              type="date"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e8e9ff',
                fontSize: '16px',
                background: '#f8f9ff',
                transition: 'all 0.3s ease'
              }}
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e8e9ff'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#333'
            }}>
              Booking Type
            </label>
            <select
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e8e9ff',
                fontSize: '16px',
                background: '#f8f9ff',
                transition: 'all 0.3s ease'
              }}
              value={formData.booking_type}
              onChange={(e) => setFormData({...formData, booking_type: e.target.value})}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e8e9ff'}
            >
              <option value="investor">Personal Use (Free)</option>
              <option value="friend">Friend/Family ($50/Night)</option>
              <option value="guest">Paying Client ($$$)</option>
            </select>
          </div>

          {(formData.booking_type === 'guest' || formData.booking_type === 'friend') && (
            <>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#333'
                }}>
                  Client Name
                </label>
                <input
                  type="text"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e8e9ff',
                    fontSize: '16px',
                    background: '#f8f9ff',
                    transition: 'all 0.3s ease'
                  }}
                  value={formData.guest_name}
                  onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e8e9ff'}
                />
              </div>
            </>
          )}

          {/* Time Selection Fields */}
          {(formData.start_time || formData.end_time || showCustomTime) && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid #e8e9ff',
                      fontSize: '16px',
                      background: '#f8f9ff',
                      transition: 'all 0.3s ease'
                    }}
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e8e9ff'}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid #e8e9ff',
                      fontSize: '16px',
                      background: '#f8f9ff',
                      transition: 'all 0.3s ease'
                    }}
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e8e9ff'}
                  />
                </div>
              </div>
              
              {formData.start_time && formData.end_time && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  ⏰ Booking Time: {formData.start_time} - {formData.end_time}
                </div>
              )}
            </>
          )}

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#333'
            }}>
              Notes (Optional)
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e8e9ff',
                fontSize: '16px',
                background: '#f8f9ff',
                transition: 'all 0.3s ease',
                resize: 'vertical',
                minHeight: '80px'
              }}
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e8e9ff'}
            />
          </div>

          <button 
            type="submit" 
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
          >
            Create Booking
          </button>
        </form>
      </div>
    </div>
  )
}

export default function NewBooking() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '30px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          Loading...
        </div>
      </div>
    }>
      <NewBookingForm />
    </Suspense>
  )
}