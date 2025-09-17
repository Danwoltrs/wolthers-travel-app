'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Clock, Calendar, Building2, Mail, MapPin, MessageSquare, RefreshCw, Check } from 'lucide-react'

interface MeetingInfo {
  title: string
  originalDate: string
  originalTime: string
  location?: string
  description?: string
  duration?: string
}

interface HostInfo {
  email: string
  companyName: string
}

interface MeetingRescheduleResponse {
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
    requestedDate?: string
    requestedTime?: string
    responseMessage: string
    respondedAt: string
  }
  meeting?: MeetingInfo
  host?: HostInfo
  token?: string
  error?: string
  expired?: boolean
}

export default function MeetingReschedulePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [response, setResponse] = useState<MeetingRescheduleResponse | null>(null)
  const [message, setMessage] = useState('')
  const [requestedDate, setRequestedDate] = useState('')
  const [requestedTime, setRequestedTime] = useState('')
  const [showForm, setShowForm] = useState(true)

  useEffect(() => {
    if (!token) {
      setResponse({
        success: false,
        message: 'Invalid meeting response link. Please check your email for the correct link.',
        error: 'Missing token'
      })
      setLoading(false)
      setShowForm(false)
      return
    }

    // Fetch meeting information for the reschedule form
    fetchMeetingInfo()
  }, [token])

  const fetchMeetingInfo = async () => {
    try {
      const res = await fetch(`/api/meetings/response/reschedule?token=${token}`)
      const data: MeetingRescheduleResponse = await res.json()
      setResponse(data)
      
      if (!data.success) {
        setShowForm(false)
      }
    } catch (error) {
      console.error('Error fetching meeting info:', error)
      setResponse({
        success: false,
        message: 'Failed to load meeting information. Please try again.',
        error: 'Network error'
      })
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setSubmitting(true)
    
    try {
      const res = await fetch('/api/meetings/response/reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          message: message || 'Meeting reschedule requested',
          requestedDate: requestedDate || null,
          requestedTime: requestedTime || null
        }),
      })

      const data: MeetingRescheduleResponse = await res.json()
      setResponse(data)
      setShowForm(false)
      
    } catch (error) {
      console.error('Error requesting reschedule:', error)
      setResponse({
        success: false,
        message: 'An error occurred while processing your reschedule request. Please try again.',
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Meeting Information</h2>
          <p className="text-gray-600">Please wait while we load the meeting details...</p>
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
          <p className="text-gray-600 mb-4">This meeting response link has expired. Please contact Wolthers & Associates directly to request a reschedule.</p>
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

  if (response && !response.success && !showForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-red-600 mb-4">
            <Mail className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{response.message}</p>
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

  if (response && response.success && response.response) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-6">
            <div className="text-green-600 mb-4">
              <Check className="h-16 w-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reschedule Request Submitted</h1>
            <p className="text-gray-600">{response.message}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Original Meeting</h3>
              <div className="space-y-2 text-sm text-blue-800">
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
              </div>
            </div>

            {(response.response.requestedDate || response.response.requestedTime) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Your Requested Time
                </h4>
                <div className="text-sm text-green-800 space-y-1">
                  {response.response.requestedDate && (
                    <p><strong>Preferred Date:</strong> {response.response.requestedDate}</p>
                  )}
                  {response.response.requestedTime && (
                    <p><strong>Preferred Time:</strong> {response.response.requestedTime}</p>
                  )}
                </div>
              </div>
            )}

            {response.response.responseMessage && response.response.responseMessage !== 'Meeting reschedule requested' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Your Message
                </h4>
                <p className="text-sm text-gray-700">{response.response.responseMessage}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">What's Next?</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• The Wolthers & Associates team has received your reschedule request</p>
                <p>• We will review our schedules and your preferred times</p>
                <p>• Our team will contact you within 1-2 business days with alternative options</p>
                <p>• We'll work together to find a time that works for everyone</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Need immediate assistance or have urgent schedule changes?</p>
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

  // Show reschedule form
  const meeting = response?.meeting
  const host = response?.host

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center mb-6">
          <div className="text-blue-600 mb-4">
            <RefreshCw className="h-12 w-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Different Time</h1>
          <p className="text-gray-600">Let us know when you'd prefer to meet and we'll do our best to accommodate your schedule.</p>
        </div>

        {meeting && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Current Meeting Details
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Meeting:</strong> {meeting.title}</p>
              <p><strong>Currently Scheduled:</strong> {meeting.originalDate}{meeting.originalTime && ` at ${meeting.originalTime}`}</p>
              {meeting.location && <p><strong>Location:</strong> {meeting.location}</p>}
              {meeting.duration && <p><strong>Duration:</strong> {meeting.duration}</p>}
              {meeting.description && <p><strong>Description:</strong> {meeting.description}</p>}
            </div>
          </div>
        )}

        <form onSubmit={handleReschedule} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="requestedDate" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date (optional)
              </label>
              <input
                type="date"
                id="requestedDate"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Today or later
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="requestedTime" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time (optional)
              </label>
              <input
                type="time"
                id="requestedTime"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please let us know your preferred times, any scheduling constraints, or other details that would help us find a suitable alternative..."
            />
            <p className="mt-1 text-xs text-gray-500">Please provide some details about your scheduling preferences or constraints</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Helpful Information to Include:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Your general availability (e.g., "mornings work better" or "weekdays only")</li>
                  <li>Time zone if different from the original meeting</li>
                  <li>Any recurring conflicts (e.g., "Tuesdays are difficult")</li>
                  <li>How flexible your schedule is</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting Request...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Submit Reschedule Request
                </>
              )}
            </button>
            
            <a
              href={`/meeting/response/decline?token=${token}`}
              className="flex-1 flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Clock className="h-4 w-4 mr-2" />
              Decline Instead
            </a>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-2">Questions about the meeting or need immediate assistance?</p>
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