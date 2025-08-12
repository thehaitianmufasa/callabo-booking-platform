'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

interface UserProfileData {
  name: string
  email: string
  phone: string
  role: string
}

export default function UserProfile() {
  const { user } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<UserProfileData>({
    name: '',
    email: '',
    phone: '',
    role: 'Investor'
  })
  const [userStats, setUserStats] = useState({
    nightsUsed: 0,
    totalBookings: 0
  })

  useEffect(() => {
    if (user) {
      fetchUserProfileFromDatabase()
      fetchUserStats()
    }
  }, [user])

  const fetchUserProfileFromDatabase = async () => {
    try {
      // Always try database first, but ensure sync exists first
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.fullName || user?.firstName + ' ' + user?.lastName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
          phone: user?.primaryPhoneNumber?.phoneNumber || ''
        })
      })

      // Now get the profile from database
      const response = await fetch(`/api/users/profile?userId=${user?.id}`)
      if (response.ok) {
        const dbProfile = await response.json()
        if (dbProfile.investor) {
          setProfileData({
            name: dbProfile.investor.name || user?.fullName || user?.firstName + ' ' + user?.lastName || '',
            email: dbProfile.investor.email || user?.primaryEmailAddress?.emailAddress || '',
            phone: dbProfile.investor.phone || user?.primaryPhoneNumber?.phoneNumber || '',
            role: 'Investor'
          })
          return
        }
      }
      
      // Fallback to Clerk data
      setProfileData({
        name: user?.fullName || user?.firstName + ' ' + user?.lastName || '',
        email: user?.primaryEmailAddress?.emailAddress || '',
        phone: user?.primaryPhoneNumber?.phoneNumber || '',
        role: 'Investor'
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfileData({
        name: user?.fullName || user?.firstName + ' ' + user?.lastName || '',
        email: user?.primaryEmailAddress?.emailAddress || '',
        phone: user?.primaryPhoneNumber?.phoneNumber || '',
        role: 'Investor'
      })
    }
  }

  const fetchUserStats = async () => {
    try {
      const res = await fetch(`/api/bookings?userId=${user?.id}`)
      const data = await res.json()
      
      if (res.ok) {
        const bookings = data.bookings || []
        
        // Calculate current week usage for friends/family bookings
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6) // End of current week (Saturday)
        weekEnd.setHours(23, 59, 59, 999)
        
        const weekBookings = bookings.filter((booking: any) => {
          const bookingDate = new Date(booking.start_date)
          return bookingDate >= weekStart && bookingDate <= weekEnd
        })
        
        const daysUsed = weekBookings
          .filter((booking: any) => booking.booking_type === 'friend')
          .reduce((sum: number, booking: any) => {
            const startDate = new Date(booking.start_date)
            const endDate = new Date(booking.end_date)
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
            return sum + days
          }, 0)
        
        setUserStats({
          nightsUsed: daysUsed,
          totalBookings: bookings.length
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const handleSave = async () => {
    try {
      // Update Clerk user profile if name changed
      if (user && profileData.name !== (user.fullName || user.firstName + ' ' + user.lastName)) {
        await user.update({
          firstName: profileData.name.split(' ')[0],
          lastName: profileData.name.split(' ').slice(1).join(' ') || ''
        })
      }

      // Update profile data in database (for notifications)
      const updateResponse = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile in database')
      }
      
      setIsEditing(false)
      
      // Show success feedback
      console.log('✅ Profile updated successfully - email notifications will be sent to:', profileData.email)
      
      // Show user feedback
      alert(`✅ Profile updated successfully!\n\nBooking notifications will now be sent to:\n${profileData.email}`)
      
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      alert('❌ Error updating profile. Please try again.')
    }
  }

  return (
    <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: 0,
            color: '#333'
          }}>
            My Profile
          </h2>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: isEditing ? '#22c55e' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {/* Profile Picture */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: '700'
            }}>
              {profileData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  placeholder="Enter your name"
                  style={{
                    width: '200px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #e8e9ff',
                    fontSize: '18px',
                    fontWeight: '600',
                    background: '#f8f9ff',
                    marginBottom: '8px'
                  }}
                />
              ) : (
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '4px'
                }}>
                  {profileData.name || 'User Name'}
                </div>
              )}
              <div style={{
                fontSize: '14px',
                color: '#666',
                padding: '4px 12px',
                background: '#f0fdf4',
                borderRadius: '20px',
                display: 'inline-block'
              }}>
                {profileData.role}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#666',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e8e9ff',
                    fontSize: '16px',
                    background: '#f8f9ff'
                  }}
                />
              ) : (
                <div style={{
                  fontSize: '16px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" fill="none" stroke="#667eea" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {profileData.email}
                </div>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#666',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  placeholder="+1 (555) 000-0000"
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '2px solid #e8e9ff',
                    fontSize: '16px',
                    background: '#f8f9ff'
                  }}
                />
              ) : (
                <div style={{
                  fontSize: '16px',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" fill="none" stroke="#667eea" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {profileData.phone || 'Add phone number'}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div style={{
              flex: 1,
              padding: '16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f8f9ff, #ffffff)',
              border: '2px solid #e8e9ff',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#667eea',
                marginBottom: '4px'
              }}>
                {userStats.nightsUsed}/3
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Weekly F&F Days
              </div>
            </div>
            
            <div style={{
              flex: 1,
              padding: '16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f0fdf4, #ffffff)',
              border: '2px solid #bbf7d0',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#22c55e',
                marginBottom: '4px'
              }}>
                {userStats.totalBookings}
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
          </div>
        </div>
      </div>
  )
}