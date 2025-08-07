'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { createMicrosoftAuthProvider } from '@/lib/microsoft-auth'

interface MicrosoftSignInButtonProps {
  className?: string
  onSignIn?: () => void
  onSuccess?: (user: any) => void
  onError?: (error: string) => void
  disabled?: boolean
}

export function MicrosoftSignInButton({ 
  className, 
  onSignIn,
  onSuccess,
  onError,
  disabled = false 
}: MicrosoftSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    if (disabled || isLoading) return
    
    setIsLoading(true)
    try {
      // Use the custom onSignIn if provided, otherwise use Microsoft auth
      if (onSignIn) {
        await onSignIn()
      } else {
        // Create Microsoft auth provider with dynamic redirect URI
        const currentUrl = window.location.origin
        const redirectUri = `${currentUrl}/auth/callback`
        
        const authProvider = createMicrosoftAuthProvider(redirectUri)
        
        // Use popup authentication
        const result = await authProvider.signInWithPopup()
        
        if (result.success) {
          onSuccess?.(result.user)
          // Refresh page to update auth state
          window.location.reload()
        } else {
          onError?.(result.error || 'Authentication failed')
        }
      }
    } catch (error) {
      console.error('Microsoft sign-in error:', error)
      onError?.('Failed to initiate Microsoft sign-in')
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={disabled || isLoading}
      className={cn(
        "group relative w-full overflow-hidden rounded-lg border transition-all duration-300",
        "bg-[#2f2f2f] hover:bg-[#1a1a1a] border-[#404040] hover:border-[#505050]",
        "dark:bg-[#2f2f2f] dark:hover:bg-[#1a1a1a] dark:border-[#404040] dark:hover:border-[#505050]",
        "focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2 focus:ring-offset-transparent",
        "transform hover:scale-[1.02] active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        "shadow-lg hover:shadow-xl",
        className
      )}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0078d4]/0 via-[#0078d4]/5 to-[#0078d4]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-center px-4 py-3 sm:py-4">
        {/* Microsoft Logo */}
        <div className="flex items-center mr-3">
          <div className="w-4 h-4 sm:w-5 sm:h-5 relative">
            {/* Microsoft squares - exact colors from official logo */}
            <div className="absolute top-0 left-0 w-[7px] h-[7px] sm:w-[9px] sm:h-[9px] bg-[#f25022]"></div>
            <div className="absolute top-0 left-[8px] sm:left-[10px] w-[7px] h-[7px] sm:w-[9px] sm:h-[9px] bg-[#7fba00]"></div>
            <div className="absolute top-[8px] sm:top-[10px] left-0 w-[7px] h-[7px] sm:w-[9px] sm:h-[9px] bg-[#00a4ef]"></div>
            <div className="absolute top-[8px] sm:top-[10px] left-[8px] sm:left-[10px] w-[7px] h-[7px] sm:w-[9px] sm:h-[9px] bg-[#ffb900]"></div>
          </div>
        </div>

        {/* Loading spinner */}
        {isLoading && (
          <div className="mr-2 sm:mr-3">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Button text */}
        <span className="text-white font-medium text-sm sm:text-sm tracking-wide">
          {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
        </span>
      </div>

      {/* Subtle shine effect */}
      <div className="absolute inset-0 -left-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-full transition-all duration-1000 ease-out" />
    </button>
  )
}