'use client'

import React, { useState } from 'react'
import EmailInput from '@/components/auth/EmailInput'
import PasswordInput from '@/components/auth/PasswordInput'
import OTPInputWrapper from '@/components/auth/OTPInputWrapper'
import ForgotPassword from '@/components/auth/ForgotPassword'
import DevAccountSwitcher from '@/components/auth/DevAccountSwitcher'
import { MicrosoftSignInButton } from '@/components/auth/MicrosoftSignInButton'
import { AnimatedEmailLogin } from '@/components/auth/AnimatedEmailLogin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useDialogs } from '@/hooks/use-modal'

export default function AuthDemoPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { alert } = useDialogs()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-50 via-amber-50/30 to-emerald-50/20 dark:from-[#212121] dark:via-[#1a1a1a] dark:to-[#0E3D2F]/10 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-pearl-900 dark:text-pearl-100 mb-2">
          Authentication Components Demo
        </h1>
        <p className="text-pearl-600 dark:text-pearl-400 mb-8">
          Interactive demonstration of all authentication components
        </p>

        <Tabs defaultValue="components" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="components">Individual Components</TabsTrigger>
            <TabsTrigger value="flows">Complete Flows</TabsTrigger>
            <TabsTrigger value="states">States & Variants</TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="space-y-8">
            {/* Email Input Component */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Email Input Component</h2>
              <div className="max-w-md">
                <EmailInput
                  value={email}
                  onChange={setEmail}
                  onValidEmail={setIsValidEmail}
                  placeholder="Enter your email address"
                />
                <p className="mt-2 text-sm text-pearl-600 dark:text-pearl-400">
                  Valid email: {isValidEmail ? 'Yes ✅' : 'No ❌'}
                </p>
              </div>
            </div>

            {/* Password Input Component */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Password Input Component</h2>
              <div className="max-w-md space-y-4">
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  isSlideIn={true}
                  showCriteria={true}
                />
                <p className="text-sm text-pearl-600 dark:text-pearl-400">
                  Password length: {password.length} characters
                </p>
              </div>
            </div>

            {/* Microsoft Sign-In Button */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Microsoft Sign-In Button</h2>
              <div className="max-w-md space-y-4">
                <MicrosoftSignInButton
                  onSignIn={async () => {
                    setIsLoading(true)
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    setIsLoading(false)
                    await alert(
                      'Microsoft sign-in process initiated successfully!',
                      'Microsoft Sign-In',
                      'info'
                    )
                  }}
                  disabled={isLoading}
                />
                <p className="text-sm text-pearl-600 dark:text-pearl-400">
                  Click to see loading state animation
                </p>
              </div>
            </div>

            {/* OTP Input Component */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">OTP Input Component</h2>
              <div className="max-w-md">
                <OTPInputWrapper
                  onComplete={async (code) => {
                    await alert(
                      `OTP code entered: ${code}`,
                      'OTP Verification',
                      'success'
                    )
                  }}
                  onResend={async () => {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    return { success: true, message: 'Code resent!' }
                  }}
                  isLoading={false}
                />
                <p className="mt-4 text-sm text-pearl-600 dark:text-pearl-400">
                  Try entering 123456 or paste a 6-digit code
                </p>
              </div>
            </div>

            {/* Dev Account Switcher */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Development Account Switcher</h2>
              <p className="text-sm text-pearl-600 dark:text-pearl-400 mb-4">
                This component is positioned fixed on the actual login page
              </p>
              <div className="relative h-64 bg-pearl-100 dark:bg-[#0a0a0a] rounded-lg">
                <DevAccountSwitcher 
                  onSelectAccount={async (account) => {
                    await alert(
                      `Selected account: ${account.fullName} (${account.role})`,
                      'Account Selected',
                      'info'
                    )
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="flows" className="space-y-8">
            {/* Animated Email Login Flow */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Animated Email Login Flow</h2>
              <div className="max-w-md mx-auto">
                <AnimatedEmailLogin
                  onSubmit={async (email, password) => {
                    setIsLoading(true)
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    setIsLoading(false)
                    await alert(
                      `Login attempt successful!\n\nEmail: ${email}\nPassword: ${password}`,
                      'Login Demo',
                      'success'
                    )
                  }}
                />
                <p className="mt-4 text-sm text-pearl-600 dark:text-pearl-400 text-center">
                  Enter a valid email to see the password field animate in
                </p>
              </div>
            </div>

            {/* Forgot Password Flow */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Forgot Password Flow</h2>
              <div className="max-w-md mx-auto">
                <ForgotPassword
                  onSendReset={async (email) => {
                    await new Promise(resolve => setTimeout(resolve, 1500))
                    return { success: true, message: 'Reset email sent!' }
                  }}
                  onBack={async () => {
                    await alert(
                      'Navigating back to login page...',
                      'Back to Login',
                      'info'
                    )
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="states" className="space-y-8">
            {/* Loading States */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Loading States</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Microsoft Button Loading</h3>
                  <MicrosoftSignInButton
                    onSignIn={() => {}}
                    disabled={true}
                  />
                </div>
                <div>
                  <h3 className="font-medium mb-2">OTP Loading</h3>
                  <OTPInputWrapper
                    onComplete={() => {}}
                    isLoading={true}
                  />
                </div>
              </div>
            </div>

            {/* Error States */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Error States</h2>
              <div className="space-y-4">
                <div className="max-w-md">
                  <EmailInput
                    value="invalid-email"
                    onChange={() => {}}
                    onValidEmail={() => {}}
                    error="Please enter a valid email address"
                  />
                </div>
                <div className="max-w-md">
                  <PasswordInput
                    value="weak"
                    onChange={() => {}}
                    error="Password must be at least 8 characters"
                    showCriteria={true}
                  />
                </div>
              </div>
            </div>

            {/* Success States */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Success States</h2>
              <div className="max-w-md">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                    Email Sent Successfully
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    We've sent a verification code to your email address. Please check your inbox.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-200/30 dark:border-amber-800/30">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Testing Instructions
          </h3>
          <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
            <li>• Email validation triggers on valid email format (e.g., user@example.com)</li>
            <li>• Password field slides in when valid email is detected</li>
            <li>• OTP input accepts paste and keyboard navigation</li>
            <li>• All components support dark mode</li>
            <li>• Development account switcher only shows in dev mode</li>
          </ul>
        </div>
      </div>
    </div>
  )
}