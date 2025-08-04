'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
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
  const [isLoading, setIsLoading] = useState(false)
  const [authView, setAuthView] = useState<AuthView>('login')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await signIn('azure-ad', {
        callbackUrl: '/dashboard',
        redirect: false
      })
      
      if (result?.error) {
        setError('Failed to sign in with Microsoft. Please try again.')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignIn = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // For now, simulate email/password authentication
      // In production, this would use NextAuth credentials provider
      if (password.length > 0) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // In production, check credentials and redirect based on role
        router.push('/dashboard')
      } else {
        // Magic link flow
        const result = await signIn('email', {
          email,
          callbackUrl: '/dashboard',
          redirect: false
        })
        
        if (result?.ok) {
          setAuthView('otp')
        } else {
          setError('Failed to send verification email. Please try again.')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPVerify = async (code: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1500))
      router.push('/dashboard')
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
      // Simulate password reset email
      await new Promise(resolve => setTimeout(resolve, 1500))
      return { success: true, message: 'Password reset email sent!' }
    } catch (err) {
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
                className="mb-6"
              />

              {/* Footer Links */}
              <div className="text-center space-y-2">
                <button 
                  onClick={() => setAuthView('forgot-password')}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 font-medium"
                >
                  Forgot your password?
                </button>
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
              onBack={() => setAuthView('login')}
            />
          )}

          {authView === 'otp' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-latte-800 dark:text-green-50 mb-2">
                  Check your email
                </h2>
                <p className="text-pearl-600 dark:text-pearl-300 text-sm">
                  We sent a verification code to {email}
                </p>
              </div>
              <OTPInputWrapper
                onComplete={handleOTPVerify}
                onResend={async () => {
                  await signIn('email', { email, redirect: false })
                  return { success: true, message: 'Code resent!' }
                }}
                isLoading={isLoading}
              />
              <button
                onClick={() => setAuthView('login')}
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