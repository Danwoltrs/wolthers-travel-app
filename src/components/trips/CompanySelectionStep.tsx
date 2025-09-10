import React, { useState, useEffect } from 'react'
import { MapPin, Building2, Users, Search, Plus, X, UserPlus, Edit } from 'lucide-react'
import type { TripFormData } from './TripCreationModal'
import type { Company } from '@/types'
import { detectLocationFromAddress, getRegionByCity } from '@/lib/brazilian-locations'
import HostSelectionModal from './HostSelectionModal'

interface CompanySelectionStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

interface HostCompany extends Company {
  visitingParticipants: string[] // IDs of buyer companies that will visit this host
  estimatedVisitDuration?: number // hours
  preferredVisitTime?: 'morning' | 'afternoon' | 'full_day'
  notes?: string
  representatives?: Array<{
    name: string
    role?: string
    email?: string
    phone?: string
  }>
}

export default function CompanySelectionStep({ formData, updateFormData }: CompanySelectionStepProps) {
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [hostCompanies, setHostCompanies] = useState<HostCompany[]>([])
  const [showHostModal, setShowHostModal] = useState(false)
  const [selectedCompanyForHost, setSelectedCompanyForHost] = useState<Company | null>(null)

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
        
        const data = await response.json()
        // The API returns { companies: [...] }
        const companies = Array.isArray(data.companies) ? data.companies : []
        setAvailableCompanies(companies)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load companies')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  // Extract unique coffee regions from companies using our Brazilian locations database
  const regions = ['all', ...new Set((availableCompanies || []).map(c => {
    const companyAny = c as any
    return extractCoffeeRegion(companyAny)
  }).filter(region => region && region !== 'Unknown'))]

  function extractCoffeeRegion(company: any): string {
    // Try to get region from existing company data first
    if (company.region && company.region !== 'Unknown') {
      return company.region
    }
    
    // Use our AI location detection for smart region mapping
    const address = company.address || ''
    const city = company.city || ''
    const state = company.state || ''
    
    if (address) {
      const detectedLocation = detectLocationFromAddress(address)
      if (detectedLocation && detectedLocation.coffeeRegion) {
        return detectedLocation.coffeeRegion
      }
    }
    
    // Try city-based detection
    if (city) {
      const regionFromCity = getRegionByCity(city, state)
      if (regionFromCity && regionFromCity !== 'Brasil') {
        return regionFromCity
      }
    }
    
    // Check for international companies
    if (address && !address.toLowerCase().includes('brazil') && !address.toLowerCase().includes('brasil')) {
      // Extract country for international companies
      const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 0)
      if (parts.length >= 2) {
        return parts[parts.length - 1] // Country
      }
    }
    
    return 'Other'
  }

  // Filter and sort companies based on search and region
  const filteredCompanies = (availableCompanies || []).filter(company => {
    const companyAny = company as any
    const matchesSearch = !searchTerm || 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.fantasy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      companyAny.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      companyAny.city?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRegion = selectedRegion === 'all' || 
      extractCoffeeRegion(companyAny) === selectedRegion
    
    // Only show supplier/host companies (exclude buyers, Wolthers, and already selected)
    const isSupplier = company.category === 'supplier' || company.client_type === 'supplier' || 
                      companyAny.category === 'supplier' || companyAny.client_type === 'supplier'
    const notBuyerCompany = !buyerCompanies.some(buyer => buyer.id === company.id)
    const notWolthers = !company.name.toLowerCase().includes('wolthers')
    const notAlreadySelected = !hostCompanies.some(host => host.id === company.id)
    
    // Debug log to see what's being filtered
    if (company.name.toLowerCase().includes('blaser')) {
      console.log('🔍 Blaser filtering:', {
        name: company.name,
        category: company.category,
        client_type: company.client_type,
        companyCategory: companyAny.category,
        companyClientType: companyAny.client_type,
        isSupplier,
        notBuyerCompany,
        notWolthers,
        notAlreadySelected,
        finalResult: matchesSearch && matchesRegion && isSupplier && notBuyerCompany && notWolthers && notAlreadySelected
      })
    }
    
    return matchesSearch && matchesRegion && isSupplier && notBuyerCompany && notWolthers && notAlreadySelected
  }).sort((a, b) => {
    // Sort by region first, then by city, then by company name
    const aCompany = a as any
    const bCompany = b as any
    const aRegion = extractCoffeeRegion(aCompany)
    const bRegion = extractCoffeeRegion(bCompany)
    const aCity = (aCompany.city || '').toLowerCase().trim()
    const bCity = (bCompany.city || '').toLowerCase().trim()
    
    // First, sort by region
    if (aRegion !== bRegion) {
      // Sort regions alphabetically, but put 'Unknown' and 'Other' last
      if (aRegion === 'Unknown' || aRegion === 'Other') return 1
      if (bRegion === 'Unknown' || bRegion === 'Other') return -1
      return aRegion.localeCompare(bRegion)
    }
    
    // Within same region, sort by city to group companies by location
    if (aCity !== bCity) {
      return aCity.localeCompare(bCity)
    }
    
    // Within same city, sort by company name
    const aName = a.fantasy_name || a.name
    const bName = b.fantasy_name || b.name
    return aName.localeCompare(bName)
  })

  const openHostModal = (company: Company) => {
    if (hostCompanies.some(hc => hc.id === company.id)) return
    
    setSelectedCompanyForHost(company)
    setShowHostModal(true)
  }

  const handleSelectHost = (companyId: string, selectedContacts: any[]) => {
    const company = selectedCompanyForHost
    if (!company) return

    const newHostCompany: HostCompany = {
      ...company,
      visitingParticipants: [], // Initialize empty - user will assign
      estimatedVisitDuration: 4, // Default 4 hours
      preferredVisitTime: 'morning',
      notes: '',
      representatives: selectedContacts // Use selected contacts from modal
    }

    const updatedHostCompanies = [...hostCompanies, newHostCompany]
    setHostCompanies(updatedHostCompanies)
    
    // Update formData with representatives included
    const companiesWithReps = updatedHostCompanies.map(hc => ({
      ...hc,
      representatives: hc.representatives || []
    }))
    updateFormData({ hostCompanies: updatedHostCompanies, companies: companiesWithReps })
    
    // Reset modal state
    setSelectedCompanyForHost(null)
    setShowHostModal(false)
  }

  const removeHostCompany = (companyId: string) => {
    const updatedHostCompanies = hostCompanies.filter(hc => hc.id !== companyId)
    setHostCompanies(updatedHostCompanies)
    const companiesWithReps = updatedHostCompanies.map(hc => ({
      ...hc,
      representatives: hc.representatives || []
    }))
    updateFormData({ hostCompanies: updatedHostCompanies, companies: companiesWithReps })
  }

  const updateHostCompany = (companyId: string, updates: Partial<HostCompany>) => {
    const updatedHostCompanies = hostCompanies.map(hc => 
      hc.id === companyId ? { ...hc, ...updates } : hc
    )
    setHostCompanies(updatedHostCompanies)
    const companiesWithReps = updatedHostCompanies.map(hc => ({
      ...hc,
      representatives: hc.representatives || []
    }))
    updateFormData({ hostCompanies: updatedHostCompanies, companies: companiesWithReps })
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
      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search companies by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
              className="w-full pr-4 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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

      {/* Available Companies Table */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a]">
          <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300">
            Available Host Companies ({filteredCompanies.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Click on company names to add them as hosts for your travel group. You can configure visit details in the calendar step.
          </p>
        </div>
        
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm || selectedRegion !== 'all' 
              ? 'No companies match your search criteria'
              : 'No companies available'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#2a2a2a]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Region
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                {filteredCompanies.map((company, index) => (
                  <tr 
                    key={company.id}
                    className={`hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors ${
                      index % 2 === 0 ? 'bg-white dark:bg-[#1a1a1a]' : 'bg-gray-50 dark:bg-[#1f1f1f]'
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => openHostModal(company)}
                        className="text-left group hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md px-2 py-1 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-emerald-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                            {company.fantasy_name || company.name}
                          </div>
                          <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {(company as any).city ? (
                          <div className="font-medium text-emerald-600 dark:text-emerald-400">
                            {(company as any).city}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {(company as any).address ? (
                          <div className="break-words max-w-xs text-gray-600 dark:text-gray-400 text-xs">
                            {(company as any).address}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {extractCoffeeRegion(company as any)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Companies Summary */}
      {hostCompanies.length > 0 && (
        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-emerald-900 dark:text-emerald-300 mb-1">
                  {hostCompanies.length} Host {hostCompanies.length === 1 ? 'Company' : 'Companies'} Selected
                </h4>
                <div className="flex flex-wrap gap-2 items-center">
                  {hostCompanies.map(hc => (
                    <div key={hc.id} className="inline-flex items-center bg-emerald-100 dark:bg-emerald-800/30 rounded-lg px-2 py-1">
                      <span className="text-sm text-emerald-700 dark:text-emerald-400">
                        {hc.fantasy_name || hc.name}
                      </span>
                      <button
                        onClick={() => removeHostCompany(hc.id)}
                        className="ml-2 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  setHostCompanies([])
                  updateFormData({ hostCompanies: [] })
                }}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 text-sm"
              >
                Clear All
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Skip Host Selection Section */}
      {hostCompanies.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Host Selection Optional
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can select host companies now or add them later after creating your trip.
              </p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
              <p>💡 <strong>Tip:</strong> Adding hosts now allows you to plan visits during the calendar step. You can always add or remove hosts from your trip dashboard.</p>
            </div>
          </div>
        </div>
      )}

      {/* Host Selection Modal */}
      <HostSelectionModal
        isOpen={showHostModal}
        onClose={() => {
          setShowHostModal(false)
          setSelectedCompanyForHost(null)
        }}
        company={selectedCompanyForHost || { id: '', name: '', city: '', state: '' }}
        onSelectHost={handleSelectHost}
      />
    </div>
  )
}