'use client'

import React, { useState } from 'react'
import { ArrowLeft, Mail, Check, AlertCircle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import EmailInput from './EmailInput'
import { Button } from '@/components/ui/button'

type ResetStep = 'email' | 'sent' | 'success' | 'error'

interface ForgotPasswordProps {
  onBack?: () => void
  onSuccess?: () => void
  onSendReset?: (email: string) => Promise<{ success: boolean; message?: string }>
  className?: string
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  onBack,
  onSuccess,
  onSendReset,
  className
}) => {
  const [currentStep, setCurrentStep] = useState<ResetStep>('email')
  const [email, setEmail] = useState('')
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSendReset = async () => {
    if (!isValidEmail || isLoading) return

    setIsLoading(true)
    setErrorMessage('')

    try {
      const result = await onSendReset?.(email)
      
      if (result?.success) {
        setCurrentStep('sent')
        setResendCooldown(60) // 60 second cooldown
      } else {
        setCurrentStep('error')
        setErrorMessage(result?.message || 'Failed to send reset email. Please try again.')
      }
    } catch (error) {
      setCurrentStep('error')
      setErrorMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSendReset()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isValidEmail && !isLoading) {
        handleSendReset()
      }
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    
    setCurrentStep('email')
    await handleSendReset()
  }

  const handleTryAgain = () => {
    setCurrentStep('email')
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
                Forgot your password?
              </h2>
              <p className="text-pearl-600 dark:text-slate-400">
                No worries! Enter your email address and we'll send you a reset link.
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

            {/* Send Reset Button */}
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
                  Sending reset link...
                </div>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>
        )

      case 'sent':
        return (
          <div className="space-y-6 text-center">
            {/* Success icon */}
            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center animate-in zoom-in-95 duration-500">
              <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Success message */}
            <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-latte-800 dark:text-green-50">
                Check your email
              </h2>
              <p className="text-pearl-600 dark:text-slate-400">
                We've sent a password reset link to
              </p>
              <p className="font-medium text-sage-600 dark:text-emerald-400">
                {email}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-sage-50 dark:bg-emerald-500/5 p-4 rounded-lg text-left space-y-2 animate-in slide-in-from-bottom-2 duration-700">
              <h3 className="font-medium text-latte-800 dark:text-green-50">
                What's next?
              </h3>
              <ul className="text-sm text-pearl-600 dark:text-slate-400 space-y-1">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-sage-400 dark:bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                  Check your email inbox (and spam folder)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-sage-400 dark:bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                  Click the reset link in the email
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-sage-400 dark:bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                  Create a new secure password
                </li>
              </ul>
            </div>

            {/* Resend option */}
            <div className="space-y-3">
              <p className="text-sm text-pearl-600 dark:text-slate-400">
                Didn't receive the email?
              </p>
              {resendCooldown > 0 ? (
                <div className="text-sm text-pearl-500 dark:text-slate-500 flex items-center justify-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Resend in {resendCooldown}s
                </div>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-sm font-medium text-sage-600 hover:text-sage-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline focus:outline-none focus:underline transition-colors duration-200"
                >
                  Resend reset link
                </button>
              )}
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
                Password reset successful
              </h2>
              <p className="text-pearl-600 dark:text-slate-400">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>

            {/* Continue button */}
            <Button
              onClick={onSuccess}
              className="w-full py-3 text-base font-medium bg-sage-500 hover:bg-sage-600 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              Continue to sign in
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

export default ForgotPassword