'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import AuthCard from './AuthCard';
import PhoneInput from './PhoneInput';
import VerificationInput from './VerificationInput';
import StepIndicator from './StepIndicator';
import LoadingSpinner from './LoadingSpinner';

export default function PhoneAuth() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const formatPhoneForClerk = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    // Ensure we have exactly 10 digits for US number
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
    if (!isLoaded || !signIn) return;
    
    // Validate phone number first
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit US phone number');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formattedPhone = formatPhoneForClerk(phoneNumber);
      console.log('Attempting sign-in with phone:', formattedPhone);
      
      // First, try to create the sign-in session
      const signInAttempt = await signIn.create({
        identifier: formattedPhone,
      });
      
      console.log('Sign-in attempt created:', signInAttempt);
      
      // Check if we need to verify phone number
      if (signInAttempt.supportedFirstFactors) {
        const phoneCodeFactor = signInAttempt.supportedFirstFactors.find(
          (factor) => factor.strategy === 'phone_code'
        );
        
        if (phoneCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'phone_code',
          });
          
          setStep('verification');
          setAttemptCount(0);
        } else {
          setError('Phone verification not supported for this account.');
        }
      } else {
        setError('Unable to determine verification method for this phone number.');
      }
    } catch (err: any) {
      console.error('Full error object:', err);
      console.error('Error errors array:', err?.errors);
      console.error('Error message:', err?.message);
      
      if (err?.errors?.[0]?.code === 'form_identifier_not_found') {
        setError('This phone number is not registered. Please sign up first.');
      } else if (err?.errors?.[0]?.code === 'form_param_missing') {
        setError('Phone verification is not enabled. Please contact support.');
      } else if (err?.errors?.[0]?.message?.includes('missing')) {
        setError('Phone verification is not configured in Clerk dashboard.');
      } else if (err?.errors?.[0]?.message) {
        setError(err.errors[0].message);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Authentication error. Please try again or contact support.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    if (!isLoaded || !signIn) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const completeSignIn = await signIn.attemptFirstFactor({
        strategy: 'phone_code',
        code: code,
      });
      
      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
        router.push('/');
      } else {
        setError('Unable to complete sign in. Please try again.');
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

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
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
            Welcome to Callabo
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#666',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Enter your phone number to sign in
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
            {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Send Verification Code'}
          </button>
          
          <div style={{
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#666'
            }}>
              Don't have an account?{' '}
              <a
                href="/sign-up"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Sign up
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
  );
}