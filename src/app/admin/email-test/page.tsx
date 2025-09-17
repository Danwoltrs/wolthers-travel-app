'use client'

import React, { useState } from 'react'
import { Mail, Send, Check, AlertCircle, Loader } from 'lucide-react'

const emailTypes = [
  { value: 'trip_creation', label: 'Trip Creation Notification' },
  { value: 'trip_cancellation', label: 'Trip Cancellation Notice' },
  { value: 'staff_invitation', label: 'Staff Invitation' },
  { value: 'host_invitation', label: 'Host Invitation' },
  { value: 'visit_confirmation', label: 'Visit Confirmation Request' },
  { value: 'visit_declined', label: 'Visit Declined Notification' },
  { value: 'new_time_proposed', label: 'New Time Proposed' },
  { value: 'all_templates', label: '🚀 All Templates (Test Suite)' }
]

interface TestResult {
  success: boolean
  message: string
  results?: any[]
  totalSent?: number
  totalFailed?: number
  sentAt?: string
  error?: string
  details?: string
}

export default function EmailTestPage() {
  const [selectedEmailType, setSelectedEmailType] = useState('trip_creation')
  const [testEmail, setTestEmail] = useState('')
  const [tripTitle, setTripTitle] = useState('Test Trip - Email System Check')
  const [accessCode, setAccessCode] = useState('TEST_EMAIL_2024')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      setResult({
        success: false,
        error: 'Please enter a test email address'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/emails/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          emailType: selectedEmailType,
          testEmail: testEmail.trim(),
          tripData: {
            title: tripTitle.trim(),
            accessCode: accessCode.trim()
          }
        })
      })

      const data = await response.json()
      setResult(data)

    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Mail className="w-8 h-8 text-emerald-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Email System Test
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Test email templates and verify delivery functionality. Only available to Wolthers staff and administrators.
          </p>
        </div>

        {/* Test Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Send Test Email
          </h2>

          <div className="space-y-6">
            {/* Email Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Template
              </label>
              <select
                value={selectedEmailType}
                onChange={(e) => setSelectedEmailType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {emailTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Trip Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trip Title
                </label>
                <input
                  type="text"
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Access Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Send Button */}
            <div>
              <button
                onClick={handleSendTest}
                disabled={loading || !testEmail.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              {result.success ? (
                <Check className="w-6 h-6 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Test Result
              </h3>
            </div>

            <div className={`p-4 rounded-lg mb-4 ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <p className={`font-medium ${
                result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {result.message}
              </p>

              {result.error && (
                <p className="text-red-600 dark:text-red-400 mt-1 text-sm">
                  {result.error}
                </p>
              )}

              {result.details && (
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                  {result.details}
                </p>
              )}

              {result.sentAt && (
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-xs">
                  Sent at: {new Date(result.sentAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* All Templates Results */}
            {result.results && result.results.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Template Results ({result.totalSent} sent, {result.totalFailed} failed)
                </h4>
                <div className="space-y-2">
                  {result.results.map((templateResult, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border text-sm ${
                        templateResult.error
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {templateResult.template}
                        </span>
                        <span className={`text-xs ${
                          templateResult.error ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {templateResult.error ? 'Failed' : 'Sent'}
                        </span>
                      </div>
                      {templateResult.error && (
                        <p className="text-red-600 dark:text-red-400 mt-1 text-xs">
                          {templateResult.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
            Testing Instructions
          </h3>
          <ul className="text-blue-800 dark:text-blue-300 text-sm space-y-2">
            <li>• Enter your email address to receive test emails</li>
            <li>• Select individual templates to test specific email types</li>
            <li>• Use "All Templates" to test the complete email system with rate limiting</li>
            <li>• Check your spam folder if emails don't arrive in the inbox</li>
            <li>• Each email includes delay logic to prevent Resend API rate limiting</li>
            <li>• All emails are sent from trips@trips.wolthers.com</li>
          </ul>
        </div>
      </div>
    </div>
  )
}