'use client'

import { useEffect, useRef, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, User, Mail, Phone, Building, UserCheck } from 'lucide-react'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    token: '',
    email: '',
    name: '',
    whatsapp: '',
    company: '',
    role: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Pre-fill form with invitation data from URL params
    const token = searchParams.get('token') || ''
    const email = searchParams.get('email') || ''
    const name = searchParams.get('name') || ''
    const whatsapp = searchParams.get('whatsapp') || ''
    const company = searchParams.get('company') || ''
    const role = searchParams.get('role') || ''

    setFormData({
      token,
      email,
      name,
      whatsapp,
      company,
      role,
      password: '',
      confirmPassword: ''
    })
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in both password fields')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    
    if (!formData.email || !formData.name) {
      setError('Email and name are required')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setError('')
    
    try {
      console.log('Creating account with invitation token:', formData.token.substring(0, 10) + '...')
      
      // Create account using invitation token
      const response = await fetch('/api/auth/register-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          token: formData.token,
          password: formData.password,
          whatsapp: formData.whatsapp || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Registration failed:', result.error)
        setError(result.error || 'Failed to create account')
        return
      }

      console.log('Account created successfully')
      
      // Redirect to dashboard on success
      router.push('/dashboard?welcome=true')
      
    } catch (error) {
      console.error('Registration error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-pearl-50 dark:from-[#0E3D2F] dark:via-[#1A4B3A] dark:to-[#0E3D2F]">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-pearl-800 rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 dark:bg-emerald-700 px-8 py-6 text-center">
            <img 
              src="https://wolthers.com/images/wolthers-logo-green.png" 
              alt="Wolthers & Associates" 
              className="w-32 h-auto mx-auto mb-4 brightness-0 invert"
            />
            <h1 className="text-xl font-semibold text-white">
              Create Your Account
            </h1>
            <p className="text-emerald-100 text-sm mt-2">
              Complete your invitation to join {formData.company}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            {/* Invitation Summary */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                Invitation Details
              </h3>
              <div className="space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <Building className="w-3 h-3" />
                  <span><strong>Company:</strong> {formData.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3 h-3" />
                  <span><strong>Role:</strong> {formatRole(formData.role)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  <span><strong>Email:</strong> {formData.email}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '36px' }}
                    className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email Field (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    style={{ paddingLeft: '36px' }}
                    className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    readOnly
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Email address is set by your invitation
                </p>
              </div>

              {/* WhatsApp Field (Optional) */}
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp Number <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                    style={{ paddingLeft: '36px' }}
                    className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-2 px-4 rounded-md font-medium transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By creating an account, you agree to join {formData.company} on the Wolthers Travel Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Register() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-pearl-50 dark:from-[#0E3D2F] dark:via-[#1A4B3A] dark:to-[#0E3D2F]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-pearl-700 dark:text-pearl-300">
            Loading registration form...
          </h2>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}