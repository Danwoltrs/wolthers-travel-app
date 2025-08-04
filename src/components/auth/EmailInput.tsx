'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmailInputProps {
  value: string
  onChange: (value: string) => void
  onValidEmail?: (isValid: boolean) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  className?: string
}

const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ 
    value, 
    onChange, 
    onValidEmail, 
    onKeyDown,
    error, 
    disabled = false, 
    placeholder = "Enter your email address",
    className 
  }, ref) => {
    const [isValid, setIsValid] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Email validation regex - memoized
    const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, [])
    
    // Memoized validation to prevent unnecessary recalculations
    const isValidEmail = useMemo(() => {
      return emailRegex.test(value) && value.length > 0
    }, [value, emailRegex])

    useEffect(() => {
      setIsValid(isValidEmail)
      onValidEmail?.(isValidEmail)
    }, [isValidEmail, onValidEmail])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onChange(newValue)
      if (!hasInteracted && newValue.length > 0) {
        setHasInteracted(true)
      }
    }, [onChange, hasInteracted])

    const handleFocus = useCallback(() => {
      setIsFocused(true)
    }, [])

    const handleBlur = useCallback(() => {
      setIsFocused(false)
      if (value.length > 0) {
        setHasInteracted(true)
      }
    }, [value.length])

    const statusIcon = useMemo(() => {
      if (!hasInteracted || value.length === 0) return null
      
      if (error) {
        return <AlertCircle className="w-4 h-4 text-red-500" />
      }
      
      if (isValid) {
        return <Check className="w-4 h-4 text-emerald-500" />
      }
      
      if (value.length > 0) {
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      }
      
      return null
    }, [hasInteracted, value.length, error, isValid])

    const getBorderColor = () => {
      if (error) return 'border-red-300 dark:border-red-500/50'
      if (isValid && hasInteracted) return 'border-emerald-300 dark:border-emerald-500/50'
      if (isFocused) return 'border-sage-400 dark:border-emerald-400'
      return 'border-pearl-300 dark:border-[#0E3D2F]'
    }

    const getRingColor = () => {
      if (error) return 'focus:ring-red-200 dark:focus:ring-red-500/20'
      if (isValid && hasInteracted) return 'focus:ring-emerald-200 dark:focus:ring-emerald-500/20'
      return 'focus:ring-sage-300 dark:focus:ring-emerald-400/30'
    }

    return (
      <div className={cn("relative w-full", className)}>
        <div className="relative">
          {/* Input field */}
          <input
            ref={ref || inputRef}
            type="email"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "w-full pl-4 pr-10 py-3 rounded-lg",
              "bg-white dark:bg-[#0E3D2F]/50",
              "text-latte-800 dark:text-green-50",
              "placeholder:text-pearl-400 dark:placeholder:text-slate-500",
              "border transition-all duration-200",
              "focus:outline-none focus:ring-2",
              getBorderColor(),
              getRingColor(),
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "text-sm font-medium",
              // Animation for valid email
              isValid && hasInteracted && !error && 
              "animate-in slide-in-from-left-1 duration-500"
            )}
            autoComplete="email"
            spellCheck={false}
          />

          {/* Status icon with animation */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="transition-all duration-200">
              {statusIcon}
            </div>
          </div>

          {/* Animated underline for valid email */}
          {isValid && hasInteracted && !error && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-sage-400 to-emerald-400 animate-in slide-in-from-left-2 duration-700" />
          )}
        </div>

        {/* Error message with animation */}
        {error && hasInteracted && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-1 duration-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success message for valid email */}
        {isValid && hasInteracted && !error && (
          <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 animate-in slide-in-from-top-1 duration-300 flex items-center gap-1">
            <Check className="w-3 h-3 flex-shrink-0" />
            Email format is valid
          </div>
        )}
      </div>
    )
  }
)

EmailInput.displayName = 'EmailInput'

export default EmailInput