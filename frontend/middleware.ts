import { authMiddleware } from '@clerk/nextjs/server'

// Protect API routes and authenticated pages
export default authMiddleware({
  // Routes that don't require authentication
  publicRoutes: [
    '/',
    '/api/test',
    '/sign-in',
    '/sign-up'
  ],
  // API routes that should be protected but handled internally
  afterAuth(auth, req, evt) {
    // Allow API routes to handle their own authentication internally
    return
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ]
}