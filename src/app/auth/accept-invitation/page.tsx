'use client'

import { useEffect, useRef, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const processingRef = useRef(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'error'>('loading')
  const [invitation, setInvitation] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Prevent multiple processing attempts
    if (processingRef.current) return
    processingRef.current = true

    const handleInvitationAcceptance = async () => {
      try {
        const token = searchParams.get('token')
        
        if (!token) {
          setStatus('error')
          setErrorMessage('Invalid invitation link - missing token')
          return
        }

        console.log('🔍 Processing invitation token:', token.substring(0, 10) + '...')

        // Validate invitation token with our API
        const response = await fetch(`/api/user-invitations/accept?token=${token}`, {
          method: 'GET',
          credentials: 'include'
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('❌ Invitation validation failed:', result.error)
          
          if (response.status === 404) {
            setStatus('expired')
            setErrorMessage('This invitation link is invalid or has expired')
          } else if (response.status === 409) {
            setStatus('error')
            setErrorMessage('An account with this email already exists')
          } else {
            setStatus('error')
            setErrorMessage(result.error || 'Failed to validate invitation')
          }
          return
        }

        console.log('✅ Invitation validated successfully')
        setInvitation(result.invitation)
        setStatus('success')

        // Redirect to registration with invitation data after a brief display
        setTimeout(() => {
          const params = new URLSearchParams({
            token: token,
            email: result.invitation.email,
            name: result.invitation.invited_name || '',
            whatsapp: result.invitation.invited_whatsapp || '',
            company: result.invitation.company_name,
            role: result.invitation.role
          })
          
          router.push(`/auth/register?${params.toString()}`)
        }, 2000)

      } catch (error) {
        console.error('❌ Error processing invitation:', error)
        setStatus('error')
        setErrorMessage('An unexpected error occurred while processing your invitation')
      }
    }

    handleInvitationAcceptance()
  }, [router, searchParams])

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-pearl-700 dark:text-pearl-300">
              Validating your invitation...
            </h2>
            <p className="text-sm text-pearl-500 dark:text-pearl-400 mt-2">
              Please wait while we process your invitation.
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-pearl-700 dark:text-pearl-300 mb-2">
              Invitation Validated Successfully!
            </h2>
            {invitation && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  <strong>Company:</strong> {invitation.company_name}<br/>
                  <strong>Role:</strong> {invitation.role}<br/>
                  <strong>Email:</strong> {invitation.email}
                </p>
              </div>
            )}
            <p className="text-sm text-pearl-500 dark:text-pearl-400">
              Redirecting you to complete your account setup...
            </p>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-pearl-700 dark:text-pearl-300 mb-2">
              Invitation Expired
            </h2>
            <p className="text-sm text-pearl-500 dark:text-pearl-400 mb-4">
              {errorMessage}
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Return to Login
            </button>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-pearl-700 dark:text-pearl-300 mb-2">
              Unable to Process Invitation
            </h2>
            <p className="text-sm text-pearl-500 dark:text-pearl-400 mb-4">
              {errorMessage}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Return to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-pearl-300 dark:border-pearl-600 hover:bg-pearl-50 dark:hover:bg-pearl-800 text-pearl-700 dark:text-pearl-300 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-pearl-50 dark:from-[#0E3D2F] dark:via-[#1A4B3A] dark:to-[#0E3D2F]">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-pearl-800 rounded-lg shadow-xl p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitation() {
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
      <AcceptInvitationContent />
    </Suspense>
  )
}