'use client'

import React, { useState } from 'react'
import { ArrowLeft, Mail, Shield, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import EmailInput from './EmailInput'
import OTPInput from './OTPInput'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

type OTPStep = 'email' | 'otp' | 'success' | 'error'

interface OTPLoginProps {
  onBack?: () => void
  onSuccess?: (user: any, otpLogin: boolean) => void
  className?: string
}

const OTPLogin: React.FC<OTPLoginProps> = ({
  onBack,
  onSuccess,
  className
}) => {
  const { sendOtpLogin, verifyOtpLogin } = useAuth()
  const [currentStep, setCurrentStep] = useState<OTPStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Handle resend cooldown
  React.useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleSendOTP = async () => {
    if (!isValidEmail || isLoading) return

    setIsLoading(true)
    setErrorMessage('')

    try {
      const result = await sendOtpLogin(email)
      
      if (!result.error) {
        setCurrentStep('otp')
        setResendCooldown(60) // 60 second cooldown
      } else {
        setCurrentStep('error')
        setErrorMessage(result.error)
      }
    } catch (error) {
      setCurrentStep('error')
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (otpCode: string) => {
    if (!otpCode || otpCode.length !== 6) return

    setIsVerifying(true)
    setErrorMessage('')

    try {
      const result = await verifyOtpLogin(email, otpCode)
      
      if (!result.error && result.user) {
        setCurrentStep('success')
        onSuccess?.(result.user, result.otpLogin || false)
      } else {
        setErrorMessage(result.error || 'Invalid verification code')
        setOtp('')
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.')
      setOtp('')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSendOTP()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isValidEmail && !isLoading) {
        handleSendOTP()
      }
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    
    setCurrentStep('email')
    setOtp('')
    setErrorMessage('')
    await handleSendOTP()
  }

  const handleTryAgain = () => {
    setCurrentStep('email')
    setOtp('')
    setErrorMessage('')
  }

  const handleBackToLogin = () => {
    onBack?.()
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-sage-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-sage-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-latte-800 dark:text-green-50">
                Sign in with email
              </h2>
              <p className="text-pearl-600 dark:text-slate-400">
                Enter your email to receive a secure login code.
              </p>
            </div>

            {/* Email Input */}
            <EmailInput
              value={email}
              onChange={setEmail}
              onValidEmail={setIsValidEmail}
              placeholder="Enter your email address"
              onKeyDown={handleKeyDown}
            />

            {/* Send Code Button */}
            <Button
              type="submit"
              disabled={!isValidEmail || isLoading}
              className={cn(
                "w-full py-3 text-base font-medium",
                "bg-sage-500 hover:bg-sage-600 dark:bg-emerald-500 dark:hover:bg-emerald-600",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending login code...
                </div>
              ) : (
                'Send login code'
              )}
            </Button>
          </form>
        )

      case 'otp':
        return (
          <div className="space-y-6">
            <OTPInput
              value={otp}
              onChange={setOtp}
              onComplete={handleVerifyOTP}
              error={errorMessage}
              disabled={isVerifying}
              resendAction={handleResend}
              resendCooldown={resendCooldown}
              isVerifying={isVerifying}
            />
            
            {/* Back to email option */}
            <div className="text-center">
              <button
                onClick={() => {
                  setCurrentStep('email')
                  setOtp('')
                  setErrorMessage('')
                }}
                className="text-sm font-medium text-sage-600 hover:text-sage-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline focus:outline-none focus:underline transition-colors duration-200"
              >
                Use a different email
              </button>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="space-y-6 text-center">
            {/* Success icon */}
            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center animate-in zoom-in-95 duration-500">
              <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Success message */}
            <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-latte-800 dark:text-green-50">
                Welcome back!
              </h2>
              <p className="text-pearl-600 dark:text-slate-400">
                You've been successfully signed in.
              </p>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="space-y-6 text-center">
            {/* Error icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center animate-in zoom-in-95 duration-500">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Error message */}
            <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-latte-800 dark:text-green-50">
                Something went wrong
              </h2>
              <p className="text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            </div>

            {/* Try again button */}
            <Button
              onClick={handleTryAgain}
              variant="outline"
              className="w-full py-3 text-base font-medium"
            >
              Try again
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="bg-white dark:bg-[#0E3D2F]/50 rounded-xl p-8 shadow-lg border border-pearl-200 dark:border-[#0E3D2F]">
        {/* Back button */}
        {onBack && currentStep !== 'success' && (
          <button
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-sm text-pearl-600 dark:text-slate-400 hover:text-sage-600 dark:hover:text-emerald-400 transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </button>
        )}

        {/* Step content */}
        <div className="animate-in slide-in-from-right-4 duration-500">
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}

export default OTPLogin