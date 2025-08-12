'use client';

import Image from 'next/image';

interface AuthCardProps {
  children: React.ReactNode;
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '440px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
        }}
      />
      
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px'
        }}
      >
        <div
          style={{
            width: '120px',
            height: '120px',
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Image
            src="/callabo-logo.jpg"
            alt="Callabo"
            width={80}
            height={80}
            style={{
              objectFit: 'contain'
            }}
            priority
          />
        </div>
      </div>
      
      {children}
      
      <style jsx global>{`
        @media (max-width: 480px) {
          div[style*="maxWidth: '440px'"] {
            margin: 0 16px;
          }
        }
      `}</style>
    </div>
  );
}