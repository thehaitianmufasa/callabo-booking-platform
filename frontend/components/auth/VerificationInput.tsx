'use client';

import { useState, useRef, useEffect } from 'react';

interface VerificationInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export default function VerificationInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  error
}: VerificationInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (value === '') {
      setDigits(Array(6).fill(''));
    }
  }, [value]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;
    
    if (digit.length > 1) {
      const pastedDigits = digit.slice(0, 6).split('');
      const newDigits = [...digits];
      
      pastedDigits.forEach((d, i) => {
        if (index + i < 6 && /^\d$/.test(d)) {
          newDigits[index + i] = d;
        }
      });
      
      setDigits(newDigits);
      const newValue = newDigits.join('');
      onChange(newValue);
      
      if (newValue.length === 6) {
        onComplete(newValue);
      } else {
        const nextEmpty = newDigits.findIndex((d, i) => i >= index && d === '');
        if (nextEmpty !== -1 && inputRefs.current[nextEmpty]) {
          inputRefs.current[nextEmpty]?.focus();
        } else if (inputRefs.current[5]) {
          inputRefs.current[5]?.focus();
        }
      }
      return;
    }
    
    if (!/^\d*$/.test(digit)) return;
    
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    
    const newValue = newDigits.join('');
    onChange(newValue);
    
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (newValue.length === 6) {
      onComplete(newValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
      } else if (index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digitsOnly.length > 0) {
      const newDigits = digitsOnly.split('').concat(Array(6 - digitsOnly.length).fill(''));
      setDigits(newDigits);
      const newValue = newDigits.join('');
      onChange(newValue);
      
      if (newValue.length === 6) {
        onComplete(newValue);
      }
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        marginBottom: error ? '16px' : '0'
      }}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onPaste={handlePaste}
            disabled={disabled}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            style={{
              width: '48px',
              height: '56px',
              fontSize: '24px',
              fontWeight: '600',
              textAlign: 'center',
              border: error
                ? '2px solid #ef4444'
                : digit
                ? '2px solid #667eea'
                : '2px solid #e0e0e0',
              borderRadius: '12px',
              outline: 'none',
              transition: 'all 0.3s ease',
              backgroundColor: disabled ? '#f5f5f5' : 'white',
              cursor: disabled ? 'not-allowed' : 'text',
              color: '#333'
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              if (!digit) {
                e.currentTarget.style.borderColor = '#e0e0e0';
              }
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        ))}
      </div>
      
      {error && (
        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#ef4444',
          marginTop: '16px'
        }}>
          {error}
        </p>
      )}
    </div>
  );
}