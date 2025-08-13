'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('phone')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')

  const handleSendOtp = async () => {
    console.log('Sending OTP for:', authMode, authMode === 'phone' ? phone : email)
    setLoading(true)
    
    try {
      if (authMode === 'phone') {
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin
          }
        })
        if (error) throw error
      }
      
      setOtpSent(true)
    } catch (error: any) {
      alert(error.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    
    try {
      if (authMode === 'phone') {
        const { error } = await supabase.auth.verifyOtp({
          phone: phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`,
          token: otp,
          type: 'sms'
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email'
        })
        if (error) throw error
      }
      
      onClose()
    } catch (error: any) {
      alert(error.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (error: any) {
      alert(error.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        maxWidth: '400px',
        width: '90%',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>

        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          Welcome to Callabo
        </h2>

        {!otpSent ? (
          <>
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => setAuthMode('phone')}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '2px solid',
                  borderColor: authMode === 'phone' ? '#667eea' : '#e0e0e0',
                  background: authMode === 'phone' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
                  color: authMode === 'phone' ? 'white' : '#666',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '600'
                }}
              >
                📱 Phone
              </button>
              <button
                onClick={() => setAuthMode('email')}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '2px solid',
                  borderColor: authMode === 'email' ? '#667eea' : '#e0e0e0',
                  background: authMode === 'email' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
                  color: authMode === 'email' ? 'white' : '#666',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: '600'
                }}
              >
                ✉️ Email
              </button>
            </div>

            {authMode === 'phone' ? (
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => {
                  console.log('Phone input changed:', e.target.value)
                  setPhone(e.target.value)
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid #e8e9ff',
                  fontSize: '16px',
                  marginBottom: '20px',
                  background: '#f8f9ff',
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: '#333',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
                autoComplete="tel"
              />
            ) : (
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid #e8e9ff',
                  fontSize: '16px',
                  marginBottom: '20px',
                  background: '#f8f9ff',
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: '#333',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
                autoComplete="email"
              />
            )}

            <button
              onClick={handleSendOtp}
              disabled={loading || (authMode === 'phone' ? !phone : !email)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                border: 'none',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'default' : 'pointer',
                marginBottom: '20px'
              }}
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '20px 0',
              color: '#999'
            }}>
              <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
              <span style={{ padding: '0 15px', fontSize: '14px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                border: '2px solid #e8e9ff',
                background: 'white',
                color: '#333',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '20px' }} />
              Continue with Google
            </button>
          </>
        ) : (
          <>
            <p style={{
              textAlign: 'center',
              color: '#666',
              marginBottom: '20px'
            }}>
              Enter the 6-digit code sent to {authMode === 'phone' ? phone : email}
            </p>

            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid #e8e9ff',
                fontSize: '24px',
                marginBottom: '20px',
                background: '#f8f9ff',
                textAlign: 'center',
                letterSpacing: '8px'
              }}
            />

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                border: 'none',
                background: loading || otp.length !== 6 ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading || otp.length !== 6 ? 'default' : 'pointer',
                marginBottom: '10px'
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              onClick={() => {
                setOtpSent(false)
                setOtp('')
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  )
}