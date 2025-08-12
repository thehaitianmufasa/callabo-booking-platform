'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function LinkAccount() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [linked, setLinked] = useState(false)
  const [clerkId, setClerkId] = useState('')
  const [unclaimed, setUnclaimed] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      checkAccount()
    }
  }, [user])

  const checkAccount = async () => {
    try {
      const res = await fetch('/api/link-account')
      const data = await res.json()
      
      setClerkId(data.clerkUserId)
      
      if (data.message === 'Account already linked') {
        setLinked(true)
      } else {
        setUnclaimed(data.unclaimedAccounts || [])
      }
    } catch (error) {
      console.error('Error checking account:', error)
    } finally {
      setLoading(false)
    }
  }

  const linkAccount = async (investorId: string) => {
    try {
      const res = await fetch('/api/link-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investorId })
      })
      
      const data = await res.json()
      
      if (data.success) {
        alert(`Success! Linked to ${data.investor.name} with ${data.bookings.length} existing bookings`)
        router.push('/')
      } else {
        alert(data.error || 'Failed to link account')
      }
    } catch (error) {
      console.error('Error linking account:', error)
      alert('Failed to link account')
    }
  }

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Please sign in first</h2>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Checking account status...</h2>
      </div>
    )
  }

  if (linked) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>✅ Your account is already linked!</h2>
        <p>Clerk ID: {clerkId}</p>
        <button onClick={() => router.push('/')} style={{
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px'
        }}>
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Link Your Account to Existing Data</h2>
      <p>Your Clerk ID: <code>{clerkId}</code></p>
      
      <h3>Available Accounts to Claim:</h3>
      {unclaimed.length === 0 ? (
        <p>No unclaimed accounts available. A new account will be created for you.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
          {unclaimed.map((investor) => (
            <div key={investor.id} style={{
              border: '1px solid #ddd',
              padding: '15px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>{investor.name}</strong><br />
                {investor.email}<br />
                <small>Nights used: {investor.nights_used}/3</small>
              </div>
              <button 
                onClick={() => linkAccount(investor.id)}
                style={{
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Claim This Account
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}