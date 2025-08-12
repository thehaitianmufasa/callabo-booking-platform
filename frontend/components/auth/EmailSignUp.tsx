'use client';

import { SignUp } from '@clerk/nextjs';
import AuthCard from './AuthCard';

export default function EmailSignUp() {
  return (
    <div>
      {/* Logo */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '32px'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: 'white',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src="/callabo-logo.jpg"
            alt="Callabo"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain'
            }}
          />
        </div>
      </div>

      <SignUp 
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border-none bg-transparent p-0",
            headerTitle: "text-2xl font-semibold text-gray-800 text-center mb-2",
            headerSubtitle: "text-sm text-gray-600 text-center mb-8",
            socialButtonsBlockButton: "bg-gray-50 border-2 border-gray-200 hover:border-purple-400 text-gray-700 rounded-xl py-3 font-medium",
            formButtonPrimary: "w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-300",
            footerActionLink: "text-purple-600 hover:text-purple-700 font-medium",
            formFieldInput: "w-full py-3.5 px-4 border-2 border-gray-200 focus:border-purple-400 rounded-xl text-base transition-colors",
            formFieldLabel: "text-sm font-medium text-gray-700 mb-2",
            identityPreviewEditButton: "text-purple-600 hover:text-purple-700",
            otpCodeFieldInput: "w-12 h-14 text-center text-xl font-semibold border-2 border-gray-200 focus:border-purple-400 rounded-xl mx-1 transition-colors",
            dividerLine: "bg-gray-200",
            dividerText: "text-gray-500 text-sm",
            formResendCodeLink: "text-purple-600 hover:text-purple-700 text-sm underline",
            alertCloseButton: "text-gray-400 hover:text-gray-600"
          },
          variables: {
            colorPrimary: '#667eea',
            colorBackground: 'white',
            colorText: '#333333',
            colorTextOnPrimaryBackground: '#ffffff',
            colorInputBackground: '#ffffff',
            colorInputText: '#333333',
            colorTextSecondary: '#666666',
            borderRadius: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }
        }}
        redirectUrl="/"
        signInUrl="/sign-in"
      />
      
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
    </div>
  );
}