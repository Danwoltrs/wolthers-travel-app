'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { useEffect, useState } from 'react'

export default function AuthDebug() {
  const { isAuthenticated, session, user, isLoading } = useAuth()
  const [sessionDetails, setSessionDetails] = useState<any>(null)
  
  useEffect(() => {
    // Get detailed session information
    const getSessionDetails = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('AuthDebug: Current session:', session)
      console.log('AuthDebug: Session error:', error)
      setSessionDetails({ session, error })
    }
    
    getSessionDetails()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User: {user?.email || 'None'}</div>
        <div>Role: {user?.role || 'None'}</div>
        <div>Session: {session ? 'Active' : 'None'}</div>
        <div>User ID: {user?.id || 'None'}</div>
        {sessionDetails && (
          <>
            <div>Session Valid: {sessionDetails.session ? 'Yes' : 'No'}</div>
            <div>Session Error: {sessionDetails.error ? 'Yes' : 'No'}</div>
          </>
        )}
      </div>
    </div>
  )
}