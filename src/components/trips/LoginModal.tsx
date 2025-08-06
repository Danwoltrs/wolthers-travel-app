'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { TripStatus } from '@/types'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export default function LoginModal({ isOpen, onClose, message }: LoginModalProps) {
  const router = useRouter()
  const { signInWithEmail, signInWithOtp, signInWithAzure, resetPassword, verifyOtp, isAuthenticated, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [otp, setOtp] = useState('')
  
  const passwordRef = useRef<HTMLInputElement>(null)

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && isOpen) {
      setTimeout(() => {
        onClose()
        // Refresh the page to show authenticated content
        window.location.reload()
      }, 1000)
    }
  }, [isAuthenticated, authLoading, onClose, isOpen])
  
  // Simple email check
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Trip code check - typically 6-20 characters, alphanumeric with hyphens and underscores
  const isTripCode = (input: string) => {
    return /^[A-Z0-9\-_]{6,20}$/i.test(input.trim())
  }

  // Trip code verification using the database
  const verifyTripCode = async (code: string): Promise<{ exists: boolean; status?: TripStatus; tripId?: string }> => {
    try {
      // Simulate API delay for UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Import supabase client dynamically
      const { supabase } = await import('@/lib/supabase-client')
      
      // Use the guest access function to check if trip exists
      const { data: tripData, error } = await supabase
        .rpc('get_trip_by_access_code', { p_access_code: code })
      
      if (error) {
        console.error('Trip verification error:', error)
        return { exists: false }
      }
      
      if (!tripData) {
        return { exists: false }
      }
      
      // Map database status to TripStatus enum
      let mappedStatus: TripStatus
      switch (tripData.status?.toLowerCase()) {
        case 'ongoing':
          mappedStatus = 'ongoing' as TripStatus
          break
        case 'confirmed':
          mappedStatus = 'confirmed' as TripStatus
          break
        case 'completed':
          mappedStatus = 'completed' as TripStatus
          break
        case 'planning':
          mappedStatus = 'planning' as TripStatus
          break
        case 'cancelled':
          mappedStatus = 'cancelled' as TripStatus
          break
        default:
          mappedStatus = 'planning' as TripStatus
      }
      
      return {
        exists: true,
        status: mappedStatus,
        tripId: tripData.id
      }
    } catch (err) {
      console.error('Trip code verification failed:', err)
      return { exists: false }
    }
  }

  const handleEmailSubmit = async () => {
    setError(null)
    const inputValue = email.trim()
    
    if (isTripCode(inputValue)) {
      // Handle trip code
      setIsLoading(true)
      try {
        const verification = await verifyTripCode(inputValue)
        
        if (!verification.exists) {
          setError('Trip code wrong or non-existent - Trip codes only work for upcoming and active trips. Once the trip has finished, you need to create an account to view past trips.')
        } else if (verification.status === 'completed') {
          setError('Trip codes don\'t work for past trips. Create an account to access all your completed trips anytime.')
        } else if (verification.status === 'confirmed' || verification.status === 'ongoing') {
          // Valid active trip code - redirect to trip
          window.location.href = `/trips/${inputValue}`
        } else {
          setError('Trip code wrong or non-existent - Trip codes only work for upcoming and active trips. Once the trip has finished, you need to create an account to view past trips.')
        }
      } catch (err) {
        setError('Unable to verify trip code. Please try again.')
      } finally {
        setIsLoading(false)
      }
    } else if (isValidEmail(inputValue)) {
      // Handle email - proceed to password step
      setIsFlipped(true)
      setTimeout(() => passwordRef.current?.focus(), 100)
    } else {
      setError('Please enter a valid email address or trip code')
    }
  }

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEmailSubmit()
    }
  }

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password.trim()) {
      handleLogin()
    }
  }

  const handleLogin = async () => {
    if (!isValidEmail(email) || !password.trim()) return
    
    setIsLoading(true)
    setPasswordError(null)
    
    try {
      const { error } = await signInWithEmail(email, password)

      if (error) {
        setPasswordError(error.message || 'Invalid email or password')
      } else {
        // Success - AuthContext will handle redirect
      }
    } catch (error) {
      console.error('Login error:', error)
      setPasswordError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrosoftLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await signInWithAzure()
      if (error) {
        setError('Failed to sign in with Microsoft. Please try again.')
      }
      // Microsoft login doesn't need "Remember me" as it's handled by Microsoft
      // Success - AuthContext will handle redirect
    } catch (error) {
      console.error('Microsoft login error:', error)
      setError('Microsoft login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setShowForgotPassword(true)
    setPasswordError(null)
  }

  const handleSendOTP = async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await resetPassword(email)

      if (error) {
        setError(error.message || 'Failed to send reset email. Please try again.')
      } else {
        setOtpSent(true)
        setError(null)
      }
    } catch (err) {
      console.error('Send OTP error:', err)
      setError('Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await verifyOtp(email, otp, 'recovery')

      if (error) {
        setError(error.message || 'Invalid OTP code. Please try again.')
      } else {
        setError(null)
        setShowPasswordReset(true)
        setOtpSent(false)
        setOtp('')
      }
    } catch (err) {
      console.error('Verify OTP error:', err)
      setError('Failed to verify OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/80 dark:bg-[#0E3D2F]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-200/30 dark:border-emerald-800/40 w-full max-w-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-400 mx-auto mb-4"></div>
            <p className="text-pearl-600 dark:text-pearl-300">Processing...</p>
          </div>
        </div>
      </div>
    )
  }

  // Email Login Card - Modal version
  const EmailLoginCard = () => (
    <div className={cn(
      "relative overflow-hidden rounded-2xl shadow-2xl",
      "bg-white/80 dark:bg-[#0E3D2F]/80 backdrop-blur-xl",
      "border border-emerald-200/30 dark:border-emerald-800/40"
    )}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white/30 to-amber-50/30 dark:from-[#0E3D2F]/60 dark:via-[#041611]/40 dark:to-[#1a1a1a]/60" />
      
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-amber-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-amber-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <Image
            src="/images/logos/wolthers-logo-green.svg"
            alt="Wolthers & Associates"
            width={200}
            height={54}
            priority
            className="h-12 w-auto mx-auto transition-opacity duration-300 dark:hidden"
          />
          <Image
            src="/images/logos/wolthers-logo-off-white.svg"
            alt="Wolthers & Associates"
            width={200}
            height={54}
            priority
            className="h-12 w-auto mx-auto transition-opacity duration-300 hidden dark:block"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-yellow-500 dark:text-yellow-400 mb-2">
            {message ? 'Login Required' : 'Wolthers Travel Itineraries'}
          </h1>
          <p className="text-pearl-600 dark:text-pearl-300 text-sm">
            {message || 'Sign in to access your travel dashboard'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Email/Trip Code Form */}
        <div className="mb-6 space-y-2">
          <div className="relative">
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={handleEmailKeyDown}
              placeholder="Enter your email address or trip code"
              className="w-full px-4 py-3 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 dark:bg-[#0E3D2F]/30 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              autoComplete="email"
              disabled={isLoading}
              autoFocus
              spellCheck={false}
            />
          </div>
          
          {isValidEmail(email) && !isTripCode(email) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                ✓ Valid email
              </p>
              <button
                onClick={handleEmailSubmit}
                className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md transition-colors"
              >
                Continue →
              </button>
            </div>
          )}
          {isTripCode(email) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                ✓ Trip code format
              </p>
              <button
                onClick={handleEmailSubmit}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors"
              >
                Access Trip →
              </button>
            </div>
          )}
        </div>

        {/* Microsoft Sign In */}
        <button
          onClick={handleMicrosoftLogin}
          disabled={isLoading}
          className={cn(
            "w-full mb-4 py-3 px-4 rounded-lg font-medium transition-all duration-200",
            "bg-white dark:bg-[#072519] hover:bg-gray-50 dark:hover:bg-[#0a2e1e]",
            "border border-gray-300 dark:border-[#072519]",
            "text-gray-700 dark:text-white",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transform hover:scale-[1.02] active:scale-[0.98]",
            "shadow-md hover:shadow-lg",
            "flex items-center justify-center"
          )}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#00a4ef"/>
            <rect x="1" y="11" width="9" height="9" fill="#ffb900"/>
            <rect x="11" y="11" width="9" height="9" fill="#7fba00"/>
          </svg>
          Sign in with Microsoft
        </button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 font-medium">
            Forgot your password?
          </button>
        </div>
      </div>

      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>
    </div>
  )

  // Password Login Card - Modal version
  const PasswordLoginCard = () => (
    <div className={cn(
      "relative overflow-hidden rounded-2xl shadow-2xl",
      "bg-white/80 dark:bg-[#0E3D2F]/80 backdrop-blur-xl",
      "border border-emerald-200/30 dark:border-emerald-800/40"
    )}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white/30 to-amber-50/30 dark:from-[#0E3D2F]/60 dark:via-[#041611]/40 dark:to-[#1a1a1a]/60" />
      
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-amber-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-amber-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <Image
            src="/images/logos/wolthers-logo-green.svg"
            alt="Wolthers & Associates"
            width={200}
            height={54}
            priority
            className="h-12 w-auto mx-auto transition-opacity duration-300 dark:hidden"
          />
          <Image
            src="/images/logos/wolthers-logo-off-white.svg"
            alt="Wolthers & Associates"
            width={200}
            height={54}
            priority
            className="h-12 w-auto mx-auto transition-opacity duration-300 hidden dark:block"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-yellow-500 dark:text-yellow-400 mb-2">
            Welcome back!
          </h1>
          <p className="text-pearl-600 dark:text-pearl-300 text-sm">
            {email}
          </p>
        </div>

        {/* Password Form */}
        <div className="mb-6 space-y-2">
          <label className="block text-sm font-medium text-pearl-700 dark:text-pearl-300">
            Password
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) setPasswordError(null)
              }}
              onKeyDown={handlePasswordKeyDown}
              placeholder="Enter your password and press Enter"
              className={cn(
                "w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 bg-white/50 dark:bg-[#0E3D2F]/30 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
                passwordError 
                  ? "border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500" 
                  : "border-emerald-200/60 dark:border-emerald-800/40 focus:ring-emerald-500 focus:border-emerald-500"
              )}
              autoComplete="current-password"
              disabled={isLoading}
              autoFocus
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
              tabIndex={-1}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Password Error Display */}
          {passwordError && (
            <div className="mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
              <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setIsFlipped(false)}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              ← Back to email
            </button>
            <p className="text-sm text-pearl-600 dark:text-pearl-400">
              Press Enter to sign in
            </p>
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="mb-4 flex items-center space-x-2">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
            disabled={isLoading}
          />
          <label htmlFor="rememberMe" className="text-sm text-pearl-600 dark:text-pearl-400">
            Remember me for future logins
          </label>
        </div>

        {/* Sign In Button */}
        <button
          onClick={handleLogin}
          disabled={!isValidEmail(email) || !password.trim() || isLoading}
          className={cn(
            "w-full mb-4 py-3 px-4 rounded-lg font-medium text-white transition-all duration-200",
            "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
            "transform hover:scale-[1.02] active:scale-[0.98]",
            "shadow-lg hover:shadow-xl"
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Forgot Password Link - Show when password is wrong */}
        {passwordError && (
          <div className="text-center">
            <button 
              onClick={handleForgotPassword}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 font-medium"
            >
              Forgot your password? Reset with OTP →
            </button>
          </div>
        )}
      </div>

      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Simple conditional rendering - no flip animation */}
        {!isFlipped ? <EmailLoginCard /> : <PasswordLoginCard />}
      </div>
    </div>
  )
}