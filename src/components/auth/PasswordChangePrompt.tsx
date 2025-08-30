'use client'

import React, { useState } from 'react'
import { X, Key, Shield, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PasswordChangePromptProps {
  isOpen: boolean
  onClose: () => void
  onOpenUserPanel: () => void
  userName?: string
}

const PasswordChangePrompt: React.FC<PasswordChangePromptProps> = ({
  isOpen,
  onClose,
  onOpenUserPanel,
  userName
}) => {
  const [isVisible, setIsVisible] = useState(isOpen)

  React.useEffect(() => {
    setIsVisible(isOpen)
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 150) // Allow animation to complete
  }

  const handleSetPassword = () => {
    handleClose()
    onOpenUserPanel()
  }

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={cn(
            "relative bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl",
            "border border-pearl-200 dark:border-[#2a2a2a]",
            "max-w-md w-full p-6",
            "transform transition-all duration-200",
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-golden-100 dark:bg-golden-400/10 rounded-full flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-golden-600 dark:text-golden-400" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-golden-400 mb-2">
              Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              You've successfully logged in with your email verification code.
            </p>
          </div>

          {/* Security notice */}
          <div className="bg-golden-50 dark:bg-golden-400/5 border border-golden-200 dark:border-golden-400/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-golden-600 dark:text-golden-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <h3 className="font-semibold text-golden-800 dark:text-golden-300 mb-1">
                  Enhance your security
                </h3>
                <p className="text-golden-700 dark:text-golden-400/80">
                  For better account protection, we recommend setting up a password. 
                  This allows you to sign in faster in the future.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSetPassword}
              className="w-full bg-golden-500 hover:bg-golden-600 dark:bg-golden-600 dark:hover:bg-golden-700 text-white font-medium py-3 transition-colors"
            >
              <Key className="w-4 h-4 mr-2" />
              Set up password now
            </Button>
            
            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-3 transition-colors"
            >
              Maybe later
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            You can always set up a password later from your user profile.
          </p>
        </div>
      </div>
    </>
  )
}

export default PasswordChangePrompt