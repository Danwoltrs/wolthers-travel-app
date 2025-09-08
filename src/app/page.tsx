'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

 type Step = 'email' | 'password' | 'error-offer-otp'

export default function Page() {
  const router = useRouter()
  const { signInWithEmail, signInWithAzure, sendOtpLogin } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasFailed, setHasFailed] = useState(false)

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const isTripCode = (value: string) => /^[A-Z0-9\-_]{6,20}$/i.test(value.trim())

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setError('')
    if (isValidEmail(value)) {
      setStep('password')
    } else {
      setStep('email')
    }
  }

  const handleLogin = async () => {
    if (!isValidEmail(email) || !password) return
    setLoading(true)
    const { error } = await signInWithEmail(email, password)
    setLoading(false)
    if (error) {
      if (!hasFailed) {
        setHasFailed(true)
        setStep('error-offer-otp')
      } else {
        setError('Wrong password')
      }
    } else {
      router.push('/dashboard')
    }
  }

  const handleSendCode = async () => {
    setLoading(true)
    const { error } = await sendOtpLogin(email)
    setLoading(false)
    setError(error ? 'Failed to send code' : 'Code sent. Check your email.')
  }

  const verifyTripCode = async (code: string): Promise<string | null> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const { supabase } = await import('@/lib/supabase-client')
      const { data, error } = await supabase.rpc('get_trip_by_access_code', { p_access_code: code })
      if (error || !data) return null
      return data.id
    } catch {
      return null
    }
  }

  const handleTripAccess = async () => {
    setLoading(true)
    const id = await verifyTripCode(email.trim())
    setLoading(false)
    if (id) {
      router.push(`/trips/${email.trim()}`)
    } else {
      setError('Invalid trip key')
    }
  }

  const handleMicrosoft = async () => {
    setLoading(true)
    const { error } = await signInWithAzure()
    setLoading(false)
    if (error) setError('Microsoft sign-in failed')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-4">
          <Image src="/images/logos/wolthers-logo-green.svg" alt="Wolthers & Associates" width={200} height={54} className="mx-auto" />
          <h1 className="text-xl font-bold mt-4 text-amber-600">Wolthers Travel Itineraries</h1>
          <p className="text-gray-600 text-sm mt-2">Sign in to access your travel dashboard</p>
        </div>

        <input
          type="text"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="Enter your email address or trip key"
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          autoFocus
          disabled={loading}
        />

        {step === 'password' && (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loading}
            />
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button
              onClick={handleLogin}
              disabled={loading || !password}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </>
        )}

        {step === 'error-offer-otp' && (
          <>
            <input
              type="password"
              value={password}
              disabled
              className="w-full px-4 py-3 border rounded-lg bg-gray-100 cursor-not-allowed"
            />
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <span>Wrong password. Send a one-time code to reset?</span>
              <div className="flex items-center space-x-4">
                <button onClick={handleSendCode} disabled={loading} className="text-emerald-600 font-medium">
                  Send code
                </button>
                <button onClick={() => { setStep('password'); setError('') }} className="text-gray-600 underline">
                  Try again
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'email' && isTripCode(email) && (
          <button
            onClick={handleTripAccess}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Validating...' : 'Enter Trip Key'}
          </button>
        )}

        <button
          onClick={handleMicrosoft}
          disabled={loading}
          className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg disabled:opacity-50"
        >
          Sign in with Microsoft
        </button>
      </div>
    </div>
  )
}

