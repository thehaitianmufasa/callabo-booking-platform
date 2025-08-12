import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/sign-in',
    '/sign-up',
    '/api/webhooks/(.*)',
  ],
  // Redirect unauthenticated users to our custom sign-in page
  afterAuth(auth, req) {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      return Response.redirect(new URL('/sign-in', req.url));
    }
    // If user is signed in and trying to access auth pages, redirect to home
    if (auth.userId && ['/sign-in', '/sign-up'].includes(req.nextUrl.pathname)) {
      return Response.redirect(new URL('/', req.url));
    }
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};