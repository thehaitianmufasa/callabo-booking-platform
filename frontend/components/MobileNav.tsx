'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', icon: '🏠', label: 'Calendar' },
    { href: '/bookings', icon: '📋', label: 'Bookings' },
    { href: '/analytics', icon: '📊', label: 'Analytics' },
    { href: '/profile', icon: '👤', label: 'Profile' },
  ]
  
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #f0f0f0',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      backdropFilter: 'blur(10px)',
      zIndex: 50
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {navItems.map(item => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 12px',
                fontSize: '11px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                position: 'relative',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.color = '#667eea'
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.color = '#9ca3af'
                }
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '32px',
                  height: '3px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '0 0 2px 2px'
                }} />
              )}
              
              {/* Icon Container */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '6px',
                fontSize: '16px',
                background: isActive 
                  ? 'linear-gradient(135deg, #667eea20, #764ba220)' 
                  : 'transparent',
                border: isActive ? '2px solid #667eea40' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {item.icon}
              </div>
              
              {/* Label */}
              <span style={{
                color: isActive ? '#667eea' : '#9ca3af',
                transition: 'color 0.3s ease'
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}