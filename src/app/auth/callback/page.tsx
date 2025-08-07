'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { MicrosoftAuthProvider, trackLoginEvent } from '@/lib/microsoft-auth'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const processingRef = useRef(false)

  useEffect(() => {
    // Prevent multiple processing attempts
    if (processingRef.current) return
    processingRef.current = true

    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          router.push(`/?error=${encodeURIComponent(errorDescription || error)}`)
          return
        }

        if (code) {
          // Check if this is a Microsoft OAuth callback
          const storedMsAuth = sessionStorage.getItem('microsoftAuthProvider')
          
          if (storedMsAuth) {
            // Handle Microsoft OAuth callback
            const msConfig = JSON.parse(storedMsAuth)
            const msAuthProvider = new MicrosoftAuthProvider(msConfig)
            
            const result = await msAuthProvider.handleCallback(code)
            
            if (result.success && result.user) {
              console.log('Successfully authenticated Microsoft user:', result.user.email)
              
              // Store session token in localStorage for client-side access
              if (result.sessionToken) {
                localStorage.setItem('auth-token', result.sessionToken)
              }
              
              // Track the login event
              await trackLoginEvent(result.user.id, 'microsoft', result.user.email)
              
              // Clear stored config
              sessionStorage.removeItem('microsoftAuthProvider')
              
              router.push('/dashboard')
              return
            } else {
              console.error('Microsoft auth failed:', result.error)
              sessionStorage.removeItem('microsoftAuthProvider')
              router.push(`/?error=${encodeURIComponent(result.error || 'Microsoft authentication failed')}`)
              return
            }
          }

          // Handle regular Supabase OAuth callback
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Error exchanging code for session:', error)
            router.push(`/?error=${encodeURIComponent(error.message)}`)
            return
          }

          if (data.session) {
            console.log('Successfully authenticated user:', data.session.user.email)
            
            // Track the login event for regular auth
            await trackLoginEvent(data.session.user.id, 'email', data.session.user.email || '')
            
            router.push('/dashboard')
            return
          }
        }

        // If no code and no error, check if there's a session already
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          router.push('/dashboard')
        } else {
          router.push('/')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        router.push('/?error=Authentication failed')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-pearl-50 dark:from-[#0E3D2F] dark:via-[#1A4B3A] dark:to-[#0E3D2F]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-pearl-700 dark:text-pearl-300">
          Completing sign in...
        </h2>
        <p className="text-sm text-pearl-500 dark:text-pearl-400 mt-2">
          Please wait while we redirect you.
        </p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-pearl-50 dark:from-[#0E3D2F] dark:via-[#1A4B3A] dark:to-[#0E3D2F]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-pearl-700 dark:text-pearl-300">
            Loading...
          </h2>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}