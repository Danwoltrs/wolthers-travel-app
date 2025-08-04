'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import DevAccountSwitcher from '@/components/auth/DevAccountSwitcher'
import { UserRole } from '@/types'
import { useModal } from '@/hooks/use-modal'
import { TripStatus } from '@/types'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const modal = useModal()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDevAccounts, setShowDevAccounts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [savedUsers, setSavedUsers] = useState<Array<{email: string, name?: string, lastUsed: Date}>>([])
  const [showSavedUsers, setShowSavedUsers] = useState(false)
  
  const passwordRef = useRef<HTMLInputElement>(null)
  
  // Load saved users on component mount
  useEffect(() => {
    const savedUsersData = localStorage.getItem('wolthers_saved_users')
    if (savedUsersData) {
      try {
        const users = JSON.parse(savedUsersData).map((user: any) => ({
          ...user,
          lastUsed: new Date(user.lastUsed)
        }))
        setSavedUsers(users)
        
        // Auto-fill the most recently used email
        if (users.length > 0 && !email) {
          const mostRecent = users.sort((a: any, b: any) => b.lastUsed - a.lastUsed)[0]
          setEmail(mostRecent.email)
        }
      } catch (error) {
        console.error('Failed to load saved users:', error)
      }
    }
  }, [])

  // Save user credentials
  const saveUserCredentials = (email: string, name?: string) => {
    const existingUsers = savedUsers.filter(user => user.email !== email)
    const newUser = {
      email,
      name,
      lastUsed: new Date()
    }
    const updatedUsers = [newUser, ...existingUsers].slice(0, 5) // Keep only 5 most recent
    
    setSavedUsers(updatedUsers)
    localStorage.setItem('wolthers_saved_users', JSON.stringify(updatedUsers))
  }

  // Remove saved user
  const removeSavedUser = (emailToRemove: string) => {
    const updatedUsers = savedUsers.filter(user => user.email !== emailToRemove)
    setSavedUsers(updatedUsers)
    localStorage.setItem('wolthers_saved_users', JSON.stringify(updatedUsers))
  }

  // Clear all saved users
  const clearAllSavedUsers = () => {
    setSavedUsers([])
    localStorage.removeItem('wolthers_saved_users')
  }
  
  // Simple email check
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Trip code check - typically 6-12 characters, alphanumeric
  const isTripCode = (input: string) => {
    return /^[A-Z0-9]{6,12}$/i.test(input.trim())
  }

  // Mock trip code verification - simulate API call
  const verifyTripCode = async (code: string): Promise<{ exists: boolean; status?: TripStatus; tripId?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock database of trip codes
    const mockTripCodes = [
      { code: 'GT-2024-001', status: 'ongoing' as TripStatus, tripId: '1' },
      { code: 'ACTIVE123', status: 'confirmed' as TripStatus, tripId: '2' },
      { code: 'UPCOMING456', status: 'confirmed' as TripStatus, tripId: '3' },
      { code: 'FINISHED789', status: 'completed' as TripStatus, tripId: '4' },
      { code: 'PAST123', status: 'completed' as TripStatus, tripId: '5' },
      { code: 'EXPIRED999', status: 'completed' as TripStatus, tripId: '6' },
    ]

    const trip = mockTripCodes.find(t => t.code.toLowerCase() === code.toLowerCase())
    
    if (!trip) {
      return { exists: false }
    }

    return {
      exists: true,
      status: trip.status,
      tripId: trip.tripId
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
          // Show custom modal for expired trip codes
          modal.showAlert({
            title: "Trip codes don't work for past trips.",
            description: "Create an account to access all your completed trips anytime.",
            modalType: "info",
            confirmText: "Create Account",
            onConfirm: () => {
              // Navigate to account creation
              router.push('/auth/register')
            }
          })
        } else if (verification.status === 'confirmed' || verification.status === 'ongoing') {
          // Valid active trip code - redirect to trip
          router.push(`/guest/trip/${inputValue}`)
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
    // Simulate login
    setTimeout(() => {
      // Save user credentials if "Remember me" is checked
      if (rememberMe) {
        saveUserCredentials(email)
      }
      
      setIsLoading(false)
      router.push('/dashboard')
    }, 1000)
  }

  const handleMicrosoftLogin = () => {
    setIsLoading(true)
    setTimeout(() => {
      // Microsoft login doesn't need "Remember me" as it's handled by Microsoft
      setIsLoading(false)
      router.push('/dashboard')
    }, 1000)
  }

  const handleDevAccountSelect = (account: any) => {
    console.log('Quick login as:', account.email, account.role)
    setEmail(account.email)
    setIsLoading(true)
    
    // Route based on role
    setTimeout(() => {
      if (account.role === UserRole.GUEST) {
        router.push('/guest/trips')
      } else {
        router.push('/dashboard')
      }
    }, 500)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Signing in...</p>
        </div>
      </div>
    )
  }

  // Email Login Card - Complete card for email step
  const EmailLoginCard = () => (
    <div className={cn(
      "relative overflow-hidden rounded-2xl shadow-2xl",
      "bg-white/80 dark:bg-[#0E3D2F]/80 backdrop-blur-xl",
      "border border-emerald-200/30 dark:border-emerald-800/40",
      "transform transition-all duration-500"
    )}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white/30 to-amber-50/30 dark:from-[#0E3D2F]/60 dark:via-[#041611]/40 dark:to-[#1a1a1a]/60" />
      
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-amber-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-amber-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative p-6 sm:p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <Image
            src="/images/logos/wolthers-logo-green.svg"
            alt="Wolthers & Associates"
            width={200}
            height={54}
            priority
            className="h-12 sm:h-14 w-auto mx-auto transition-opacity duration-300 dark:hidden"
          />
          <Image
            src="/images/logos/wolthers-logo-off-white.svg"
            alt="Wolthers & Associates"
            width={200}
            height={54}
            priority
            className="h-12 sm:h-14 w-auto mx-auto transition-opacity duration-300 hidden dark:block"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-yellow-500 dark:text-yellow-400 mb-2">
            Wolthers Travel Itineraries
          </h1>
          <p className="text-pearl-600 dark:text-pearl-300 text-sm">
            Sign in to access your travel dashboard
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
                if (error) setError(null) // Clear error when typing
              }}
              onKeyDown={handleEmailKeyDown}
              placeholder="Enter your email address or trip code"
              className="w-full px-4 py-3 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 dark:bg-[#0E3D2F]/30 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              autoComplete="email"
              disabled={isLoading}
              autoFocus
            />
            
            {/* Saved Users Dropdown Toggle */}
            {savedUsers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSavedUsers(!showSavedUsers)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
                disabled={isLoading}
              >
                👤
              </button>
            )}
          </div>
          
          {/* Saved Users Dropdown */}
          {showSavedUsers && savedUsers.length > 0 && (
            <div className="absolute z-10 w-full bg-white dark:bg-[#0E3D2F] border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {savedUsers.map((user, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setEmail(user.email)
                    setShowSavedUsers(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors duration-150 flex items-center justify-between group"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last used: {user.lastUsed.toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSavedUser(user.email)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-150"
                  >
                    ✕
                  </button>
                </button>
              ))}
              
              {/* Clear All Button */}
              <div className="border-t border-emerald-200/60 dark:border-emerald-800/40 p-2">
                <button
                  onClick={() => {
                    clearAllSavedUsers()
                    setShowSavedUsers(false)
                  }}
                  className="w-full px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-center"
                >
                  Clear all saved users
                </button>
              </div>
            </div>
          )}
          
          {isValidEmail(email) && !isTripCode(email) && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              ✓ Valid email - Press Enter to continue
            </p>
          )}
          {isTripCode(email) && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              ✓ Trip code format - Press Enter to access trip
            </p>
          )}
        </div>

        {/* Microsoft Sign In */}
        <button
          onClick={handleMicrosoftLogin}
          disabled={isLoading}
          className={cn(
            "w-full mb-4 py-3 px-4 rounded-lg font-medium transition-all duration-200",
            "bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900",
            "border border-gray-300 dark:border-gray-800",
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

        {/* Development Login Toggle - Only in dev mode */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowDevAccounts(!showDevAccounts)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            >
              {showDevAccounts ? '↑ Hide' : '↓ Show'} Developer Test Accounts
            </button>
          </div>
        )}
      </div>

      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>
    </div>
  )

  // Password Login Card - Complete card for password step  
  const PasswordLoginCard = () => (
    <div className={cn(
      "relative overflow-hidden rounded-2xl shadow-2xl",
      "bg-white/80 dark:bg-[#0E3D2F]/80 backdrop-blur-xl",
      "border border-emerald-200/30 dark:border-emerald-800/40",
      "transform transition-all duration-500"
    )}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white/30 to-amber-50/30 dark:from-[#0E3D2F]/60 dark:via-[#041611]/40 dark:to-[#1a1a1a]/60" />
      
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-amber-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-amber-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative p-6 sm:p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <Image
            src="/images/logos/wolthers-logo-green.svg"
            alt="Wolthers & Associates"
            width={200}
            height={54}
            priority
            className="h-12 sm:h-14 w-auto mx-auto transition-opacity duration-300 dark:hidden"
          />
          <Image
            src="/images/logos/wolthers-logo-off-white.svg"
            alt="Wolthers & Associates"
            width={200}
            height={54}
            priority
            className="h-12 sm:h-14 w-auto mx-auto transition-opacity duration-300 hidden dark:block"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-yellow-500 dark:text-yellow-400 mb-2">
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
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              placeholder="Enter your password and press Enter"
              className="w-full px-4 py-3 pr-12 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 dark:bg-[#0E3D2F]/30 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              autoComplete="current-password"
              disabled={isLoading}
              autoFocus
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-50 via-amber-50/30 to-emerald-50/20 dark:from-[#212121] dark:via-[#1a1a1a] dark:to-[#0E3D2F]/10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 sm:w-40 sm:h-40 bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-4 sm:right-10 w-24 h-24 sm:w-32 sm:h-32 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 right-1/4 w-36 h-36 sm:w-48 sm:h-48 bg-emerald-300/10 dark:bg-emerald-800/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main login container */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Simple conditional rendering - no flip animation */}
        {!isFlipped ? <EmailLoginCard /> : <PasswordLoginCard />}

        {/* Copyright */}
        <div className="text-center mt-6">
          <p className="text-xs text-pearl-600 dark:text-pearl-400">
            © {new Date().getFullYear()} Wolthers & Associates. All rights reserved.
          </p>
        </div>

        {/* Development Account Switcher - Only in dev mode */}
        {process.env.NODE_ENV === 'development' && showDevAccounts && (
          <div className="mt-8">
            <DevAccountSwitcher 
              onSelectAccount={handleDevAccountSelect}
              disabled={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
}