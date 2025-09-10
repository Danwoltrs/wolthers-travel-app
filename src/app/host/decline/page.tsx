'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calendar, Clock, MessageCircle, Send, ArrowLeft, CheckCircle } from 'lucide-react'

function HostDeclineContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [tripDetails, setTripDetails] = useState<any>(null)
  
  // Form data
  const [declineReason, setDeclineReason] = useState('')
  const [hasAlternative, setHasAlternative] = useState(false)
  const [alternativeDate, setAlternativeDate] = useState('')
  const [alternativeTime, setAlternativeTime] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  
  const searchParams = useSearchParams()
  const tripCode = searchParams.get('tripCode')
  const hostEmail = searchParams.get('hostEmail')
  const token = searchParams.get('token')

  useEffect(() => {
    if (tripCode && hostEmail && token) {
      fetchTripDetails()
    }
  }, [tripCode, hostEmail, token])

  const fetchTripDetails = async () => {
    try {
      const response = await fetch(`/api/visits/trip-details?tripCode=${tripCode}&hostEmail=${encodeURIComponent(hostEmail || '')}&token=${token}`)
      if (response.ok) {
        const data = await response.json()
        setTripDetails(data)
      }
    } catch (err) {
      console.error('Failed to fetch trip details:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!declineReason.trim()) {
      setError('Please select a reason for declining')
      return
    }

    if (hasAlternative && (!alternativeDate || !alternativeTime)) {
      setError('Please provide both alternative date and time')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/visits/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripCode,
          hostEmail,
          token,
          declineReason,
          hasAlternative,
          alternativeDate,
          alternativeTime,
          additionalNotes
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        setError(data.error || 'Failed to submit response')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Response Submitted
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your response. {hasAlternative 
              ? 'The trip organizer will review your alternative date suggestion and get back to you.' 
              : 'We understand and appreciate your prompt response.'}
          </p>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              <strong>Wolthers & Associates Travel Team</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Visit Confirmation Response</h1>
          <p className="text-red-100">We understand scheduling can be challenging</p>
        </div>

        {/* Trip Details */}
        {tripDetails && (
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Visit Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Trip:</span>
                <p className="font-medium">{tripDetails.title}</p>
              </div>
              <div>
                <span className="text-gray-600">Visiting Company:</span>
                <p className="font-medium">{tripDetails.visitingCompany || 'Our Team'}</p>
              </div>
              <div>
                <span className="text-gray-600">Requested Date:</span>
                <p className="font-medium">{new Date(tripDetails.visitDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-600">Requested Time:</span>
                <p className="font-medium">{tripDetails.visitTime}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Decline Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Reason for declining (required)
            </label>
            <div className="space-y-2">
              {[
                'Schedule conflict',
                'Facility unavailable',
                'Insufficient notice',
                'Other commitments',
                'Other (please specify in notes)'
              ].map((reason) => (
                <label key={reason} className="flex items-center">
                  <input
                    type="radio"
                    name="declineReason"
                    value={reason}
                    checked={declineReason === reason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="mr-3 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Alternative Date Option */}
          <div className="mb-6">
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={hasAlternative}
                onChange={(e) => setHasAlternative(e.target.checked)}
                className="mr-3 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">
                I can suggest an alternative date/time
              </span>
            </label>

            {hasAlternative && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternative Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={alternativeDate}
                      onChange={(e) => setAlternativeDate(e.target.value)}
                      style={{ paddingLeft: '36px' }}
                      className="w-full pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternative Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={alternativeTime}
                      onChange={(e) => setAlternativeTime(e.target.value)}
                      style={{ paddingLeft: '36px' }}
                      className="w-full pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Select preferred time</option>
                      <option value="Early Morning (8:00 AM - 10:00 AM)">Early Morning (8:00 AM - 10:00 AM)</option>
                      <option value="Morning (10:00 AM - 12:00 PM)">Morning (10:00 AM - 12:00 PM)</option>
                      <option value="Early Afternoon (12:00 PM - 2:00 PM)">Early Afternoon (12:00 PM - 2:00 PM)</option>
                      <option value="Afternoon (2:00 PM - 4:00 PM)">Afternoon (2:00 PM - 4:00 PM)</option>
                      <option value="Late Afternoon (4:00 PM - 6:00 PM)">Late Afternoon (4:00 PM - 6:00 PM)</option>
                      <option value="Full Day">Full Day</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                style={{ paddingLeft: '36px' }}
                className="w-full pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                placeholder="Any additional information or constraints..."
                maxLength={500}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{additionalNotes.length}/500 characters</p>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Response</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function HostDeclinePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-pulse bg-white rounded-2xl shadow-xl p-8 w-96 h-64"></div>
      </div>
    }>
      <HostDeclineContent />
    </Suspense>
  )
}