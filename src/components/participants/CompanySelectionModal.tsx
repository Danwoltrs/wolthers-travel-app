'use client'

import { useState, useEffect } from 'react'
import { X, Building, User, Search, CheckCircle, Send, AlertCircle, Users, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CompanySelectionModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  onInvitationSent: () => void
}

interface Company {
  id: string
  company_name: string
  company_type?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  website?: string
  total_staff: number
}

interface CompanyStaff {
  id: string
  full_name: string
  email: string
  phone?: string
  job_title?: string
  company_id: string
  company_name: string
  is_primary_contact: boolean
}

interface CompanyWithStaff {
  company: Company
  staff: CompanyStaff[]
  expanded: boolean
  selectedStaff: Set<string>
}

export function CompanySelectionModal({ isOpen, onClose, tripId, onInvitationSent }: CompanySelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [companies, setCompanies] = useState<CompanyWithStaff[]>([])
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [invitingStaff, setInvitingStaff] = useState(false)

  // Load companies
  useEffect(() => {
    if (!isOpen) return

    const searchCompanies = async () => {
      setSearchLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        params.append('limit', '20')

        const response = await fetch(`/api/companies/directory?${params}`, {
          credentials: 'include'
        })

        if (response.ok) {
          const result = await response.json()
          const companiesData = result.companies || []
          
          setCompanies(companiesData.map((company: Company) => ({
            company,
            staff: [],
            expanded: false,
            selectedStaff: new Set<string>()
          })))
        }
      } catch (error) {
        console.error('Failed to search companies:', error)
        setError('Failed to load companies')
      } finally {
        setSearchLoading(false)
      }
    }

    const debounceTimeout = setTimeout(searchCompanies, 300)
    return () => clearTimeout(debounceTimeout)
  }, [searchTerm, isOpen])

  // Load staff for a company
  const loadCompanyStaff = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/staff`, {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        const staff: CompanyStaff[] = result.staff || []

        setCompanies(prev => prev.map(companyData => 
          companyData.company.id === companyId 
            ? { ...companyData, staff, expanded: true }
            : companyData
        ))
      }
    } catch (error) {
      console.error('Failed to load company staff:', error)
    }
  }

  // Toggle company expansion
  const toggleCompany = (companyId: string) => {
    const companyData = companies.find(c => c.company.id === companyId)
    if (!companyData) return

    if (!companyData.expanded && companyData.staff.length === 0) {
      loadCompanyStaff(companyId)
    } else {
      setCompanies(prev => prev.map(companyData => 
        companyData.company.id === companyId 
          ? { ...companyData, expanded: !companyData.expanded }
          : companyData
      ))
    }
  }

  // Toggle staff member selection
  const toggleStaffSelection = (companyId: string, staffId: string) => {
    setCompanies(prev => prev.map(companyData => {
      if (companyData.company.id === companyId) {
        const newSelected = new Set(companyData.selectedStaff)
        if (newSelected.has(staffId)) {
          newSelected.delete(staffId)
        } else {
          newSelected.add(staffId)
        }
        return { ...companyData, selectedStaff: newSelected }
      }
      return companyData
    }))
    setError(null)
  }

  // Select all staff for a company
  const selectAllCompanyStaff = (companyId: string) => {
    setCompanies(prev => prev.map(companyData => {
      if (companyData.company.id === companyId) {
        const allStaffIds = new Set(companyData.staff.map(staff => staff.id))
        return { ...companyData, selectedStaff: allStaffIds }
      }
      return companyData
    }))
  }

  // Get all selected staff across all companies
  const getAllSelectedStaff = (): CompanyStaff[] => {
    return companies.flatMap(companyData => 
      companyData.staff.filter(staff => companyData.selectedStaff.has(staff.id))
    )
  }

  // Send invitations to selected staff
  const handleSendInvitations = async () => {
    const selectedStaff = getAllSelectedStaff()
    
    if (selectedStaff.length === 0) {
      setError('Please select at least one staff member to invite')
      return
    }

    setInvitingStaff(true)
    setError(null)

    try {
      const invitationPromises = selectedStaff.map(staff => 
        fetch('/api/guests/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            tripId,
            guestEmail: staff.email,
            guestName: staff.full_name,
            guestCompany: staff.company_name,
            guestTitle: staff.job_title || undefined,
            guestPhone: staff.phone || undefined,
            message: `You have been invited as a representative of ${staff.company_name}.`,
            invitationType: 'external_guest' // Company guests now use external_guest type
          })
        })
      )

      const responses = await Promise.allSettled(invitationPromises)
      
      const successful = responses.filter(r => r.status === 'fulfilled' && (r.value as Response).ok).length
      const failed = responses.length - successful

      if (successful > 0) {
        setSuccess(true)
        setTimeout(() => {
          onInvitationSent()
          handleClose()
        }, 2000)
      }

      if (failed > 0) {
        setError(`${successful} invitations sent successfully, ${failed} failed`)
      }

    } catch (error) {
      console.error('Failed to send invitations:', error)
      setError('Failed to send invitations')
    } finally {
      setInvitingStaff(false)
    }
  }

  const handleClose = () => {
    if (!invitingStaff) {
      onClose()
      // Reset state
      setTimeout(() => {
        setSearchTerm('')
        setCompanies([])
        setError(null)
        setSuccess(false)
      }, 300)
    }
  }

  if (!isOpen) return null

  const selectedCount = getAllSelectedStaff().length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] shadow-xl rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] text-white dark:text-golden-400 px-6 py-4 border-b border-pearl-200 dark:border-[#0a2e21] flex justify-between items-center">
          <h2 className="text-lg font-semibold">Invite Company Guests</h2>
          <button 
            onClick={handleClose}
            disabled={invitingStaff}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white dark:bg-[#1a1a1a] overflow-y-auto max-h-[calc(90vh-120px)]">
          {success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-2">
                Invitations Sent!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {selectedCount} invitation{selectedCount > 1 ? 's' : ''} sent successfully.
              </p>
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div className="relative mb-6">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search companies..."
                  style={{ paddingLeft: '36px' }}
                  className="w-full pr-3 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={invitingStaff}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-6">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Selection Summary */}
              {selectedCount > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">
                        {selectedCount} staff member{selectedCount > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <Button
                      onClick={handleSendInvitations}
                      disabled={invitingStaff}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      {invitingStaff ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Invitations
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Companies List */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {searchLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Loading companies...</p>
                  </div>
                ) : companies.length > 0 ? (
                  companies.map(({ company, staff, expanded, selectedStaff }) => (
                    <div
                      key={company.id}
                      className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden"
                    >
                      {/* Company Header */}
                      <div className="p-4 bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#333333]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleCompany(company.id)}
                              className="flex items-center gap-3 text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                              <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                  {company.company_name}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {company.total_staff} staff
                                  </span>
                                  {company.company_type && (
                                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">
                                      {company.company_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedStaff.size > 0 && (
                              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
                                {selectedStaff.size} selected
                              </span>
                            )}
                            {expanded && staff.length > 0 && (
                              <Button
                                onClick={() => selectAllCompanyStaff(company.id)}
                                variant="outline"
                                size="sm"
                                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-600 dark:hover:bg-emerald-900/20"
                              >
                                Select All
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Company Staff */}
                      {expanded && staff.length > 0 && (
                        <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                          {staff.map((member) => (
                            <div
                              key={member.id}
                              className={`p-4 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors ${
                                selectedStaff.has(member.id) ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedStaff.has(member.id)}
                                      onChange={() => toggleStaffSelection(company.id, member.id)}
                                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]"
                                    />
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                          {member.full_name}
                                        </span>
                                        {member.is_primary_contact && (
                                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                                            Primary Contact
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        <span className="flex items-center gap-1">
                                          <Mail className="w-3 h-3" />
                                          {member.email}
                                        </span>
                                        {member.phone && (
                                          <span className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {member.phone}
                                          </span>
                                        )}
                                      </div>
                                      {member.job_title && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                          {member.job_title}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : searchTerm ? (
                  <div className="text-center py-8">
                    <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No companies found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Search for companies to invite their staff
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}