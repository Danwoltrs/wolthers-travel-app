'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { X, Clock, Building2, Mail, Calendar, MessageSquare } from 'lucide-react'

interface MeetingDeclineResponse {
  success: boolean
  message: string
  response?: {
    id: string
    type: string
    hostName: string
    companyName: string
    meetingTitle: string
    originalDate: string
    originalTime: string
    responseMessage: string
    respondedAt: string
  }
  previousResponse?: {
    type: string
    respondedAt: string
  }
  error?: string
  expired?: boolean
}

function MeetingDeclineContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<MeetingDeclineResponse | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(true)

  useEffect(() => {
    if (!token) {
      setResponse({
        success: false,
        message: 'Invalid meeting response link. Please check your email for the correct link.',
        error: 'Missing token'
      })
      setShowForm(false)
      return
    }
  }, [token])

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setSubmitting(true)
    
    try {
      const res = await fetch('/api/meetings/response/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          message: message || 'Meeting declined'
        }),
      })

      const data: MeetingDeclineResponse = await res.json()
      setResponse(data)
      setShowForm(false)
      
    } catch (error) {
      console.error('Error declining meeting:', error)
      setResponse({
        success: false,
        message: 'An error occurred while processing your response. Please try again.',
        error: 'Network error'
      })
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Response</h2>
          <p className="text-gray-600">Please wait while we record your decision...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-red-600 mb-4">
            <Mail className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600">This meeting response link is not valid. Please check your email for the correct link.</p>
        </div>
      </div>
    )
  }

  if (response?.expired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-orange-600 mb-4">
            <Clock className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Expired</h2>
          <p className="text-gray-600 mb-4">This meeting response link has expired. Please contact Wolthers & Associates directly to respond to the meeting invitation.</p>
          <a 
            href="mailto:trips@trips.wolthers.com" 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Us
          </a>
        </div>
      </div>
    )
  }

  if (response && !response.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-red-600 mb-4">
            <Mail className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{response.message}</p>
          
          {response.previousResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Previous Response:</strong> You {response.previousResponse.type}ed this meeting on {new Date(response.previousResponse.respondedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          
          <a 
            href="mailto:trips@trips.wolthers.com" 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Us
          </a>
        </div>
      </div>
    )
  }

  if (response && response.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-6">
            <div className="text-orange-600 mb-4">
              <X className="h-16 w-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Declined</h1>
            <p className="text-gray-600">{response.message}</p>
          </div>

          {response.response && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-3">Meeting Details</h3>
                <div className="space-y-2 text-sm text-orange-800">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span><strong>{response.response.meetingTitle}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{response.response.originalDate} at {response.response.originalTime}</span>
                  </div>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    <span>{response.response.companyName}</span>
                  </div>
                  <div className="flex items-center">
                    <X className="h-4 w-4 mr-2" />
                    <span>Declined on {new Date(response.response.respondedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {response.response.responseMessage && response.response.responseMessage !== 'Meeting declined' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Your Message
                  </h4>
                  <p className="text-sm text-gray-700">{response.response.responseMessage}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• The Wolthers & Associates team has been notified of your decision</p>
                  <p>• We respect your availability and understand</p>
                  <p>• We may reach out to explore alternative meeting opportunities in the future</p>
                  <p>• If you change your mind or would like to reschedule, please contact us directly</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Changed your mind or want to suggest an alternative?</p>
            <a 
              href="mailto:trips@trips.wolthers.com" 
              className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
            >
              <Mail className="h-4 w-4 mr-1" />
              trips@trips.wolthers.com
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Show decline form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center mb-6">
          <div className="text-orange-600 mb-4">
            <X className="h-12 w-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Decline Meeting</h1>
          <p className="text-gray-600">We understand that schedules can be challenging. Please let us know if you'd like to share any additional information.</p>
        </div>

        <form onSubmit={handleDecline} className="space-y-6">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message (optional)
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Let us know if you'd prefer a different time, have scheduling conflicts, or any other information that might help us understand your availability..."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start">
              <MessageSquare className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Would you prefer a different time?</p>
                <p>If you're interested in the meeting but the current time doesn't work, consider using the "Request Different Time" option instead, or mention alternative times in your message above.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Decline Meeting
                </>
              )}
            </button>
            
            <a
              href={`/meeting/response/reschedule?token=${token}`}
              className="flex-1 flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Clock className="h-4 w-4 mr-2" />
              Request Different Time
            </a>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-2">Questions or concerns?</p>
          <a 
            href="mailto:trips@trips.wolthers.com" 
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            <Mail className="h-4 w-4 mr-1" />
            trips@trips.wolthers.com
          </a>
        </div>
      </div>
    </div>
  )
}

export default function MeetingDeclinePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading</h2>
          <p className="text-gray-600">Preparing meeting response...</p>
        </div>
      </div>
    }>
      <MeetingDeclineContent />
    </Suspense>
  )
}