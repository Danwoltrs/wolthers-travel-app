'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Key, ArrowRight, AlertCircle } from 'lucide-react'

export default function GuestTripsPage() {
  const [accessCode, setAccessCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accessCode.trim()) {
      setError('Please enter an access code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Navigate to trip page with access code
      router.push(`/trips/${accessCode.trim()}`)
    } catch (err) {
      setError('Unable to access trip. Please check your access code and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-50 via-amber-50/30 to-emerald-50/20 dark:from-[#212121] dark:via-[#1a1a1a] dark:to-[#0E3D2F]/10 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white/80 dark:bg-[#0E3D2F]/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-emerald-200/30 dark:border-emerald-800/40">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-golden-100 dark:bg-[#123d32] rounded-full mb-4">
              <Key className="w-8 h-8 text-golden-600 dark:text-golden-400" />
            </div>
            <h1 className="text-3xl font-bold text-latte-800 dark:text-green-50 mb-2">
              Guest Trip Access
            </h1>
            <p className="text-pearl-600 dark:text-pearl-300">
              Enter your trip access code to view details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="accessCode" 
                className="block text-sm font-medium text-latte-700 dark:text-green-100 mb-2"
              >
                Trip Access Code
              </label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter your access code"
                className="w-full px-4 py-3 border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-latte-900 dark:text-green-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-golden-500 dark:focus:ring-golden-400 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !accessCode.trim()}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-golden-600 dark:bg-[#123d32] text-white dark:text-green-100 rounded-lg hover:bg-golden-700 dark:hover:bg-[#0E3D2F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Trip</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-pearl-200 dark:border-[#2a2a2a] text-center">
            <p className="text-pearl-600 dark:text-pearl-400 text-sm">
              Don't have an access code?{' '}
              <button
                onClick={() => router.push('/')}
                className="text-golden-600 dark:text-golden-400 hover:text-golden-700 dark:hover:text-golden-300 font-medium transition-colors"
              >
                Contact your trip organizer
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}