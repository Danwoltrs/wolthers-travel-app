'use client'

import React, { useState, useRef } from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginTest() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  
  const passwordRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  
  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && emailRegex.test(email)) {
      setIsFlipped(true)
      setTimeout(() => passwordRef.current?.focus(), 100)
    }
  }

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password.trim()) {
      alert('Login submitted!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Login Test</h1>
        
        {!isFlipped ? (
          // Email Field - Ultra Simple
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Press Enter when done)
            </label>
            <div className="relative">
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder="Type your email..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              {emailRegex.test(email) && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Valid email - Press Enter to continue
                </div>
              )}
            </div>
          </div>
        ) : (
          // Password Field - Ultra Simple  
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password (Press Enter to submit)
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                placeholder="Type your password..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="absolute right-3 top-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <button 
              onClick={() => setIsFlipped(false)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to email
            </button>
          </div>
        )}
        
        <div className="text-center text-sm text-gray-500">
          {!isFlipped ? 'Step 1: Enter email and press Enter' : 'Step 2: Enter password and press Enter'}
        </div>
      </div>
    </div>
  )
}