'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Lock, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordCriteria {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  onValidPassword?: (isValid: boolean) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  showCriteria?: boolean
  minLength?: number
  className?: string
  isSlideIn?: boolean
  onSlideInComplete?: () => void
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ 
    value, 
    onChange, 
    onValidPassword, 
    error, 
    disabled = false, 
    placeholder = "Enter your password",
    showCriteria = false,
    minLength = 8,
    className,
    isSlideIn = false,
    onSlideInComplete
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)
    const [criteria, setCriteria] = useState<PasswordCriteria>({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false
    })
    const [isAnimating, setIsAnimating] = useState(isSlideIn)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (isSlideIn) {
        const timer = setTimeout(() => {
          setIsAnimating(false)
          onSlideInComplete?.()
        }, 500)
        return () => clearTimeout(timer)
      }
    }, [isSlideIn, onSlideInComplete])

    useEffect(() => {
      const newCriteria: PasswordCriteria = {
        minLength: value.length >= minLength,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      }
      
      setCriteria(newCriteria)
      
      const isValid = Object.values(newCriteria).every(Boolean) && value.length > 0
      onValidPassword?.(isValid)
    }, [value, minLength, onValidPassword])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onChange(newValue)
      if (!hasInteracted && newValue.length > 0) {
        setHasInteracted(true)
      }
    }

    const handleFocus = () => {
      setIsFocused(true)
      // Auto-focus the input when sliding in
      if (isSlideIn && inputRef.current) {
        inputRef.current.focus()
      }
    }

    const handleBlur = () => {
      setIsFocused(false)
      if (value.length > 0) {
        setHasInteracted(true)
      }
    }

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    const getBorderColor = () => {
      if (error) return 'border-red-300 dark:border-red-500/50'
      if (isFocused) return 'border-sage-400 dark:border-emerald-400'
      return 'border-pearl-300 dark:border-[#0E3D2F]'
    }

    const getRingColor = () => {
      if (error) return 'focus:ring-red-200 dark:focus:ring-red-500/20'
      return 'focus:ring-sage-300 dark:focus:ring-emerald-400/30'
    }

    const isPasswordValid = Object.values(criteria).every(Boolean) && value.length > 0

    return (
      <div className={cn(
        "w-full transition-all duration-500 ease-out",
        isAnimating ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0",
        className
      )}>
        <div className="relative">
          {/* Lock icon with animation */}
          <div className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300",
            isFocused || value.length > 0 
              ? "text-sage-600 dark:text-emerald-400 scale-110" 
              : "text-pearl-400 dark:text-slate-500"
          )}>
            <Lock className="w-4 h-4" />
          </div>

          {/* Input field */}
          <input
            ref={ref || inputRef}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "w-full pl-10 pr-12 py-3 rounded-lg",
              "bg-white dark:bg-[#0E3D2F]/50",
              "text-latte-800 dark:text-green-50",
              "placeholder:text-pearl-400 dark:placeholder:text-slate-500",
              "border transition-all duration-200",
              "focus:outline-none focus:ring-2",
              getBorderColor(),
              getRingColor(),
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "text-sm font-medium"
            )}
            autoComplete="current-password"
          />

          {/* Toggle password visibility button */}
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled || value.length === 0}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "p-1 rounded-md transition-all duration-200",
              "hover:bg-pearl-100 dark:hover:bg-[#0E3D2F]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              value.length === 0 ? "text-pearl-400 dark:text-slate-500" : "text-sage-600 dark:text-emerald-400"
            )}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Error message */}
        {error && hasInteracted && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-1 duration-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Password criteria */}
        {showCriteria && hasInteracted && !error && (
          <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-500">
            <div className="text-xs font-medium text-pearl-600 dark:text-slate-400 mb-2">
              Password requirements:
            </div>
            <div className="grid grid-cols-1 gap-1">
              <CriteriaItem 
                met={criteria.minLength} 
                text={`At least ${minLength} characters`} 
              />
              <CriteriaItem 
                met={criteria.hasUppercase} 
                text="One uppercase letter" 
              />
              <CriteriaItem 
                met={criteria.hasLowercase} 
                text="One lowercase letter" 
              />
              <CriteriaItem 
                met={criteria.hasNumber} 
                text="One number" 
              />
              <CriteriaItem 
                met={criteria.hasSpecialChar} 
                text="One special character" 
              />
            </div>
            
            {/* Overall status */}
            {value.length > 0 && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium mt-3 pt-2 border-t",
                "border-pearl-200 dark:border-[#0E3D2F]",
                isPasswordValid 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-amber-600 dark:text-amber-400"
              )}>
                {isPasswordValid ? (
                  <>
                    <Check className="w-3 h-3" />
                    Password is strong
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    Password needs improvement
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

interface CriteriaItemProps {
  met: boolean
  text: string
}

const CriteriaItem: React.FC<CriteriaItemProps> = ({ met, text }) => (
  <div className={cn(
    "flex items-center gap-2 text-xs transition-all duration-300",
    met ? "text-emerald-600 dark:text-emerald-400" : "text-pearl-500 dark:text-slate-500"
  )}>
    <div className={cn(
      "w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300",
      met 
        ? "bg-emerald-100 dark:bg-emerald-500/20" 
        : "bg-pearl-100 dark:bg-slate-700"
    )}>
      {met ? (
        <Check className="w-2 h-2 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <X className="w-2 h-2 text-pearl-400 dark:text-slate-500" />
      )}
    </div>
    <span className={cn(met && "font-medium")}>{text}</span>
  </div>
)

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput