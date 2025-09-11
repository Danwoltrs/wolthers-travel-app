'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Separator } from '@/components/ui/separator'
import { MicrosoftSignInButton } from './MicrosoftSignInButton'
import { AnimatedEmailLogin } from './AnimatedEmailLogin'
import ForgotPassword from './ForgotPassword'
import OTPInputWrapper from './OTPInputWrapper'
import { AnimatedOutlinedBlock } from './AnimatedOutlinedBlock'
import { cn } from '@/lib/utils'

type AuthView = 'login' | 'forgot-password' | 'otp'

export function LoginCard() {
  const router = useRouter()
  const { signInWithEmail, signInWithOtp, signInWithAzure, resetPassword, verifyOtp } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [authView, setAuthView] = useState<AuthView>('login')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [passwordAttempted, setPasswordAttempted] = useState(false)

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await signInWithAzure()
      
      if (error) {
        setError('Failed to sign in with Microsoft. Please try again.')
      }
      // No need to handle success case - auth state change will redirect
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    setEmail(email)
    setPasswordAttempted(true)
    
    try {
      if (password.length > 0) {
        // Password login
        const { error } = await signInWithEmail(email, password)
        
        if (error) {
          setError(error.message || 'Failed to sign in. Please check your credentials.')
          setShowPasswordReset(true) // Show reset option after failed password attempt
        }
        // Success will be handled by auth state change
      } else {
        // Magic link / OTP flow
        const { error } = await signInWithOtp(email)
        
        if (error) {
          setError(error.message || 'Failed to send verification email. Please try again.')
        } else {
          setAuthView('otp')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setShowPasswordReset(true) // Show reset option on any error
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordError = () => {
    setShowPasswordReset(true)
    setPasswordAttempted(true)
  }

  const handleOTPVerify = async (code: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await verifyOtp(email, code, 'email')
      
      if (error) {
        setError(error.message || 'Invalid verification code. Please try again.')
      }
      // Success will be handled by auth state change which redirects to dashboard
    } catch (err) {
      setError('Invalid verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (email: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        return { success: false, message: error.message || 'Failed to send reset email. Please try again.' }
      } else {
        return { success: true, message: 'Password reset email sent! Check your inbox.' }
      }
    } catch (err) {
      console.error('Password reset error:', err);
      return { success: false, message: 'Failed to send reset email. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main Card with Animated Border */}
      <AnimatedOutlinedBlock 
        className="shadow-2xl transform transition-all duration-500 hover:shadow-3xl"
        borderWidth={2}
        animationDuration={4}
        glowEffect={true}
      >
        <div className="relative p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {authView === 'login' && (
            <>
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-latte-800 dark:text-green-50 mb-2">
                  Welcome Back
                </h1>
                <p className="text-pearl-600 dark:text-pearl-300 text-sm">
                  Sign in to access your travel dashboard
                </p>
              </div>

              {/* Microsoft Sign In */}
              <div className="mb-6">
                <MicrosoftSignInButton
                  onSignIn={handleMicrosoftSignIn}
                  disabled={isLoading}
                />
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <Separator className="bg-pearl-300/60 dark:bg-emerald-800/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    "bg-white/80 dark:bg-[#0E3D2F]/80 backdrop-blur-sm",
                    "text-pearl-600 dark:text-pearl-300",
                    "border border-pearl-200/60 dark:border-emerald-800/40"
                  )}>
                    or continue with email
                  </span>
                </div>
              </div>

              {/* Email Login Form */}
              <AnimatedEmailLogin
                onSubmit={handleEmailSignIn}
                onPasswordError={handlePasswordError}
                className="mb-6"
              />

              {/* Progressive Footer Links - Only show after password attempt */}
              {showPasswordReset && passwordAttempted && (
                <div className="text-center space-y-3 mb-4">
                  <div className="text-center space-y-2">
                    <button 
                      onClick={() => setAuthView('forgot-password')}
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 font-medium"
                    >
                      Forgot your password? Reset with OTP →
                    </button>
                  </div>
                  
                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-pearl-200 dark:border-emerald-800/40" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white dark:bg-[#1a1a1a] px-2 text-pearl-500 dark:text-pearl-400">
                        or
                      </span>
                    </div>
                  </div>

                  {/* OTP Login Option */}
                  <button
                    onClick={async () => {
                      if (email) {
                        // Automatically send OTP to the email they entered
                        setIsLoading(true)
                        try {
                          const { error } = await signInWithOtp(email)
                          if (error) {
                            setError(error.message || 'Failed to send verification email. Please try again.')
                          } else {
                            setAuthView('otp')
                          }
                        } catch (err) {
                          setError('Failed to send verification email. Please try again.')
                        } finally {
                          setIsLoading(false)
                        }
                      } else {
                        setAuthView('otp')
                      }
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending code...' : 'Sign in with email code instead'}
                  </button>
                </div>
              )}

              {/* Support Link - Always visible */}
              <div className="text-center">
                <div className="text-xs text-pearl-500 dark:text-pearl-400">
                  Need help? Contact{' '}
                  <button className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 font-medium">
                    support
                  </button>
                </div>
              </div>
            </>
          )}

          {authView === 'forgot-password' && (
            <ForgotPassword
              onSendReset={handleForgotPassword}
              onBack={() => {
                setAuthView('login')
                setShowPasswordReset(false)
                setPasswordAttempted(false)
              }}
            />
          )}

          {authView === 'otp' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-latte-800 dark:text-green-50 mb-2">
                  Check your email
                </h2>
                <p className="text-pearl-600 dark:text-pearl-300 text-sm">
                  We sent a 6-digit verification code to {email}
                </p>
              </div>
              <OTPInputWrapper
                onComplete={handleOTPVerify}
                onResend={async () => {
                  const { error } = await signInWithOtp(email)
                  if (error) {
                    return { success: false, message: 'Failed to resend code.' }
                  }
                  return { success: true, message: 'Code resent!' }
                }}
                isLoading={isLoading}
              />
              <button
                onClick={() => {
                  setAuthView('login')
                  setShowPasswordReset(false)
                  setPasswordAttempted(false)
                }}
                className="mt-4 w-full text-center text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 font-medium"
              >
                Back to login
              </button>
            </>
          )}
        </div>
      </AnimatedOutlinedBlock>

      {/* Security Notice */}
      {authView === 'login' && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/30 dark:border-amber-800/30">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400/20 dark:bg-amber-500/20 flex items-center justify-center">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></div>
              </div>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Secure Access
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Your data is protected with enterprise-grade security. 
                We use multi-factor authentication and encrypted connections.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}