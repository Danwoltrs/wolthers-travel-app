import React, { useState } from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  icon?: React.ReactNode
  isLoading?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  icon,
  isLoading = false
}: ConfirmationModalProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  
  if (!isOpen) return null

  const loading = isLoading || internalLoading

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose()
    }
  }

  const handleConfirm = async () => {
    try {
      setInternalLoading(true)
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Error in confirmation action:', error)
      // Don't close modal on error so user can retry or cancel
    } finally {
      setInternalLoading(false)
    }
  }

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
      border: 'border-red-200 dark:border-red-800/40'
    },
    warning: {
      iconBg: 'bg-amber-100 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
      border: 'border-amber-200 dark:border-amber-800/40'
    },
    info: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
      border: 'border-blue-200 dark:border-blue-800/40'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl max-w-md w-full border border-pearl-200 dark:border-[#2a2a2a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
                {icon || <AlertTriangle className={`w-5 h-5 ${styles.iconColor}`} />}
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            </div>
            
            <button
              onClick={loading ? undefined : onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111111] rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              onClick={loading ? undefined : onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${styles.confirmBtn} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}