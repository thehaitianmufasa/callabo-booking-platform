'use client'

import { useAuth } from '@/components/AuthProvider'
import { useState } from 'react'

export default function DebugPage() {
  const { user, session } = useAuth()
  const [testResult, setTestResult] = useState('')

  const testAuth = async () => {
    try {
      const response = await fetch('/api/auth-test', {
        credentials: 'include'
      })
      const result = await response.json()
      setTestResult(JSON.stringify(result, null, 2))
    } catch (error) {
      setTestResult('Error: ' + error)
    }
  }

  const testCookies = () => {
    const cookies = document.cookie
    setTestResult('Browser cookies: ' + cookies)
  }

  const signOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.signOut()
      setTestResult('Signed out successfully')
      window.location.href = '/'
    } catch (error) {
      setTestResult('Sign out error: ' + error)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Auth State:</h2>
        <p>User ID: {user?.id || 'None'}</p>
        <p>Email: {user?.email || 'None'}</p>
        <p>Session exists: {session ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testAuth} style={{ marginRight: '10px', padding: '10px' }}>
          Test Auth API
        </button>
        <button onClick={testCookies} style={{ marginRight: '10px', padding: '10px' }}>
          Check Cookies
        </button>
        <button onClick={signOut} style={{ padding: '10px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px' }}>
          Sign Out
        </button>
      </div>

      <div>
        <h2>Test Result:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
          {testResult}
        </pre>
      </div>
    </div>
  )
}