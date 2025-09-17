'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Clock, Building2, Mail, Calendar, MapPin } from 'lucide-react'

interface MeetingAcceptanceResponse {
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

export default function MeetingAcceptPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [response, setResponse] = useState<MeetingAcceptanceResponse | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setResponse({
        success: false,
        message: 'Invalid meeting response link. Please check your email for the correct link.',
        error: 'Missing token'
      })
      setLoading(false)
      return
    }

    // Auto-accept if this is a direct GET request (simple click)
    handleAcceptance()
  }, [token])

  const handleAcceptance = async (customMessage?: string) => {
    if (!token) return

    setSubmitting(true)
    
    try {
      const res = await fetch('/api/meetings/response/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          message: customMessage || message || 'Meeting accepted'
        }),
      })

      const data: MeetingAcceptanceResponse = await res.json()
      setResponse(data)
      
    } catch (error) {
      console.error('Error accepting meeting:', error)
      setResponse({
        success: false,
        message: 'An error occurred while processing your response. Please try again.',
        error: 'Network error'
      })
    } finally {
      setLoading(false)
      setSubmitting(false)
    }
  }

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (response?.success) return // Already accepted
    
    handleAcceptance(message)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Your Response</h2>
          <p className="text-gray-600">Please wait while we confirm your meeting acceptance...</p>
        </div>
      </div>
    )
  }

  if (!response) {
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

  if (response.expired) {
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

  if (!response.success) {
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

  // Success state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center mb-6">
          <div className="text-green-600 mb-4">
            <Check className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Accepted!</h1>
          <p className="text-gray-600">{response.message}</p>
        </div>

        {response.response && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">Meeting Details</h3>
              <div className="space-y-2 text-sm text-green-800">
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
                  <Check className="h-4 w-4 mr-2" />
                  <span>Responded on {new Date(response.response.respondedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {response.response.responseMessage && response.response.responseMessage !== 'Meeting accepted' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Your Message</h4>
                <p className="text-sm text-gray-700">{response.response.responseMessage}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• The Wolthers & Associates team has been notified of your acceptance</p>
                <p>• You will receive a calendar invitation with meeting details</p>
                <p>• If you need to make any changes, please contact us directly</p>
              </div>
            </div>
          </div>
        )}

        {!response.response?.responseMessage || response.response.responseMessage === 'Meeting accepted' ? (
          <form onSubmit={handleMessageSubmit} className="mt-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Add a message (optional)
            </label>
            <textarea
              id="message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Any additional notes or requirements for the meeting..."
              disabled={response.success}
            />
            
            {!response.success && (
              <button
                type="submit"
                disabled={submitting}
                className="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Update Response'}
              </button>
            )}
          </form>
        ) : null}

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-2">Need to contact us?</p>
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