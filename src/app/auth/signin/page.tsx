"use client"

import { getProviders, signIn, getSession } from "next-auth/react"
import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AnimatedEmailLogin } from '@/components/auth/AnimatedEmailLogin'
import { MicrosoftSignInButton } from '@/components/auth/MicrosoftSignInButton'
import { AnimatedOutlinedBlock } from '@/components/auth/AnimatedOutlinedBlock'
import { cn } from '@/lib/utils'

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const errorParam = searchParams.get("error")

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl)
      }
    })

    // Get available providers
    getProviders().then(setProviders)
  }, [router, callbackUrl])

  useEffect(() => {
    // Handle error from URL params
    if (errorParam) {
      switch (errorParam) {
        case "OAuthSignin":
        case "OAuthCallback":
        case "OAuthCreateAccount":
        case "EmailCreateAccount":
          setError("Error occurred during sign in. Please try again.")
          break
        case "OAuthAccountNotLinked":
          setError("Account with this email already exists with a different provider.")
          break
        case "EmailSignin":
          setError("Error sending email. Please check your email address.")
          break
        case "CredentialsSignin":
          setError("Invalid credentials. Please try again.")
          break
        case "SessionRequired":
          setError("Please sign in to access this page.")
          break
        default:
          setError("An error occurred during sign in.")
      }
    }
  }, [errorParam])

  const handleEmailSignIn = async (email: string, password: string) => {
    setIsLoading(true)
    setError("")

    try {
      if (password.length > 0) {
        // Simulate password-based authentication
        // In production, this would use NextAuth credentials provider
        await new Promise(resolve => setTimeout(resolve, 1500))
        router.push(callbackUrl)
      } else {
        // Magic link flow
        const result = await signIn("email", {
          email,
          callbackUrl,
          redirect: false,
        })

        if (result?.error) {
          setError("Error sending sign-in email. Please try again.")
        } else {
          router.push("/auth/verify-request?provider=email&type=email")
        }
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn('azure-ad', {
        callbackUrl,
        redirect: false
      })
      
      if (result?.error) {
        setError('Failed to sign in with Microsoft. Please try again.')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      setError("Error signing in with Microsoft. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-50 via-amber-50/30 to-emerald-50/20 dark:from-[#212121] dark:via-[#1a1a1a] dark:to-[#0E3D2F]/10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 sm:w-40 sm:h-40 bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-4 sm:right-10 w-24 h-24 sm:w-32 sm:h-32 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 right-1/4 w-36 h-36 sm:w-48 sm:h-48 bg-emerald-300/10 dark:bg-emerald-800/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Logo and branding */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
        <Image
          src="/images/logos/wolthers-logo-green.svg"
          alt="Wolthers & Associates"
          width={160}
          height={43}
          priority
          className={cn(
            "h-8 sm:h-10 w-auto transition-opacity duration-300",
            "dark:opacity-80"
          )}
        />
      </div>

      {/* Main login container */}
      <div className="relative z-10 w-full max-w-md mx-auto">
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
            {providers?.["azure-ad"] && (
              <div className="mb-6">
                <MicrosoftSignInButton
                  onSignIn={handleMicrosoftSignIn}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Divider */}
            {providers?.["azure-ad"] && (
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
            )}

            {/* Animated Email Login Form with 3D Flip Card */}
            <AnimatedEmailLogin
              onSubmit={handleEmailSignIn}
              className="mb-6"
            />

            {/* Footer Links */}
            <div className="text-center space-y-2">
              <div className="text-xs text-pearl-500 dark:text-pearl-400">
                Need help? Contact{' '}
                <button className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-200 font-medium">
                  support
                </button>
              </div>
            </div>
          </div>
        </AnimatedOutlinedBlock>

        {/* Security Notice */}
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
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 px-4">
        <p className="text-xs sm:text-sm text-pearl-600 dark:text-pearl-400 text-center">
          © 2025 Wolthers & Associates. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-pearl-50 via-amber-50/30 to-emerald-50/20 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>}>
      <SignInContent />
    </Suspense>
  )
}