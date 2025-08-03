'use client';

import { LogtoProvider } from '@logto/react';
import { ReactNode } from 'react';
import { reactLogtoConfig } from './logto-config';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <LogtoProvider config={reactLogtoConfig}>
      {children}
    </LogtoProvider>
  );
}