'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Calendar, Building, MapPin, Check, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Force dynamic rendering to avoid prerender issues with useSearchParams
export const dynamic = 'force-dynamic'

interface InvitationDetails {
  id: string
  guest_name: string
  guest_email: string
  guest_company?: string
  guest_title?: string
  trip_title: string
  trip_start_date: string
  trip_end_date: string
  invited_by_name: string
  invitation_message?: string
  expires_at: string
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  // Validate and fetch invitation details
  useEffect(() => {
    async function validateInvitation() {
      if (!token) {
        setError('No invitation token provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/guests/accept?token=${token}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Invalid invitation')
        }

        setInvitation(result.invitation)
      } catch (error) {
        console.error('Failed to validate invitation:', error)
        setError(error instanceof Error ? error.message : 'Failed to validate invitation')
      } finally {
        setLoading(false)
      }
    }

    validateInvitation()
  }, [token])

  const handleAcceptInvitation = async () => {
    if (!token) return

    setAccepting(true)
    setError(null)

    try {
      const response = await fetch('/api/guests/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept invitation')
      }

      setSuccess(true)
      setRedirectUrl(result.redirect_url)

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        if (result.redirect_url) {
          window.location.href = result.redirect_url
        }
      }, 3000)

    } catch (error) {
      console.error('Failed to accept invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Invitation Accepted!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You've successfully joined the trip. You'll be redirected to the trip details shortly.
          </p>
          {redirectUrl && (
            <Button
              onClick={() => window.location.href = redirectUrl}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              View Trip Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600 dark:text-gray-300">No invitation found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-2xl w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-white text-center">
          <img 
            src="https://wolthers.com/images/wolthers-logo-white.png" 
            alt="Wolthers Associates" 
            className="w-40 h-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold mb-2">You're Invited!</h1>
          <p className="text-emerald-100">
            {invitation.invited_by_name} has invited you to join an upcoming trip
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          
          {/* Guest Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Invitation Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{invitation.guest_name}</span>
                <span className="text-gray-500">({invitation.guest_email})</span>
              </div>
              {invitation.guest_company && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {invitation.guest_title ? `${invitation.guest_title}, ` : ''}{invitation.guest_company}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Trip Details */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {invitation.trip_title}
            </h2>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Travel Dates</div>
                <div className="text-gray-600 dark:text-gray-300">
                  {formatDate(invitation.trip_start_date)} - {formatDate(invitation.trip_end_date)}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Message */}
          {invitation.invitation_message && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Message from {invitation.invited_by_name}:
              </h3>
              <p className="text-gray-700 dark:text-gray-300 italic">
                "{invitation.invitation_message}"
              </p>
            </div>
          )}

          {/* Expiration Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1"
              disabled={accepting}
            >
              Go Back
            </Button>
            <Button
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {accepting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading invitation...</p>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}