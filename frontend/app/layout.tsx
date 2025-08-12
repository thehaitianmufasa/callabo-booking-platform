import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import MobileNav from '@/components/MobileNav'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#667eea',
          colorBackground: '#ffffff',
          colorText: '#333333',
          colorTextOnPrimaryBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#333333',
          borderRadius: '12px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
      signInFallbackRedirectUrl="/sign-in"
      signUpFallbackRedirectUrl="/sign-up"
    >
      <html lang="en">
        <body className={inter.className} style={{margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
          <div style={{
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#333'
          }}>
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '20px 20px 100px 20px'
            }}>
              {children}
            </div>
            <MobileNav />
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}