import React, { useState, useEffect } from 'react'
import { MapPin, Building2, Users, Search, Plus, X } from 'lucide-react'
import type { TripFormData } from './TripCreationModal'
import type { Company } from '@/types'

interface CompanySelectionStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

interface HostCompany extends Company {
  visitingParticipants: string[] // IDs of buyer companies that will visit this host
  estimatedVisitDuration?: number // hours
  preferredVisitTime?: 'morning' | 'afternoon' | 'full_day'
  notes?: string
}

export default function CompanySelectionStep({ formData, updateFormData }: CompanySelectionStepProps) {
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [hostCompanies, setHostCompanies] = useState<HostCompany[]>([])

  // Get buyer companies from formData
  const buyerCompanies = formData.companies || []
  const wolthersTeam = formData.participants || []

  // Load companies from database
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/companies', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch companies')
        }
        
        const companies = await response.json()
        setAvailableCompanies(companies)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load companies')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  // Extract unique regions from companies
  const regions = ['all', ...new Set(availableCompanies.map(c => 
    c.address ? extractRegion(c.address) : 'Unknown'
  ).filter(Boolean))]

  function extractRegion(address: string): string {
    // Simple region extraction - you might want to make this more sophisticated
    const parts = address.split(',').map(p => p.trim())
    return parts[parts.length - 1] || parts[parts.length - 2] || 'Unknown'
  }

  // Filter companies based on search and region
  const filteredCompanies = availableCompanies.filter(company => {
    const matchesSearch = !searchTerm || 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.address?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRegion = selectedRegion === 'all' || 
      extractRegion(company.address || '').toLowerCase().includes(selectedRegion.toLowerCase())
    
    // Exclude companies that are already buyer companies
    const notBuyerCompany = !buyerCompanies.some(buyer => buyer.id === company.id)
    
    return matchesSearch && matchesRegion && notBuyerCompany
  })

  const addHostCompany = (company: Company) => {
    if (hostCompanies.some(hc => hc.id === company.id)) return

    const newHostCompany: HostCompany = {
      ...company,
      visitingParticipants: [], // Initialize empty - user will assign
      estimatedVisitDuration: 4, // Default 4 hours
      preferredVisitTime: 'morning',
      notes: ''
    }

    const updatedHostCompanies = [...hostCompanies, newHostCompany]
    setHostCompanies(updatedHostCompanies)
    
    // Update formData
    updateFormData({ hostCompanies: updatedHostCompanies })
  }

  const removeHostCompany = (companyId: string) => {
    const updatedHostCompanies = hostCompanies.filter(hc => hc.id !== companyId)
    setHostCompanies(updatedHostCompanies)
    updateFormData({ hostCompanies: updatedHostCompanies })
  }

  const updateHostCompany = (companyId: string, updates: Partial<HostCompany>) => {
    const updatedHostCompanies = hostCompanies.map(hc => 
      hc.id === companyId ? { ...hc, ...updates } : hc
    )
    setHostCompanies(updatedHostCompanies)
    updateFormData({ hostCompanies: updatedHostCompanies })
  }

  const toggleParticipantForHost = (hostId: string, buyerCompanyId: string) => {
    const host = hostCompanies.find(h => h.id === hostId)
    if (!host) return

    const isCurrentlyAssigned = host.visitingParticipants.includes(buyerCompanyId)
    const updatedParticipants = isCurrentlyAssigned 
      ? host.visitingParticipants.filter(p => p !== buyerCompanyId)
      : [...host.visitingParticipants, buyerCompanyId]

    updateHostCompany(hostId, { visitingParticipants: updatedParticipants })
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading companies...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-emerald-300 mb-2">
          Select Host Companies
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Choose companies that will host your travel group during the trip.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search companies by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Region Filter */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {regions.map(region => (
                <option key={region} value={region}>
                  {region === 'all' ? 'All Regions' : region}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Available Companies Grid */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300 mb-4">
          Available Companies ({filteredCompanies.length})
        </h3>
        
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm || selectedRegion !== 'all' 
              ? 'No companies match your search criteria'
              : 'No companies available'
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map(company => (
              <div 
                key={company.id}
                className="border border-gray-200 dark:border-[#3a3a3a] rounded-lg p-4 hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-emerald-300">
                      {company.name}
                    </h4>
                    {company.address && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {company.address}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => addHostCompany(company)}
                    className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    title="Add as host company"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  Region: {extractRegion(company.address || 'Unknown')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Host Companies */}
      {hostCompanies.length > 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300">
                Selected Host Companies
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({hostCompanies.length} selected)
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Configure visit details and assign which buyer companies will visit each host.
          </p>

          <div className="space-y-6">
            {hostCompanies.map((hostCompany) => (
              <div key={hostCompany.id} className="border border-gray-200 dark:border-[#3a3a3a] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-emerald-300">
                      {hostCompany.name}
                    </h4>
                    {hostCompany.address && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {hostCompany.address}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeHostCompany(hostCompany.id)}
                    className="text-red-500 hover:text-red-700 text-sm p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Buyer Company Assignments */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Visiting Buyer Companies
                    </h5>
                    <div className="space-y-2">
                      {buyerCompanies.length > 0 ? (
                        buyerCompanies.map((buyer) => (
                          <label key={buyer.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={hostCompany.visitingParticipants.includes(buyer.id)}
                              onChange={() => toggleParticipantForHost(hostCompany.id, buyer.id)}
                              className="rounded border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {buyer.name}
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No buyer companies added yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Visit Preferences */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Visit Preferences
                    </h5>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">Duration (hours)</label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={hostCompany.estimatedVisitDuration || 4}
                          onChange={(e) => updateHostCompany(hostCompany.id, {
                            estimatedVisitDuration: parseInt(e.target.value) || 4
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">Preferred Time</label>
                        <select
                          value={hostCompany.preferredVisitTime || 'morning'}
                          onChange={(e) => updateHostCompany(hostCompany.id, {
                            preferredVisitTime: e.target.value as 'morning' | 'afternoon' | 'full_day'
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="full_day">Full Day</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Visit Notes
                    </label>
                    <textarea
                      value={hostCompany.notes || ''}
                      onChange={(e) => updateHostCompany(hostCompany.id, { notes: e.target.value })}
                      placeholder="Special requirements, contact details, agenda items..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {hostCompanies.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Selection Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                Host Companies: {hostCompanies.length}
              </span>
              <ul className="mt-1 text-blue-600 dark:text-blue-400">
                {hostCompanies.map(hc => (
                  <li key={hc.id}>
                    • {hc.name} 
                    {hc.visitingParticipants.length > 0 && (
                      <span className="text-xs"> ({hc.visitingParticipants.length} buyers)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                Total Visit Hours: {hostCompanies.reduce((sum, hc) => sum + (hc.estimatedVisitDuration || 4), 0)}
              </span>
              <div className="mt-1 text-blue-600 dark:text-blue-400">
                <div>Morning visits: {hostCompanies.filter(hc => hc.preferredVisitTime === 'morning').length}</div>
                <div>Afternoon visits: {hostCompanies.filter(hc => hc.preferredVisitTime === 'afternoon').length}</div>
                <div>Full day visits: {hostCompanies.filter(hc => hc.preferredVisitTime === 'full_day').length}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}