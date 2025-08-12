'use client';

import { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import PhoneInput from '@/components/auth/PhoneInput';
import VerificationInput from '@/components/auth/VerificationInput';
import StepIndicator from '@/components/auth/StepIndicator';
import LoadingSpinner from '@/components/auth/LoadingSpinner';
import EmailSignUp from '@/components/auth/EmailSignUp';

export default function SignUpPage() {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('email');
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const formatPhoneForClerk = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      throw new Error('Please enter a valid 10-digit US phone number');
    }
    return `+1${cleaned}`;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 && /^[2-9]\d{9}$/.test(cleaned);
  };

  const handleSendCode = async () => {
    if (!isLoaded || !signUp) return;
    
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit US phone number');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formattedPhone = formatPhoneForClerk(phoneNumber);
      
      await signUp.create({
        phoneNumber: formattedPhone,
      });
      
      await signUp.preparePhoneNumberVerification({
        strategy: 'phone_code'
      });
      
      setStep('verification');
      setAttemptCount(0);
    } catch (err: any) {
      console.error('Error sending code:', err);
      
      if (err?.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!isLoaded || !signUp) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const completeSignUp = await signUp.attemptPhoneNumberVerification({
        code: code,
      });
      
      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/');
      } else {
        setError('Unable to complete sign up. Please try again.');
      }
    } catch (err: any) {
      console.error('Error verifying code:', err);
      setAttemptCount(prev => prev + 1);
      
      if (attemptCount >= 2) {
        setError('Invalid code. Please request a new one.');
      } else {
        setError(`Invalid verification code. ${3 - attemptCount - 1} attempts remaining.`);
      }
      
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    setStep('phone');
    setVerificationCode('');
    setError(null);
    setAttemptCount(0);
  };

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

          <EmailSignUp />
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <LoadingSpinner />
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
              background: authMethod === 'email' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
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

        {/* Phone Sign Up */}
        <AuthCard>
          <StepIndicator currentStep={step} />
          
          {step === 'phone' ? (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '8px',
                textAlign: 'center',
                color: '#333'
              }}>
                Create Your Account
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666',
                textAlign: 'center',
                marginBottom: '32px'
              }}>
                Join Callabo to book creative spaces
              </p>
              
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                onSubmit={handleSendCode}
                disabled={isLoading}
                error={error}
              />
              
              <button
                onClick={handleSendCode}
                disabled={isLoading || !validatePhoneNumber(phoneNumber)}
                style={{
                  width: '100%',
                  padding: '14px',
                  marginTop: '24px',
                  background: validatePhoneNumber(phoneNumber) && !isLoading
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#e0e0e0',
                  color: validatePhoneNumber(phoneNumber) && !isLoading
                    ? 'white'
                    : '#999',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: validatePhoneNumber(phoneNumber) && !isLoading
                    ? 'pointer'
                    : 'not-allowed',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (validatePhoneNumber(phoneNumber) && !isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Create Account'}
              </button>
              
              <div style={{
                marginTop: '24px',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#666'
                }}>
                  Already have an account?{' '}
                  <a
                    href="/sign-in"
                    style={{
                      color: '#667eea',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '8px',
                textAlign: 'center',
                color: '#333'
              }}>
                Verify Your Phone
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666',
                textAlign: 'center',
                marginBottom: '32px'
              }}>
                We sent a 6-digit code to {phoneNumber}
              </p>
              
              <VerificationInput
                value={verificationCode}
                onChange={setVerificationCode}
                onComplete={handleVerifyCode}
                disabled={isLoading}
                error={error}
              />
              
              <div style={{
                marginTop: '32px',
                textAlign: 'center'
              }}>
                <button
                  onClick={handleResendCode}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '8px'
                  }}
                >
                  Didn't receive the code? Send again
                </button>
              </div>
            </div>
          )}
          
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#666'
            }}>
              By continuing, you agree to Callabo's Terms of Service and Privacy Policy
            </p>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}