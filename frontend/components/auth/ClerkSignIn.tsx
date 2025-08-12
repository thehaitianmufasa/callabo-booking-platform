'use client';

import { SignIn } from '@clerk/nextjs';

export default function ClerkSignIn() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: 'white',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.15)'
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
        
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-none bg-transparent",
              headerTitle: "text-2xl font-semibold text-gray-800",
              headerSubtitle: "text-gray-600",
              socialButtonsBlockButton: "bg-white border-2 border-gray-200 hover:border-purple-400 text-gray-700",
              formButtonPrimary: "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg",
              footerActionLink: "text-purple-600 hover:text-purple-700",
              formFieldInput: "border-2 border-gray-200 focus:border-purple-400 rounded-lg",
              identityPreviewEditButton: "text-purple-600",
              otpCodeFieldInput: "border-2 border-gray-200 focus:border-purple-400 rounded-lg"
            },
            variables: {
              colorPrimary: '#667eea',
              colorBackground: 'transparent',
              colorText: '#333333',
              colorTextOnPrimaryBackground: '#ffffff',
              colorInputBackground: '#ffffff',
              colorInputText: '#333333',
              borderRadius: '12px'
            }
          }}
          redirectUrl="/"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}