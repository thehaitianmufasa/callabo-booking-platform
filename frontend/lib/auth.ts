import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return userId;
}

export function getRedirectUrl(searchParams: URLSearchParams): string {
  const redirectTo = searchParams.get('redirect_to');
  
  const validPaths = [
    '/',
    '/bookings',
    '/bookings/new',
    '/analytics',
    '/profile'
  ];
  
  if (redirectTo && validPaths.some(path => redirectTo.startsWith(path))) {
    return redirectTo;
  }
  
  return '/';
}