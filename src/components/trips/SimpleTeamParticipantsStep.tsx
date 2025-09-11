import React, { useState, useEffect } from 'react'
import { Users, Building2, Plus, X, UserPlus } from 'lucide-react'
import type { TripFormData } from './TripCreationModal'
import type { User, Company } from '@/types'
import UserCreationModal from './UserCreationModal'
import GuestSelectionModal from './GuestSelectionModal'

interface SimpleTeamParticipantsStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

export default function SimpleTeamParticipantsStep({ formData, updateFormData }: SimpleTeamParticipantsStepProps) {
  const [newCompanyName, setNewCompanyName] = useState('')
  const [wolthersStaff, setWolthersStaff] = useState<User[]>([])
  const [buyerCompanies, setBuyerCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [selectedCompanyForGuests, setSelectedCompanyForGuests] = useState<Company | null>(null)

  // Load real data from APIs
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Load Wolthers staff
        const staffResponse = await fetch('/api/users/wolthers-staff', {
          credentials: 'include'
        })
        
        if (staffResponse.ok) {
          const staffData = await staffResponse.json()
          setWolthersStaff(staffData.staff || [])
        } else {
          console.warn('Failed to load Wolthers staff, using fallback')
          // Fallback to mock data if API fails
          setWolthersStaff([
            {
              id: 'daniel-id',
              email: 'daniel@wolthers.com',
              full_name: 'Daniel Wolthers',
              role: 'staff',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
        }

        // Load buyer companies
        const companiesResponse = await fetch('/api/companies', {
          credentials: 'include'
        })
        
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json()
          // Filter for buyer companies only (category = 'buyer')
          const buyers = (companiesData.companies || []).filter((company: Company & { category?: string }) => 
            company.category === 'buyer'
          )
          setBuyerCompanies(buyers)
        } else {
          console.warn('Failed to load companies')
          setBuyerCompanies([])
        }
        
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load team and company data')
        // Use minimal fallback data
        setWolthersStaff([{
          id: 'fallback-id',
          email: 'staff@wolthers.com',
          full_name: 'Wolthers Staff',
          role: 'staff',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        setBuyerCompanies([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const toggleStaffMember = (staff: User) => {
    const currentParticipants = formData.participants || []
    const isSelected = currentParticipants.some(p => p.id === staff.id)
    
    if (isSelected) {
      updateFormData({
        participants: currentParticipants.filter(p => p.id !== staff.id)
      })
    } else {
      updateFormData({
        participants: [...currentParticipants, staff]
      })
    }
  }

  const toggleBuyerCompany = (company: Company) => {
    const currentCompanies = formData.companies || []
    const isSelected = currentCompanies.some(c => c.id === company.id)
    
    if (isSelected) {
      updateFormData({
        companies: currentCompanies.filter(c => c.id !== company.id)
      })
    } else {
      updateFormData({
        companies: [...currentCompanies, company]
      })
    }
  }

  const addBuyerCompany = () => {
    if (!newCompanyName.trim()) return
    
    const newCompany: Company = {
      id: `temp_${Date.now()}`,
      name: newCompanyName,
      email: '',
      address: '',
      phone: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      company_id: '',
      logo_url: null
    }
    
    const currentCompanies = formData.companies || []
    updateFormData({
      companies: [...currentCompanies, newCompany]
    })
    
    setNewCompanyName('')
  }

  const removeBuyerCompany = (companyId: string) => {
    const currentCompanies = formData.companies || []
    updateFormData({
      companies: currentCompanies.filter(c => c.id !== companyId)
    })
  }

  const handleUserCreated = async (newUser: User) => {
    // Add the new user to the local staff list
    setWolthersStaff(prev => [...prev, newUser])
    // Automatically select the new user as a participant
    const currentParticipants = formData.participants || []
    updateFormData({
      participants: [...currentParticipants, newUser]
    })
    setShowUserModal(false)

    // Send welcome/invitation email to the new staff member
    try {
      const response = await fetch('/api/emails/staff-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: newUser.email,
          inviterName: 'Daniel Wolthers', // TODO: Get from current user context
          inviterEmail: 'daniel@wolthers.com', // TODO: Get from current user context
          newStaffName: newUser.fullName || newUser.full_name || 'New Team Member',
          role: newUser.role || 'Staff Member',
          tripTitle: formData.title || undefined,
          whatsApp: undefined // TODO: Add WhatsApp field to user creation if needed
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Welcome email sent to ${newUser.email}`)
        // TODO: Show success notification to user
      } else {
        console.error(`❌ Failed to send welcome email:`, result.error)
        // TODO: Show error notification to user
      }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      // TODO: Show error notification to user
    }
  }

  const openGuestModal = (company: Company) => {
    setSelectedCompanyForGuests(company)
    setShowGuestModal(true)
  }

  const handleSelectGuests = (companyId: string, selectedGuests: any[]) => {
    console.log('🎯🎯🎯 SIMPLE TEAMPARTICIPANTS handleSelectGuests CALLED!', { companyId, selectedGuests })
    
    // Convert guests to User format for consistency
    const guests: User[] = selectedGuests.map(guest => ({
      id: guest.id || `guest_${Date.now()}_${Math.random()}`,
      email: guest.email || '',
      full_name: 'full_name' in guest ? guest.full_name : guest.name,
      phone: guest.phone || undefined,
      role: guest.role || undefined,
      company_id: companyId,
      user_type: 'full_name' in guest ? 'user' : 'contact',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    console.log('🎯 Converted guests:', guests.map(g => ({ name: g.full_name, email: g.email })))

    // Find the company and update its participants
    const updatedCompanies = (formData.companies || []).map(company => {
      if (company.id === companyId) {
        const updatedCompany = {
          ...company,
          participants: guests // Store guests as participants
        }
        console.log('🎯 Updated company:', company.name, 'with participants:', guests.length)
        return updatedCompany
      }
      return company
    })

    console.log('🎯 Final companies with participants:', updatedCompanies.map(c => ({ 
      name: c.name, 
      participantCount: (c as any).participants?.length || 0,
      participantNames: (c as any).participants?.map((p: any) => p.full_name || p.email) || []
    })))

    updateFormData({ companies: updatedCompanies })
    
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
          Select team members and buyer companies for this trip.
        </p>
      </div>

      {/* Wolthers Staff Selection */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-300 dark:border-[#2a2a2a] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300">
              Wolthers Team
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({(formData.participants || []).length} selected)
            </span>
          </div>
          <button
            onClick={() => setShowUserModal(true)}
            className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Staff</span>
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 dark:text-gray-400">Loading Wolthers staff...</div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wolthersStaff.map((staff) => {
              const isSelected = (formData.participants || []).some(p => p.id === staff.id)
            
            return (
              <div
                key={staff.id}
                onClick={() => toggleStaffMember(staff)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-[#2a2a2a] hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {staff.full_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {staff.role || 'Staff Member'}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </div>
            )
            })}
          </div>
        )}
      </div>

      {/* Buyer Companies Section */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-300 dark:border-[#2a2a2a] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300">
              Buyer Companies
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({(formData.companies || []).length} companies)
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Add companies that will be traveling WITH you (buyers/clients). Host companies will be added in the next step.
        </p>

        {/* Existing Buyer Companies */}
        {buyerCompanies.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-emerald-300 mb-3">
              Select from existing buyers ({buyerCompanies.length} available):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buyerCompanies.map((company) => {
                const isSelected = (formData.companies || []).some(c => c.id === company.id)
                const selectedCompany = (formData.companies || []).find(c => c.id === company.id)
                const guestCount = (selectedCompany as any)?.participants?.length || 0
                
                return (
                  <div
                    key={company.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-[#2a2a2a] hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div 
                        onClick={() => toggleBuyerCompany(company)}
                        className="flex-1 cursor-pointer"
                      >
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {company.name}
                        </h5>
                        {company.address && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {company.address}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {guestCount} guest{guestCount !== 1 ? 's' : ''} selected
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openGuestModal(company)
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          {guestCount > 0 ? 'Manage' : 'Add'} Guests
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Add New Company Form */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-emerald-300 mb-3">
            Or add a new buyer company:
          </h4>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter buyer company name..."
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addBuyerCompany()}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              onClick={addBuyerCompany}
              disabled={!newCompanyName.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Companies List */}
        <div className="space-y-3">
          {(formData.companies || []).map((company) => (
            <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {company.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Buyer company
                </p>
              </div>
              <button
                onClick={() => removeBuyerCompany(company.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {(formData.companies || []).length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No buyer companies added yet</p>
              <p className="text-xs">Add companies that will be traveling with you</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {((formData.participants || []).length > 0 || (formData.companies || []).length > 0) && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
          <h4 className="font-medium text-emerald-900 dark:text-emerald-300 mb-2">
            Trip Participants Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                Wolthers Team: {(formData.participants || []).length} members
              </span>
              {(formData.participants || []).length > 0 && (
                <ul className="mt-1 text-emerald-600 dark:text-emerald-400">
                  {(formData.participants || []).map(p => (
                    <li key={p.id}>• {p.full_name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                Buyer Companies: {(formData.companies || []).length}
              </span>
              {(formData.companies || []).length > 0 && (
                <ul className="mt-1 text-emerald-600 dark:text-emerald-400">
                  {(formData.companies || []).map(c => {
                    const participants = (c as any).participants || []
                    const participantNames = participants.map((p: any) => p.full_name || p.email || 'Unknown').join(', ')
                    
                    return (
                      <li key={c.id}>
                        • {c.name}
                        {participants.length > 0 && (
                          <span className="ml-2 text-emerald-500 dark:text-emerald-300">
                            - {participantNames}
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
      
      {/* User Creation Modal */}
      <UserCreationModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onUserCreated={handleUserCreated}
        preSelectedCompanyId="840783f4-866d-4bdb-9b5d-5d0facf62db0" // Wolthers & Associates company ID
        availableCompanies={[]}
        defaultRole="staff"
        title="Add New Wolthers Staff Member"
      />

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