import React, { useState } from 'react'
import { MapPin, Building2, Users, Search, Sparkles, Globe } from 'lucide-react'
import RegionBasedCompanySelector from './RegionBasedCompanySelector'
import type { TripFormData } from './TripCreationModal'
import type { Company, User } from '@/types'

interface DestinationsDiscoveryStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

interface HostCompany extends Company {
  visitingParticipants: string[] // IDs of buyer companies that will visit this host
  assignedWolthersContact?: User // Wolthers staff member assigned to this host
  estimatedVisitDuration?: number // hours
  preferredVisitTime?: 'morning' | 'afternoon' | 'full_day'
  notes?: string
}

export default function DestinationsDiscoveryStep({ formData, updateFormData }: DestinationsDiscoveryStepProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [hostCompanies, setHostCompanies] = useState<HostCompany[]>([])
  const [isAILoading, setIsAILoading] = useState(false)
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  
  // Get buyer companies from formData
  const buyerCompanies = formData.companies || []
  const wolthersTeam = formData.participants || []

  const handleRegionSelect = (regionId: string, suggestedCompanies: Company[]) => {
    if (!selectedRegions.includes(regionId)) {
      setSelectedRegions([...selectedRegions, regionId])
      
      // Add suggested companies as host companies
      const newHostCompanies: HostCompany[] = suggestedCompanies.map(company => ({
        ...company,
        visitingParticipants: [], // Initialize empty - user will assign
        estimatedVisitDuration: 4, // Default 4 hours
        preferredVisitTime: 'morning'
      }))
      
      setHostCompanies([...hostCompanies, ...newHostCompanies])
    }
  }

  const handleCustomSearch = (searchTerm: string) => {
    setIsAILoading(true)
    
    // This would normally call an AI service to find companies based on search
    setTimeout(() => {
      // Mock result for now
      const mockCompany: HostCompany = {
        id: `custom_${Date.now()}`,
        name: `Companies matching "${searchTerm}"`,
        email: '',
        address: searchTerm,
        phone: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company_id: '',
        logo_url: null,
        visitingParticipants: [],
        estimatedVisitDuration: 4,
        preferredVisitTime: 'morning'
      }
      
      setHostCompanies([...hostCompanies, mockCompany])
      setIsAILoading(false)
    }, 1500)
  }

  const handleNaturalLanguageSearch = (searchData: string) => {
    setIsAILoading(true)
    
    try {
      const parsedData = JSON.parse(searchData)
      console.log('Natural language input parsed:', parsedData)
      
      // Process the natural language input to create itinerary segments
      setTimeout(() => {
        // Mock processing of "Santos 2 days, Sul de Minas 3 days" type input
        const mockHostCompanies: HostCompany[] = parsedData.locations?.map((loc: any, index: number) => ({
          id: `nl_${Date.now()}_${index}`,
          name: `${loc.location} Host Companies`,
          email: '',
          address: loc.location,
          phone: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          company_id: '',
          logo_url: null,
          visitingParticipants: [],
          estimatedVisitDuration: loc.duration * 8, // Convert days to hours
          preferredVisitTime: 'full_day',
          notes: `${loc.duration} ${loc.unit} in ${loc.location}`
        })) || []
        
        setHostCompanies([...hostCompanies, ...mockHostCompanies])
        setIsAILoading(false)
      }, 2000)
    } catch (error) {
      console.error('Error parsing natural language input:', error)
      setIsAILoading(false)
    }
  }

  const removeHostCompany = (companyId: string) => {
    setHostCompanies(hostCompanies.filter(hc => hc.id !== companyId))
  }

  const updateHostCompany = (companyId: string, updates: Partial<HostCompany>) => {
    setHostCompanies(hostCompanies.map(hc => 
      hc.id === companyId ? { ...hc, ...updates } : hc
    ))
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

  // Update formData whenever host companies change
  React.useEffect(() => {
    const hostCompaniesData = hostCompanies.map(({ visitingParticipants, assignedWolthersContact, ...company }) => company)
    updateFormData({ hostCompanies: hostCompaniesData })
  }, [hostCompanies])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-emerald-300 mb-2">
          Destinations & AI Discovery
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Use AI to discover host companies in specific regions or describe your itinerary in natural language.
        </p>
      </div>

      {/* AI-Powered Regional Company Discovery */}
      <RegionBasedCompanySelector
        onRegionSelect={handleRegionSelect}
        onCustomSearch={handleCustomSearch}
        onNaturalLanguageSearch={handleNaturalLanguageSearch}
        selectedRegions={selectedRegions}
        isLoading={isAILoading}
      />

      {/* Host Companies & Participant Assignment Matrix */}
      {hostCompanies.length > 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300">
                Host Companies & Assignments
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({hostCompanies.length} hosts)
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Assign which buyer companies will visit each host. Configure visit preferences and Wolthers team assignments.
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
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
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

                  {/* Wolthers Team Assignment */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Wolthers Team Lead
                    </h5>
                    <select
                      value={hostCompany.assignedWolthersContact?.id || ''}
                      onChange={(e) => {
                        const selectedContact = wolthersTeam.find(w => w.id === e.target.value)
                        updateHostCompany(hostCompany.id, { assignedWolthersContact: selectedContact })
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select team lead...</option>
                      {wolthersTeam.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.full_name || staff.email}
                        </option>
                      ))}
                    </select>
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
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Visit Notes
                  </label>
                  <textarea
                    value={hostCompany.notes || ''}
                    onChange={(e) => updateHostCompany(hostCompany.id, { notes: e.target.value })}
                    placeholder="Special requirements, contact details, agenda items..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {hostCompanies.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Destinations Summary</h4>
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
                Selected Regions: {selectedRegions.length}
              </span>
              <ul className="mt-1 text-blue-600 dark:text-blue-400">
                {selectedRegions.map(regionId => (
                  <li key={regionId}>• {regionId.replace(/_/g, ' ').toUpperCase()}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}