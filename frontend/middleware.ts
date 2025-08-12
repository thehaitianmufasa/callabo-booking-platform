import { authMiddleware } from '@clerk/nextjs/server'

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: ["/", "/api/test"],
  
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    "/((?!api|trpc))(_next.*|.+\\.[\\w]+$)",
    "/api/test"
  ]
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ]
}