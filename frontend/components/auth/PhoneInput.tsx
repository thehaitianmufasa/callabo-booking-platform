'use client';

import { useState, useEffect } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  error?: string | null;
}

export default function PhoneInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  error
}: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  const formatPhoneNumber = (input: string): string => {
    const phoneNumber = input.replace(/\D/g, '');
    
    if (phoneNumber.length === 0) return '';
    if (phoneNumber.length <= 3) {
      return `(${phoneNumber}`;
    }
    if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digitsOnly = input.replace(/\D/g, '');
    
    // Allow up to 10 digits for US phone numbers
    if (digitsOnly.length <= 10) {
      const formatted = formatPhoneNumber(digitsOnly);
      onChange(formatted);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.replace(/\D/g, '').length === 10 && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div>
      <label
        htmlFor="phone"
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: focused ? '#667eea' : '#666',
          marginBottom: '8px',
          transition: 'color 0.3s ease'
        }}
      >
        Phone Number
      </label>
      
      <div style={{
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '16px',
          color: '#666',
          pointerEvents: 'none'
        }}>
          🇺🇸 +1
        </div>
        
        <input
          id="phone"
          type="tel"
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder="(555) 123-4567"
          autoComplete="tel"
          style={{
            width: '100%',
            padding: '14px 16px 14px 64px',
            fontSize: '16px',
            border: error
              ? '2px solid #ef4444'
              : focused
              ? '2px solid #667eea'
              : '2px solid #e0e0e0',
            borderRadius: '12px',
            outline: 'none',
            transition: 'all 0.3s ease',
            backgroundColor: disabled ? '#f5f5f5' : 'white',
            cursor: disabled ? 'not-allowed' : 'text',
            boxSizing: 'border-box'
          }}
        />
        
        {value.replace(/\D/g, '').length === 10 && (
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#10b981',
            fontSize: '20px',
            pointerEvents: 'none'
          }}>
            ✓
          </div>
        )}
      </div>
      
      {error && (
        <p style={{
          marginTop: '8px',
          fontSize: '14px',
          color: '#ef4444'
        }}>
          {error}
        </p>
      )}
      
      <p style={{
        marginTop: '8px',
        fontSize: '12px',
        color: '#999'
      }}>
        We'll send you a verification code via SMS
      </p>
    </div>
  );
}