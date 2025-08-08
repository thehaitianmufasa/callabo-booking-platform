'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import UserProfile from '@/components/UserProfile'

export default function ProfilePage() {
  const { user } = useUser()
  
  return (
    <div style={{
      paddingBottom: '80px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        padding: '40px 20px 20px',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          margin: 0,
          letterSpacing: '2px'
        }}>
          PROFILE
        </h1>
        <p style={{
          fontSize: '14px',
          opacity: 0.9,
          fontWeight: '300',
          margin: '8px 0 0 0'
        }}>
          Manage your account settings
        </p>
      </div>
      
      <div style={{ padding: '0 20px' }}>
        {/* Use the same UserProfile component from the main page */}
        <UserProfile />
        
        {/* Additional Settings Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '30px',
          marginTop: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 20px 0',
            color: '#333'
          }}>
            Account Settings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button style={{
              width: '100%',
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: '#f8f9ff',
              color: '#333',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e8e9ff'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f8f9ff'}
            >
              Notification Preferences
            </button>
            <button style={{
              width: '100%',
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: '#f8f9ff',
              color: '#333',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e8e9ff'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f8f9ff'}
            >
              Privacy Settings
            </button>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#f8f9ff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: {
                      width: '40px',
                      height: '40px'
                    }
                  }
                }}
              />
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Account Management
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#666'
                }}>
                  Sign out or manage your account
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}