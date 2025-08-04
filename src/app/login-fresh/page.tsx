'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function FreshLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const passwordRef = useRef<HTMLInputElement>(null)
  
  // Simple email check
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidEmail(email)) {
      setIsFlipped(true)
      setTimeout(() => passwordRef.current?.focus(), 100)
    }
  }

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password.trim()) {
      handleLogin()
    }
  }

  const handleLogin = async () => {
    if (!isValidEmail(email) || !password.trim()) return
    
    setIsLoading(true)
    // Simulate login
    setTimeout(() => {
      setIsLoading(false)
      router.push('/dashboard')
    }, 1000)
  }

  const handleMicrosoftLogin = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      router.push('/dashboard')
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Signing in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/images/logos/wolthers-logo-green.svg"
            alt="Wolthers & Associates"
            width={200}
            height={54}
            className="h-12 w-auto mx-auto"
          />
          <h1 className="text-2xl font-bold text-amber-600 mt-4">
            Wolthers Travel Itineraries
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Sign in to access your travel dashboard
          </p>
        </div>

        {/* Login Form */}
        {!isFlipped ? (
          // Email Step
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {isValidEmail(email) && (
              <p className="mt-2 text-sm text-green-600">
                ✓ Valid email - Press Enter to continue
              </p>
            )}
          </div>
        ) : (
          // Password Step
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <button 
                onClick={() => setIsFlipped(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to email
              </button>
              <p className="text-sm text-gray-600">
                Press Enter to sign in
              </p>
            </div>
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleLogin}
          disabled={!isValidEmail(email) || !password.trim()}
          className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 mb-4"
        >
          Sign In
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Microsoft Sign In */}
        <button
          onClick={handleMicrosoftLogin}
          className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors duration-200 flex items-center justify-center mb-4"
        >
          <span className="mr-2">🔷</span>
          Sign in with Microsoft
        </button>

        {/* Forgot Password */}
        <div className="text-center">
          <button className="text-sm text-emerald-600 hover:text-emerald-800">
            Forgot your password?
          </button>
        </div>

        {/* Copyright */}
        <div className="text-center mt-8 text-xs text-gray-500">
          © {new Date().getFullYear()} Wolthers & Associates. All rights reserved.
        </div>
      </div>
    </div>
  )
}