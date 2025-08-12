'use client';

import { useState } from 'react';
import PhoneAuth from '@/components/auth/PhoneAuth';
import EmailAuth from '@/components/auth/EmailAuth';

export default function SignInPage() {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('email');

  if (authMethod === 'email') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          padding: '40px'
        }}>
          {/* Auth Method Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '40px',
            gap: '12px'
          }}>
            <button
              onClick={() => setAuthMethod('phone')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: authMethod === 'phone' ? '#667eea' : '#e0e0e0',
                color: authMethod === 'phone' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📱 Phone
            </button>
            <button
              onClick={() => setAuthMethod('email')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: authMethod === 'email' ? '#667eea' : '#e0e0e0',
                color: authMethod === 'email' ? 'white' : '#666',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ✉️ Email
            </button>
          </div>

          <EmailAuth />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div>
        {/* Auth Method Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
          gap: '12px'
        }}>
          <button
            onClick={() => setAuthMethod('phone')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              background: authMethod === 'phone' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
              color: authMethod === 'phone' ? '#667eea' : 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            📱 Phone
          </button>
          <button
            onClick={() => setAuthMethod('email')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              background: authMethod === 'email' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,white,0.3)',
              color: authMethod === 'email' ? '#667eea' : 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            ✉️ Email
          </button>
        </div>

        {/* Auth Component */}
        <PhoneAuth />
      </div>
    </div>
  );
}