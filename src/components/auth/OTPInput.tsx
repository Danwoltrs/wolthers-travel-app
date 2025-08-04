'use client'

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { Shield, Check, AlertCircle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  error?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
  resendAction?: () => void
  resendCooldown?: number
  isVerifying?: boolean
}

const OTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(
  ({ 
    length = 6,
    value, 
    onChange, 
    onComplete, 
    error, 
    disabled = false, 
    autoFocus = true,
    className,
    resendAction,
    resendCooldown = 60,
    isVerifying = false
  }, ref) => {
    const [activeIndex, setActiveIndex] = useState(0)
    const [resendTimer, setResendTimer] = useState(0)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Initialize input refs
    useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, length)
    }, [length])

    // Auto-focus first input
    useEffect(() => {
      if (autoFocus && inputRefs.current[0] && !disabled) {
        inputRefs.current[0].focus()
      }
    }, [autoFocus, disabled])

    // Handle resend cooldown
    useEffect(() => {
      if (resendTimer > 0) {
        const timer = setTimeout(() => {
          setResendTimer(resendTimer - 1)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }, [resendTimer])

    // Check for completion
    useEffect(() => {
      if (value.length === length && onComplete) {
        onComplete(value)
      }
    }, [value, length, onComplete])

    const focusInput = (index: number) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index]?.focus()
        setActiveIndex(index)
      }
    }

    const handleChange = (index: number, inputValue: string) => {
      // Only allow single digits
      const digit = inputValue.replace(/\D/g, '').slice(-1)
      
      const newValue = value.split('')
      newValue[index] = digit
      
      // Fill in any gaps with empty strings
      for (let i = 0; i < length; i++) {
        if (!newValue[i]) newValue[i] = ''
      }
      
      const updatedValue = newValue.join('').slice(0, length)
      onChange(updatedValue)

      // Move to next input if digit was entered
      if (digit && index < length - 1) {
        focusInput(index + 1)
      }
    }

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault()
          // If code is complete, trigger onComplete
          if (value.length === length && onComplete) {
            onComplete(value)
          }
          break
          
        case 'Backspace':
          e.preventDefault()
          const newValue = value.split('')
          
          if (newValue[index]) {
            // Clear current digit
            newValue[index] = ''
          } else if (index > 0) {
            // Move to previous input and clear it
            newValue[index - 1] = ''
            focusInput(index - 1)
          }
          
          onChange(newValue.join(''))
          break
          
        case 'ArrowLeft':
          e.preventDefault()
          if (index > 0) focusInput(index - 1)
          break
          
        case 'ArrowRight':
          e.preventDefault()
          if (index < length - 1) focusInput(index + 1)
          break
          
        case 'Delete':
          e.preventDefault()
          const deleteValue = value.split('')
          deleteValue[index] = ''
          onChange(deleteValue.join(''))
          break
      }
    }

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
      
      if (pastedData) {
        onChange(pastedData)
        // Focus the last filled input or the next empty one
        const nextIndex = Math.min(pastedData.length, length - 1)
        focusInput(nextIndex)
      }
    }

    const handleFocus = (index: number) => {
      setActiveIndex(index)
    }

    const handleResend = () => {
      if (resendAction && resendTimer === 0) {
        resendAction()
        setResendTimer(resendCooldown)
      }
    }

    const getInputValue = (index: number) => {
      return value[index] || ''
    }

    const isComplete = value.length === length
    const hasError = Boolean(error)

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={cn(
            "p-2 rounded-full transition-all duration-300",
            isComplete && !hasError 
              ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
              : hasError
              ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
              : "bg-sage-100 dark:bg-emerald-500/10 text-sage-600 dark:text-emerald-400"
          )}>
            {isComplete && !hasError ? (
              <Check className="w-5 h-5" />
            ) : hasError ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-latte-800 dark:text-green-50">
              Enter verification code
            </h3>
            <p className="text-sm text-pearl-600 dark:text-slate-400">
              We sent a {length}-digit code to your email
            </p>
          </div>
        </div>

        {/* OTP Input Fields */}
        <div className="flex gap-3 justify-center mb-4">
          {Array.from({ length }, (_, index) => (
            <input
              key={index}
              ref={(el) => {
                if (el) inputRefs.current[index] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={getInputValue(index)}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(index)}
              disabled={disabled || isVerifying}
              className={cn(
                "w-12 h-12 text-center text-lg font-bold rounded-lg",
                "bg-white dark:bg-[#0E3D2F]/50",
                "border-2 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                // Border colors
                hasError 
                  ? "border-red-300 dark:border-red-500/50 focus:border-red-400 focus:ring-red-200 dark:focus:ring-red-500/20"
                  : isComplete
                  ? "border-emerald-300 dark:border-emerald-500/50 focus:border-emerald-400 focus:ring-emerald-200 dark:focus:ring-emerald-500/20"
                  : activeIndex === index
                  ? "border-sage-400 dark:border-emerald-400 focus:border-sage-500 focus:ring-sage-300 dark:focus:ring-emerald-400/30"
                  : getInputValue(index)
                  ? "border-sage-300 dark:border-emerald-500/30"
                  : "border-pearl-300 dark:border-[#0E3D2F]",
                // Text colors
                hasError
                  ? "text-red-600 dark:text-red-400"
                  : "text-latte-800 dark:text-green-50",
                // States
                "disabled:opacity-50 disabled:cursor-not-allowed",
                // Animation
                getInputValue(index) && "animate-in zoom-in-95 duration-200"
              )}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {/* Loading state */}
        {isVerifying && (
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-sage-600 dark:text-emerald-400">
            <div className="w-4 h-4 border-2 border-sage-300 dark:border-emerald-500/30 border-t-sage-600 dark:border-t-emerald-400 rounded-full animate-spin" />
            Verifying code...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="text-center mb-4">
            <div className="text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-1 duration-300 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Success message */}
        {isComplete && !hasError && !isVerifying && (
          <div className="text-center mb-4">
            <div className="text-sm text-emerald-600 dark:text-emerald-400 animate-in slide-in-from-top-1 duration-300 flex items-center justify-center gap-1">
              <Check className="w-3 h-3 flex-shrink-0" />
              Code verified successfully
            </div>
          </div>
        )}

        {/* Resend option */}
        {resendAction && (
          <div className="text-center">
            <p className="text-sm text-pearl-600 dark:text-slate-400 mb-2">
              Didn't receive the code?
            </p>
            {resendTimer > 0 ? (
              <div className="text-sm text-pearl-500 dark:text-slate-500 flex items-center justify-center gap-1">
                <RotateCcw className="w-3 h-3" />
                Resend in {resendTimer}s
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={disabled}
                className={cn(
                  "text-sm font-medium transition-all duration-200",
                  "text-sage-600 hover:text-sage-700 dark:text-emerald-400 dark:hover:text-emerald-300",
                  "hover:underline focus:outline-none focus:underline",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                )}
              >
                Resend code
              </button>
            )}
          </div>
        )}

        {/* Progress indicator */}
        <div className="mt-4">
          <div className="flex gap-1 justify-center">
            {Array.from({ length }, (_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-1 rounded-full transition-all duration-300",
                  getInputValue(index)
                    ? hasError
                      ? "bg-red-400 dark:bg-red-500"
                      : "bg-emerald-400 dark:bg-emerald-500"
                    : "bg-pearl-300 dark:bg-slate-600"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }
)

OTPInput.displayName = 'OTPInput'

export default OTPInput