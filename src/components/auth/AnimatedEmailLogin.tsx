'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { FlipCard } from './FlipCard'
import { cn } from '@/lib/utils'

interface AnimatedEmailLoginProps {
  onSubmit?: (email: string, password: string) => Promise<void>
  className?: string
}

export function AnimatedEmailLogin({ onSubmit, className }: AnimatedEmailLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const passwordRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  
  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Focus email field on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      emailRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleFlipComplete = (flipped: boolean) => {
    if (flipped) {
      setTimeout(() => {
        passwordRef.current?.focus()
      }, 100)
    } else {
      setTimeout(() => {
        emailRef.current?.focus()
      }, 100)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailRegex.test(email) || !password.trim() || isLoading) return

    setIsLoading(true)
    try {
      await onSubmit?.(email, password)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && emailRegex.test(email) && !isFlipped) {
      setIsFlipped(true)
    }
  }

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && emailRegex.test(email) && password.trim() && !isLoading) {
      e.preventDefault()
      const formEvent = {
        preventDefault: () => {},
      } as React.FormEvent
      handleSubmit(formEvent)
    }
  }

  // Email field component - Ultra simple like test page
  const EmailField = () => (
    <div className="h-16">
      <input
        ref={emailRef}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleEmailKeyDown}
        placeholder="daniel@wolthers.com"
        className="w-full h-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
        autoComplete="email"
        disabled={isLoading}
        autoFocus
      />
      {emailRegex.test(email) && !isFlipped && (
        <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
          ✓ Valid email - Press Enter to continue
        </div>
      )}
    </div>
  )

  // Password field component - Ultra simple like test page
  const PasswordField = () => (
    <div className="h-16">
      <div className="relative">
        <input
          ref={passwordRef}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handlePasswordKeyDown}
          placeholder="Enter your password and press Enter"
          className="w-full h-16 px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
          autoComplete="current-password"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200 transition-colors duration-200"
          tabIndex={-1}
          disabled={isLoading}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* FlipCard for Email to Password transition */}
      <FlipCard
        frontContent={<EmailField />}
        backContent={<PasswordField />}
        isFlipped={isFlipped}
        flipDuration={400}
        onFlipComplete={handleFlipComplete}
        className="h-16"
      />

      {/* Submit Button */}
      <div className={cn(
        "transition-all duration-500 ease-out",
        isFlipped && password.trim()
          ? "opacity-100 transform translate-y-0" 
          : "opacity-50 transform translate-y-2"
      )}>
        <button
          type="submit"
          disabled={!emailRegex.test(email) || !password.trim() || isLoading}
          className={cn(
            "group relative w-full overflow-hidden rounded-lg transition-all duration-300",
            "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800",
            "dark:from-emerald-500 dark:to-emerald-600 dark:hover:from-emerald-600 dark:hover:to-emerald-700",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent",
            "transform hover:scale-[1.02] active:scale-[0.98]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
            "shadow-lg hover:shadow-xl"
          )}
        >
          <div className="relative flex items-center justify-center px-4 py-3 sm:py-4">
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin text-white" />
                <span className="text-white font-medium text-sm">Signing in...</span>
              </>
            ) : (
              <>
                <span className="text-white font-medium text-sm mr-2">Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 -left-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-full transition-all duration-1000 ease-out" />
        </button>
      </div>
    </form>
  )
}