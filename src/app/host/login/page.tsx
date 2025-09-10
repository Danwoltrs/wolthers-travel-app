'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, Lock, LogIn, ArrowRight, Shield, Users, Calendar, Upload } from 'lucide-react'

export default function HostLoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Pre-fill email if provided in URL
    const urlEmail = searchParams.get('email')
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // Send OTP login request
      const response = await fetch('/api/auth/otp-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          userType: 'host',
          redirectTo: '/host/dashboard'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        setMessage('A secure login link has been sent to your email address. Please check your inbox and click the link to access your host dashboard.')
      } else {
        setMessage(data.error || 'Failed to send login link. Please try again.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Wolthers Travel Platform
          </h1>
          <p className="text-gray-600">
            Host Partner Access
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Your Host Dashboard
            </h2>
            <p className="text-sm text-gray-600">
              Enter your email address to receive a secure login link
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              isSuccess 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  className="w-full pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="your@company.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Sending Login Link...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Send Secure Login Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Host Dashboard Features</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-gray-700">Manage visiting guests and client information</span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-gray-700">View and confirm upcoming visit requests</span>
            </div>
            <div className="flex items-center space-x-3">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-gray-700">Upload presentations and meeting materials</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-gray-700">Access complete visit history and analytics</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Secure access provided by Wolthers & Associates Travel Team
          </p>
        </div>
      </div>
    </div>
  )
}