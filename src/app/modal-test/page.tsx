'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useDialogs } from '@/hooks/use-modal'

export default function ModalTestPage() {
  const { alert, confirm, prompt } = useDialogs()

  const handleAlertTest = async () => {
    await alert(
      'This is a test alert message with longer content to show how it wraps.',
      'Test Alert',
      'info'
    )
  }

  const handleSuccessAlertTest = async () => {
    await alert(
      'Operation completed successfully!',
      'Success',
      'success'
    )
  }

  const handleWarningAlertTest = async () => {
    await alert(
      'This is a warning message that requires your attention.',
      'Warning',
      'warning'
    )
  }

  const handleErrorAlertTest = async () => {
    await alert(
      'An error occurred while processing your request.',
      'Error',
      'error'
    )
  }

  const handleConfirmTest = async () => {
    const result = await confirm(
      'Are you sure you want to proceed with this action? This cannot be undone.',
      'Confirm Action',
      'warning'
    )
    
    if (result) {
      await alert('You confirmed the action!', 'Confirmed', 'success')
    } else {
      await alert('You cancelled the action.', 'Cancelled', 'info')
    }
  }

  const handleDestructiveConfirmTest = async () => {
    const result = await confirm(
      'This will permanently delete all your data. This action cannot be undone.',
      'Delete Everything',
      'error'
    )
    
    if (result) {
      await alert('Data would be deleted!', 'Destructive Action', 'error')
    }
  }

  const handlePromptTest = async () => {
    const result = await prompt(
      'Please enter your name:',
      '',
      'User Input'
    )
    
    if (result) {
      await alert(`Hello, ${result}!`, 'Greeting', 'success')
    } else {
      await alert('You cancelled the input.', 'Cancelled', 'info')
    }
  }

  const handlePromptWithDefaultTest = async () => {
    const result = await prompt(
      'Enter a new title for this item:',
      'Default Title',
      'Edit Title'
    )
    
    if (result) {
      await alert(`New title: "${result}"`, 'Title Updated', 'success')
    }
  }

  return (
    <div className="min-h-screen bg-pearl-50 dark:bg-[#212121] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-pearl-900 dark:text-pearl-100 mb-2">
          Custom Modal System Test
        </h1>
        <p className="text-pearl-600 dark:text-pearl-400 mb-8">
          Test all modal types with various configurations
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Alert Modals */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Alert Modals</h2>
            <div className="space-y-3">
              <Button 
                onClick={handleAlertTest}
                variant="outline"
                className="w-full"
              >
                Info Alert
              </Button>
              <Button 
                onClick={handleSuccessAlertTest}
                variant="default"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Success Alert
              </Button>
              <Button 
                onClick={handleWarningAlertTest}
                variant="outline"
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Warning Alert
              </Button>
              <Button 
                onClick={handleErrorAlertTest}
                variant="destructive"
                className="w-full"
              >
                Error Alert
              </Button>
            </div>
          </div>

          {/* Confirm Modals */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Confirm Modals</h2>
            <div className="space-y-3">
              <Button 
                onClick={handleConfirmTest}
                variant="outline"
                className="w-full"
              >
                Standard Confirm
              </Button>
              <Button 
                onClick={handleDestructiveConfirmTest}
                variant="destructive"
                className="w-full"
              >
                Destructive Confirm
              </Button>
            </div>
          </div>

          {/* Input Modals */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Input Modals</h2>
            <div className="space-y-3">
              <Button 
                onClick={handlePromptTest}
                variant="outline"
                className="w-full"
              >
                Empty Input
              </Button>
              <Button 
                onClick={handlePromptWithDefaultTest}
                variant="outline"
                className="w-full"
              >
                Input with Default
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200/30 dark:border-emerald-800/30">
          <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
            Modal Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-emerald-700 dark:text-emerald-300">
            <ul className="space-y-2">
              <li>• Glassmorphic background with blur effect</li>
              <li>• Emerald/golden brand color scheme</li>
              <li>• Smooth fade and scale animations</li>
              <li>• Proper focus management</li>
              <li>• ESC key support</li>
            </ul>
            <ul className="space-y-2">
              <li>• Click outside to close (non-destructive modals)</li>
              <li>• Mobile responsive design</li>
              <li>• Dark mode support</li>
              <li>• Type-based icons and styling</li>
              <li>• Promise-based API for easy integration</li>
            </ul>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.history.back()}
            variant="ghost"
          >
            ← Back to Previous Page
          </Button>
        </div>
      </div>
    </div>
  )
}