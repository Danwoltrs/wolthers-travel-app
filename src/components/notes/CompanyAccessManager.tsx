'use client'

import React, { useState, useEffect } from 'react'
import { Users, Building2, Check, X, Plus } from 'lucide-react'

interface Company {
  id: string
  name: string
  representatives?: Array<{ name: string; email: string }>
}

interface CompanyAccessManagerProps {
  activityId: string
  companies: Company[]
  onCompaniesChange: (companies: Company[]) => void
  readOnly?: boolean
}

export default function CompanyAccessManager({
  activityId,
  companies,
  onCompaniesChange,
  readOnly = false
}: CompanyAccessManagerProps) {
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch available companies from the trip context
  useEffect(() => {
    const fetchTripCompanies = async () => {
      if (!activityId) return

      setLoading(true)
      try {
        // First get the trip ID from the activity
        const activityResponse = await fetch(`/api/activities/${activityId}`, {
          credentials: 'include'
        })
        
        if (activityResponse.ok) {
          const activity = await activityResponse.json()
          const tripId = activity.trip_id

          // Then get the trip companies
          const tripResponse = await fetch(`/api/trips/${tripId}`, {
            credentials: 'include'
          })
          
          if (tripResponse.ok) {
            const trip = await tripResponse.json()
            const tripCompanies = trip.client || []
            
            // Convert trip companies to our format
            const formattedCompanies: Company[] = tripCompanies.map((company: any) => ({
              id: company.id,
              name: company.fantasyName || company.name || company.companyName,
              representatives: [] // TODO: Fetch company representatives if available
            }))
            
            setAvailableCompanies(formattedCompanies)
          }
        }
      } catch (error) {
        console.error('Failed to fetch trip companies:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTripCompanies()
  }, [activityId])

  const addCompany = (company: Company) => {
    const isAlreadyAdded = companies.some(c => c.id === company.id)
    if (!isAlreadyAdded) {
      onCompaniesChange([...companies, company])
    }
    setShowAddModal(false)
  }

  const removeCompany = (companyId: string) => {
    onCompaniesChange(companies.filter(c => c.id !== companyId))
  }

  const updateCompanyRepresentatives = (companyId: string, representatives: Array<{ name: string; email: string }>) => {
    const updatedCompanies = companies.map(company =>
      company.id === companyId
        ? { ...company, representatives }
        : company
    )
    onCompaniesChange(updatedCompanies)
  }

  if (readOnly) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Companies with Access ({companies.length})
          </span>
        </div>
        <div className="space-y-1">
          {companies.map(company => (
            <div key={company.id} className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{company.name}</span>
              {company.representatives && company.representatives.length > 0 && (
                <span className="text-gray-500">
                  {' '} - {company.representatives.map(r => r.name).join(', ')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Companies with Access ({companies.length})
          </span>
        </div>
        
        {!loading && availableCompanies.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1 text-xs bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Company</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {companies.map(company => (
          <div key={company.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {company.name}
                </span>
              </div>
              {company.representatives && company.representatives.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {company.representatives.map(r => r.name).join(', ')}
                </div>
              )}
            </div>
            
            <button
              onClick={() => removeCompany(company.id)}
              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Remove access"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No companies have access to these notes yet
        </div>
      )}

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-70 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a] max-w-md w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add Company Access</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-64 overflow-auto">
              <div className="space-y-2">
                {availableCompanies
                  .filter(company => !companies.some(c => c.id === company.id))
                  .map(company => (
                    <button
                      key={company.id}
                      onClick={() => addCompany(company)}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {company.name}
                      </div>
                    </button>
                  ))}
              </div>
              
              {availableCompanies.filter(company => !companies.some(c => c.id === company.id)).length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  All available companies already have access
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}