import { Inter } from 'next/font/google'
import './globals.css'
import MobileNav from '@/components/MobileNav'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  )
}