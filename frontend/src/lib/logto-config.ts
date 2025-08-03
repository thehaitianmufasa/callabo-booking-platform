/**
 * Logto Configuration for Next.js Frontend
 * TypeScript version with proper types to avoid compilation issues
 */

export interface UserInfo {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  organizations?: Organization[];
  roles?: string[];
  custom_data?: {
    tenant_id?: string;
    role?: string;
    permissions?: string[];
  };
}

export interface Organization {
  id: string;
  name: string;
  role: 'admin' | 'tenant_admin' | 'user';
  permissions?: string[];
}

// Configuration for Next.js server-side authentication
export const logtoConfig = {
  endpoint: process.env.LOGTO_ENDPOINT || 'https://vopm4n.logto.app',
  appId: process.env.LOGTO_APP_ID || 'us8q2jalxcnqmic1ag6go',
  appSecret: process.env.LOGTO_APP_SECRETS || process.env.LOGTO_APP_SECRET,
  baseUrl: process.env.LOGTO_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  cookieSecret: process.env.LOGTO_COOKIE_SECRET || 'default-cookie-secret',
  cookieSecure: process.env.NODE_ENV === 'production',
  
  // Multi-tenant and role-based access control scopes
  scopes: [
    'openid',
    'profile',
    'email',
    'organizations',
    'roles',
  ],
  
  // Resource indicators for API access
  resources: [
    'https://api.callabo-platform.com',
  ],
};

// Configuration for React client-side authentication
export const reactLogtoConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || process.env.LOGTO_ENDPOINT || 'https://vopm4n.logto.app',
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID || process.env.LOGTO_APP_ID || 'us8q2jalxcnqmic1ag6go',
  
  // Multi-tenant and role-based access control scopes
  scopes: [
    'openid',
    'profile',
    'email',
    'organizations',
    'roles',
  ],
  
  // Resource indicators for API access
  resources: [
    'https://api.callabo-platform.com',
  ],
};

// JWT claims generator for Hasura integration
export function generateHasuraJWT(userInfo: UserInfo, organizationId?: string): Record<string, any> {
  const currentOrg = organizationId 
    ? userInfo.organizations?.find(org => org.id === organizationId)
    : userInfo.organizations?.[0];

  const hasuraClaims = {
    'https://hasura.io/jwt/claims': {
      'x-hasura-default-role': currentOrg?.role || 'user',
      'x-hasura-allowed-roles': userInfo.roles || ['user'],
      'x-hasura-user-id': userInfo.sub,
      'x-hasura-tenant-id': organizationId || currentOrg?.id || '',
      ...(userInfo.custom_data && {
        'x-hasura-custom-data': JSON.stringify(userInfo.custom_data)
      })
    }
  };

  return {
    ...userInfo,
    ...hasuraClaims
  };
}

// Role hierarchy for access control
export const ROLE_HIERARCHY: Record<string, string[]> = {
  'admin': ['admin', 'tenant_admin', 'user'],
  'tenant_admin': ['tenant_admin', 'user'], 
  'user': ['user']
};

export function hasRole(userRole: string, requiredRole: string): boolean {
  const allowedRoles = ROLE_HIERARCHY[userRole];
  return allowedRoles?.includes(requiredRole) || false;
}

// Organization access validation
export function hasOrganizationAccess(userOrgs: Organization[], orgId: string): boolean {
  return userOrgs.some(org => org.id === orgId);
}

// Permission checking utilities
export function hasPermission(userInfo: UserInfo, permission: string, orgId?: string): boolean {
  if (orgId) {
    const org = userInfo.organizations?.find(o => o.id === orgId);
    return org?.permissions?.includes(permission) || false;
  }
  return userInfo.custom_data?.permissions?.includes(permission) || false;
}