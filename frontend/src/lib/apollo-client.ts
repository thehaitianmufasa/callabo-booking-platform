'use client';

import { ApolloClient, InMemoryCache, createHttpLink, from, ApolloLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL || 'http://localhost:8080/v1/graphql',
});

const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(createClient({
  url: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_WS_URL || 'ws://localhost:8080/v1/graphql',
  connectionParams: () => {
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id');
    
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'X-Hasura-Tenant-Id': tenantId || '',
      },
    };
  },
})) : null;

const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink,
    )
  : httpLink;

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'X-Hasura-Tenant-Id': tenantId || '',
      'X-Hasura-Role': 'user',
    }
  };
});

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        extensions
      );
      
      if (extensions?.code === 'invalid-jwt' || extensions?.code === 'access-denied') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('tenant_id');
          window.location.href = '/auth/login';
        }
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('tenant_id');
        window.location.href = '/auth/login';
      }
    }
  }
});

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        projects: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
        agents: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
        workflows: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
      },
    },
    Project: {
      fields: {
        agents: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
        workflows: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, splitLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  role: 'admin' | 'tenant_admin' | 'user';
}

export const getTenantContext = (): TenantContext | null => {
  if (typeof window === 'undefined') return null;
  
  const tenantId = localStorage.getItem('tenant_id');
  const tenantName = localStorage.getItem('tenant_name');
  const role = localStorage.getItem('user_role') as TenantContext['role'];
  
  if (!tenantId || !tenantName || !role) return null;
  
  return { tenantId, tenantName, role };
};

export const setTenantContext = (context: TenantContext) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('tenant_id', context.tenantId);
  localStorage.setItem('tenant_name', context.tenantName);
  localStorage.setItem('user_role', context.role);
};

export const clearTenantContext = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('tenant_id');
  localStorage.removeItem('tenant_name');
  localStorage.removeItem('user_role');
  localStorage.removeItem('auth_token');
};