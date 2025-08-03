'use client';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './apollo-client';
import { ReactNode } from 'react';

interface ApolloWrapperProps {
  children: ReactNode;
}

export function ApolloWrapper({ children }: ApolloWrapperProps) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}