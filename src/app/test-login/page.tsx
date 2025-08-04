'use client'

import React from 'react'
import { AnimatedEmailLogin } from '@/components/auth/AnimatedEmailLogin'

export default function TestLoginPage() {
  const handleSubmit = async (email: string, password: string) => {
    console.log('Login submitted:', { email, password })
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-50 via-amber-50/30 to-emerald-50/20 dark:from-[#212121] dark:via-[#1a1a1a] dark:to-[#0E3D2F]/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-latte-800 dark:text-green-50 mb-2">
            Email Login Test
          </h1>
          <p className="text-pearl-600 dark:text-pearl-300 text-sm">
            Test the improved email validation behavior
          </p>
        </div>
        
        <div className="bg-white/70 dark:bg-[#0E3D2F]/30 backdrop-blur-sm rounded-lg border border-pearl-300/60 dark:border-emerald-800/40 p-6">
          <AnimatedEmailLogin 
            onSubmit={handleSubmit}
          />
        </div>
        
        <div className="mt-6 text-sm text-pearl-600 dark:text-pearl-400 space-y-2">
          <p><strong>Test Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Type email instantly without lag</li>
            <li>Validation only triggers on blur or after 1.5s pause</li>
            <li>No validation indicators until flip</li>
            <li>Works immediately on first page load</li>
            <li>Try: test@example.com or ABC123</li>
          </ul>
        </div>
      </div>
    </div>
  )
}