'use client';

import { useClerk } from '@clerk/nextjs';

export default function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut()}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '10px 20px',
        background: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 1000
      }}
    >
      Sign Out (Test Auth Flow)
    </button>
  );
}