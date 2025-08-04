'use client'

import React, { useState } from 'react'
import OTPInput from './OTPInput'

interface OTPInputWrapperProps {
  onComplete: (code: string) => void | Promise<void>
  onResend?: () => Promise<{ success: boolean; message: string }>
  isLoading?: boolean
  className?: string
}

export default function OTPInputWrapper({ 
  onComplete, 
  onResend, 
  isLoading = false,
  className 
}: OTPInputWrapperProps) {
  const [otpValue, setOtpValue] = useState('')
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const handleResend = async () => {
    if (onResend) {
      try {
        const result = await onResend()
        if (result.success) {
          setResendMessage(result.message)
          setTimeout(() => setResendMessage(null), 3000)
        }
      } catch (error) {
        console.error('Failed to resend OTP:', error)
      }
    }
  }

  return (
    <div className={className}>
      <OTPInput
        value={otpValue}
        onChange={setOtpValue}
        onComplete={onComplete}
        resendAction={onResend ? handleResend : undefined}
        isVerifying={isLoading}
        disabled={isLoading}
      />
      {resendMessage && (
        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 text-center animate-fade-in">
          {resendMessage}
        </p>
      )}
    </div>
  )
}