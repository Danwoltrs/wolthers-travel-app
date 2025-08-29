'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import CompanyDashboard from '@/components/companies/CompanyDashboard'

export default function CompanyPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [company, setCompany] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user has permission to view this company
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const isWolthersStaff = user.isGlobalAdmin || user.companyId === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
      
      // External users can only view their own company
      if (!isWolthersStaff && user.companyId !== companyId) {
        router.push('/dashboard')
        return
      }
      
      fetchCompanyData()
    }
  }, [user, isAuthenticated, authLoading, companyId, router])

  const fetchCompanyData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch real company data from API
      const response = await fetch(`/api/companies/${companyId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch company data')
      }
      
      const companyData = await response.json()
      setCompany(companyData)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-beige-100 dark:bg-[#212121] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-pearl-600 dark:text-pearl-300">Loading company dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-beige-100 dark:bg-[#212121] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-beige-100 dark:bg-[#212121] pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-pearl-600 dark:text-pearl-300">Company not found</p>
        </div>
      </div>
    )
  }

  return (
    <CompanyDashboard
      company={company}
      onBack={handleBack}
      showSidebar={false} // No sidebar for external users
      viewerCompanyId={user?.companyId} // Pass viewer's company ID for context
    />
  )
}