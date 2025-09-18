import React, { useState, useEffect } from 'react'
import { Users, Building2, Calendar, MapPin, Plus, X, UserPlus } from 'lucide-react'
import type { TripFormData } from './TripCreationModal'
import type { User, Company } from '@/types'
import { useWolthersStaff } from '@/hooks/useWolthersStaff'
import MultiSelectSearch from '@/components/ui/MultiSelectSearch'
import GuestSelectionModal from './GuestSelectionModal'

interface TeamParticipantsStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

interface BuyerCompany extends Company {
  participants: User[]
  participationStartDate?: Date | null
  participationEndDate?: Date | null
  isPartial?: boolean
  wolthersContact?: User // Primary Wolthers contact for this company
  selectedContacts?: Array<{
    id?: string
    name?: string
    full_name?: string
    email?: string
    phone?: string
    role?: string
  }>
}

const toDateOrNull = (value: any): Date | null => {
  if (!value) return null
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? null : parsed
}

const normalizeParticipant = (participant: any, companyId: string, index: number): User => {
  const fallbackId = participant?.id
    || participant?.user_id
    || participant?.email
    || `${companyId || 'company'}-guest-${index}`

  const fullName = participant?.full_name
    || participant?.fullName
    || participant?.name
    || participant?.email
    || 'Guest'

  return {
    id: fallbackId,
    email: participant?.email || '',
    full_name: fullName,
    phone: participant?.phone || participant?.whatsapp,
    role: participant?.role || participant?.title,
    company_id: participant?.company_id || companyId,
    user_type: participant?.user_type || 'contact',
    created_at: participant?.created_at || new Date().toISOString(),
    updated_at: participant?.updated_at || new Date().toISOString()
  } as unknown as User
}

const normalizeContact = (contact: any, companyId: string, index: number) => {
  const fallbackId = contact?.id
    || contact?.user_id
    || contact?.email
    || `${companyId || 'company'}-contact-${index}`

  const name = contact?.name
    || contact?.full_name
    || contact?.fullName
    || contact?.email
    || 'Guest'

  return {
    id: fallbackId,
    name,
    full_name: contact?.full_name || contact?.fullName || name,
    email: contact?.email || '',
    phone: contact?.phone || contact?.whatsapp,
    role: contact?.role || contact?.title
  }
}

const participantsToContacts = (participants: User[], companyId: string) =>
  participants.map((participant, index) => normalizeContact(participant, companyId, index))

export default function TeamParticipantsStep({ formData, updateFormData }: TeamParticipantsStepProps) {
  const { staff, isLoading, error } = useWolthersStaff()
  const [buyerCompanies, setBuyerCompanies] = useState<BuyerCompany[]>([])
  const [showAddBuyerForm, setShowAddBuyerForm] = useState(false)
  const [newBuyerSearch, setNewBuyerSearch] = useState('')
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [selectedCompanyForGuests, setSelectedCompanyForGuests] = useState<Company | null>(null)

  // Initialize buyer companies from existing formData
  useEffect(() => {
    const companies = formData.companies || []

    if (companies.length === 0) {
      setBuyerCompanies([])
      return
    }

    const normalizedBuyerCompanies = companies.map((company, companyIndex) => {
      const companyAny = company as BuyerCompany
      const companyId = company.id || `company-${companyIndex}`

      const rawParticipants = Array.isArray((companyAny as any).participants) && (companyAny as any).participants!.length > 0
        ? (companyAny as any).participants!
        : ((companyAny as any).selectedContacts || [])

      const normalizedParticipants = rawParticipants.map((participant: any, index: number) =>
        normalizeParticipant(participant, companyId, index)
      )

      const normalizedContacts = ((companyAny as any).selectedContacts || []).length > 0
        ? ((companyAny as any).selectedContacts as any[]).map((contact: any, index: number) =>
            normalizeContact(contact, companyId, index)
          )
        : participantsToContacts(normalizedParticipants, companyId)

      return {
        ...company,
        participants: normalizedParticipants,
        selectedContacts: normalizedContacts,
        participationStartDate: toDateOrNull((companyAny as any).participationStartDate) || formData.startDate || null,
        participationEndDate: toDateOrNull((companyAny as any).participationEndDate) || formData.endDate || null,
        isPartial: (companyAny as any).isPartial ?? false,
        wolthersContact: (companyAny as any).wolthersContact
      }
    })

    setBuyerCompanies(normalizedBuyerCompanies)
  }, [formData.companies, formData.startDate, formData.endDate])

  // Debug effect to track buyerCompanies state changes
  useEffect(() => {
    console.log('🔄 buyerCompanies state updated:', buyerCompanies.map(bc => ({
      name: bc.name,
      participantCount: bc.participants?.length || 0,
      participants: bc.participants?.map(p => p.full_name || p.email)
    })))
  }, [buyerCompanies])

  const syncBuyerCompaniesToFormData = (companies: BuyerCompany[]) => {
    const sanitizedCompanies = companies.map((company, companyIndex) => {
      const companyId = company.id || `company-${companyIndex}`

      const participants = (company.participants || []).map((participant, index) => ({
        ...participant,
        id: participant.id || `${companyId}-guest-${index}`,
        full_name: participant.full_name || (participant as any).fullName || participant.email || 'Guest',
        email: participant.email || '',
        phone: participant.phone || (participant as any).whatsapp,
        role: participant.role,
        company_id: participant.company_id || companyId,
        user_type: (participant as any).user_type || 'contact'
      }))

      const contactsSource = (company.selectedContacts && company.selectedContacts.length > 0)
        ? company.selectedContacts
        : participantsToContacts(participants as unknown as User[], companyId)

      const contacts = contactsSource.map((contact, index) => normalizeContact(contact, companyId, index))

      return {
        ...company,
        participants,
        selectedContacts: contacts,
        participationStartDate: company.participationStartDate || formData.startDate || null,
        participationEndDate: company.participationEndDate || formData.endDate || null,
        isPartial: company.isPartial || false,
        wolthersContact: company.wolthersContact
      }
    })

    updateFormData({ companies: sanitizedCompanies as unknown as Company[] })
  }

  const handleWolthersStaffSelection = (selectedStaff: User[]) => {
    updateFormData({ participants: selectedStaff })
  }

  const addBuyerCompany = (company: Company) => {
    const newBuyerCompany: BuyerCompany = {
      ...company,
      participants: [],
      participationStartDate: formData.startDate,
      participationEndDate: formData.endDate,
      isPartial: false,
      wolthersContact: undefined,
      selectedContacts: []
    }
    const updatedBuyerCompanies = [...buyerCompanies, newBuyerCompany]
    setBuyerCompanies(updatedBuyerCompanies)
    setShowAddBuyerForm(false)
    setNewBuyerSearch('')

    syncBuyerCompaniesToFormData(updatedBuyerCompanies)
  }

  const removeBuyerCompany = (companyId: string) => {
    const updatedBuyerCompanies = buyerCompanies.filter(bc => bc.id !== companyId)
    setBuyerCompanies(updatedBuyerCompanies)

    // Update formData companies
    syncBuyerCompaniesToFormData(updatedBuyerCompanies)
  }

  const updateBuyerCompany = (companyId: string, updates: Partial<BuyerCompany>) => {
    console.log('🔧 updateBuyerCompany called with:', { 
      companyId, 
      updatesKeys: Object.keys(updates),
      participantsCount: updates.participants?.length || 0
    })
    
    let companyFound = false
    const updatedBuyerCompanies = buyerCompanies.map(bc => {
      if (bc.id === companyId) {
        companyFound = true
        const updatedCompany = { ...bc, ...updates }
        console.log('🔧 Updating company:', bc.name)
        console.log('🔧 Before - participants:', bc.participants?.length || 0)
        console.log('🔧 After - participants:', updatedCompany.participants?.length || 0)
        console.log('🔧 Participant names:', updatedCompany.participants?.map(p => p.full_name || p.email))
        return updatedCompany
      }
      return bc
    })
    
    if (!companyFound) {
      console.error('🔧 ❌ Company not found for update:', companyId)
      console.error('🔧 Available company IDs:', buyerCompanies.map(bc => bc.id))
      return
    }

    console.log('🔧 ✅ Setting new buyerCompanies state with', updatedBuyerCompanies.length, 'companies')
    setBuyerCompanies(updatedBuyerCompanies)

    syncBuyerCompaniesToFormData(updatedBuyerCompanies)
  }

  const openGuestModal = (company: Company) => {
    setSelectedCompanyForGuests(company)
    setShowGuestModal(true)
  }

  const handleSelectGuests = (companyId: string, selectedGuests: any[]) => {
    console.log('🎯🎯🎯 TEAMPARTICIPANTS handleSelectGuests CALLED!', { companyId, selectedGuests })
    console.log('🎯 handleSelectGuests called with:', { companyId, selectedGuests })
    console.log('🎯 Current buyerCompanies IDs:', buyerCompanies.map(bc => ({ id: bc.id, name: bc.name })))
    console.log('🎯 selectedCompanyForGuests:', selectedCompanyForGuests)
    
    const companyKey = selectedCompanyForGuests?.id || companyId || 'company'

    // Normalize guests into participant + contact payloads for downstream steps
    const guestParticipants: User[] = selectedGuests.map((guest, index) =>
      normalizeParticipant(
        {
          ...guest,
          company_id: companyKey,
          user_type: (guest as any)?.user_type || ('full_name' in guest ? 'user' : 'contact')
        },
        companyKey,
        index
      )
    )

    const guestContacts = selectedGuests.map((guest, index) =>
      normalizeContact(guest, companyKey, index)
    )

    console.log('🎯 Converted guests:', guestParticipants.map(g => ({ name: g.full_name, email: g.email, id: g.id })))

    // Find and update the buyer company with selected participants
    // Try exact ID match first
    let targetCompany = buyerCompanies.find(bc => bc.id === companyId)
    console.log('🎯 ID match result:', targetCompany ? `Found ${targetCompany.name}` : 'No match')
    
    // If no ID match, try name match as fallback
    if (!targetCompany && selectedCompanyForGuests) {
      targetCompany = buyerCompanies.find(bc => bc.name === selectedCompanyForGuests.name)
      console.log('🎯 Name match result:', targetCompany ? `Found ${targetCompany.name}` : 'No match')
    }
    
    if (targetCompany) {
      const resolvedCompanyId = targetCompany.id || companyKey
      const participantsForUpdate = guestParticipants.map((participant, index) => ({
        ...participant,
        company_id: resolvedCompanyId,
        id: participant.id || `${resolvedCompanyId}-guest-${index}`
      }))
      const contactsForUpdate = guestContacts.map((contact, index) => ({
        ...contact,
        id: contact.id || `${resolvedCompanyId}-contact-${index}`
      }))

      console.log('🎯 Found target company:', targetCompany.name, 'ID:', targetCompany.id)
      console.log('🎯 Current participants count:', targetCompany.participants?.length || 0)
      console.log('🎯 New participants count:', participantsForUpdate.length)
      updateBuyerCompany(targetCompany.id, { participants: participantsForUpdate, selectedContacts: contactsForUpdate })
    } else {
      console.error('🚨 Could not find company to update. CompanyId:', companyId)
      console.error('🚨 Available companies:', buyerCompanies.map(bc => ({ id: bc.id, name: bc.name })))
      console.error('🚨 selectedCompanyForGuests:', selectedCompanyForGuests)
    }
    
    // Reset modal state
    setSelectedCompanyForGuests(null)
    setShowGuestModal(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-emerald-300 mb-2">
          Team & Participants
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Select Wolthers staff and add buyer companies who will be traveling with you.
        </p>
      </div>

      {/* Wolthers Staff Selection */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300">
            Wolthers Team
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({formData.participants?.length || 0} selected)
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 dark:text-gray-400">Loading Wolthers staff...</div>
          </div>
        ) : (
          <MultiSelectSearch
            options={staff}
            selectedOptions={formData.participants || []}
            onSelectionChange={handleWolthersStaffSelection}
            placeholder="Search and select Wolthers team members..."
            displayProperty="full_name"
            secondaryDisplayProperty="title"
            getOptionLabel={(person) => person.full_name || person.email}
            getOptionSecondary={(person) => person.title || person.email}
          />
        )}
      </div>

      {/* Buyer Companies Section */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300">
              Buyer Companies
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({buyerCompanies.length} companies)
            </span>
          </div>
          <button
            onClick={() => setShowAddBuyerForm(!showAddBuyerForm)}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Add companies that will be traveling WITH you (buyers/clients). Host companies will be added in the next step.
        </p>

        {/* Add Buyer Company Form */}
        {showAddBuyerForm && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg border border-gray-200 dark:border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-emerald-300">Add New Buyer Company</h4>
              <button
                onClick={() => setShowAddBuyerForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Search or enter company name..."
              value={newBuyerSearch}
              onChange={(e) => setNewBuyerSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            
            {newBuyerSearch && (
              <button
                onClick={() => {
                  // Create a new company from search
                  const newCompany: Company = {
                    id: `temp_${Date.now()}`,
                    name: newBuyerSearch,
                    email: '',
                    address: '',
                    phone: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    company_id: '',
                    logo_url: null
                  }
                  addBuyerCompany(newCompany)
                }}
                className="mt-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm"
              >
                Add "{newBuyerSearch}"
              </button>
            )}
          </div>
        )}

        {/* Buyer Companies List */}
        <div className="space-y-4">
          {buyerCompanies.map((buyerCompany) => (
            <div key={buyerCompany.id} className="border border-gray-200 dark:border-[#3a3a3a] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-emerald-300">
                  {buyerCompany.name}
                </h4>
                <button
                  onClick={() => removeBuyerCompany(buyerCompany.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Participation Dates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Participation Period
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={!buyerCompany.isPartial}
                        onChange={(e) => updateBuyerCompany(buyerCompany.id, { 
                          isPartial: !e.target.checked,
                          participationStartDate: e.target.checked ? formData.startDate : buyerCompany.participationStartDate,
                          participationEndDate: e.target.checked ? formData.endDate : buyerCompany.participationEndDate
                        })}
                        className="rounded border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Full trip participation</span>
                    </div>
                    
                    {buyerCompany.isPartial && (
                      <div className="flex space-x-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400">Start Date</label>
                          <input
                            type="date"
                            value={buyerCompany.participationStartDate?.toISOString().split('T')[0] || ''}
                            onChange={(e) => updateBuyerCompany(buyerCompany.id, {
                              participationStartDate: e.target.value ? new Date(e.target.value) : undefined
                            })}
                            className="px-2 py-1 text-xs border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400">End Date</label>
                          <input
                            type="date"
                            value={buyerCompany.participationEndDate?.toISOString().split('T')[0] || ''}
                            onChange={(e) => updateBuyerCompany(buyerCompany.id, {
                              participationEndDate: e.target.value ? new Date(e.target.value) : undefined
                            })}
                            className="px-2 py-1 text-xs border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wolthers Contact Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Wolthers Contact
                  </label>
                  <select
                    value={buyerCompany.wolthersContact?.id || ''}
                    onChange={(e) => {
                      const selectedContact = staff.find(s => s.id === e.target.value)
                      updateBuyerCompany(buyerCompany.id, { wolthersContact: selectedContact })
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select primary contact...</option>
                    {(formData.participants || []).map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name || staff.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Guest Participants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Guest Participants ({buyerCompany.participants?.length || 0})
                  </label>
                  <button
                    onClick={() => openGuestModal(buyerCompany)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-emerald-300 dark:border-emerald-600 text-sm font-medium rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {buyerCompany.participants?.length ? 'Manage Guests' : 'Select Guests'}
                  </button>
                  
                  {buyerCompany.participants && buyerCompany.participants.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      {buyerCompany.participants.map((participant, index) => (
                        <div key={participant.id} className="flex items-center space-x-1">
                          <span>•</span>
                          <span>{participant.full_name || participant.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {buyerCompanies.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No buyer companies added yet</p>
              <p className="text-xs">Click "Add Company" to add companies traveling with you</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {(formData.participants?.length || 0) > 0 || buyerCompanies.length > 0 && (
        <div key={`summary-${buyerCompanies.map(bc => `${bc.id}-${bc.participants?.length || 0}`).join('-')}`} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
          <h4 className="font-medium text-emerald-900 dark:text-emerald-300 mb-2">Trip Participants Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                Wolthers Team: {formData.participants?.length || 0} members
              </span>
              {formData.participants && formData.participants.length > 0 && (
                <ul className="mt-1 text-emerald-600 dark:text-emerald-400">
                  {formData.participants.map(p => (
                    <li key={p.id}>• {p.full_name || p.email}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                Buyer Companies: {buyerCompanies.length}
              </span>
              {buyerCompanies.length > 0 && (
                <ul className="mt-1 text-emerald-600 dark:text-emerald-400">
                  {buyerCompanies.map(bc => {
                    // Get participants directly from buyerCompany state (this should have Randy)
                    const participants = bc.participants || []
                    
                    // Debug logging for this specific render
                    if (bc.name === 'Blaser Trading A/G') {
                      console.log('🎯 RENDER DEBUG - Blaser Trading A/G:', {
                        participants: participants,
                        participantsLength: participants.length,
                        firstParticipant: participants[0],
                        participantNames: participants.map(p => p.full_name || p.email || 'Unknown')
                      })
                    }
                    
                    return (
                      <li key={bc.id}>
                        • {bc.name} {bc.isPartial ? '(partial)' : '(full trip)'}
                        {participants && participants.length > 0 ? (
                          <span className="ml-2 text-emerald-500 dark:text-emerald-300">
                            - {participants.map(p => {
                              const name = p?.full_name || p?.email || 'Unknown'
                              console.log('🎯 Rendering participant:', name, 'from object:', p)
                              return name
                            }).join(', ')}
                          </span>
                        ) : (
                          <span className="ml-2 text-red-400 text-xs">
                            (Debug: {participants ? `${participants.length} participants` : 'participants is null'})
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guest Selection Modal */}
      <GuestSelectionModal
        isOpen={showGuestModal}
        onClose={() => {
          setShowGuestModal(false)
          setSelectedCompanyForGuests(null)
        }}
        company={selectedCompanyForGuests || { id: '', name: '', city: '', state: '' }}
        onSelectGuests={handleSelectGuests}
      />
    </div>
  )
}