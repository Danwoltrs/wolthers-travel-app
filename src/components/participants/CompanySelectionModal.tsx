'use client'

import { useState, useEffect } from 'react'
import { X, Building, User, ChevronDown, ChevronRight, Send, AlertCircle, Users, Mail, RefreshCw, Check, Clock, UserX } from 'lucide-react'
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
  role_priority: number // For sorting: 1 = admin, 2 = manager, 3 = user
}

interface StaffInvitation {
  id: string
  user_id: string
  status: 'pending' | 'accepted' | 'declined'
  sent_at: string
  responded_at?: string
  email_sent_count: number
}

interface CompanyWithStaff {
  company: Company
  staff: CompanyStaff[]
  invitations: StaffInvitation[]
  expanded: boolean
  loading: boolean
}

export function CompanySelectionModal({ isOpen, onClose, tripId, onInvitationSent }: CompanySelectionModalProps) {
  const [companies, setCompanies] = useState<CompanyWithStaff[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load companies on modal open
  useEffect(() => {
    if (!isOpen) return

    const loadCompanies = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/companies/directory?limit=100', {
          credentials: 'include'
        })

        if (response.ok) {
          const result = await response.json()
          const companiesData = result.companies || []
          
          // Sort companies alphabetically
          companiesData.sort((a: Company, b: Company) => 
            a.company_name.localeCompare(b.company_name)
          )
          
          setCompanies(companiesData.map((company: Company) => ({
            company,
            staff: [],
            invitations: [],
            expanded: false,
            loading: false
          })))
        } else {
          setError('Failed to load companies')
        }
      } catch (error) {
        console.error('Failed to load companies:', error)
        setError('Failed to load companies')
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()
  }, [isOpen, tripId])

  // Load staff and invitations for a company
  const loadCompanyData = async (companyId: string) => {
    setCompanies(prev => prev.map(companyData => 
      companyData.company.id === companyId 
        ? { ...companyData, loading: true }
        : companyData
    ))

    try {
      // Load staff and invitations in parallel
      const [staffResponse, invitationsResponse] = await Promise.all([
        fetch(`/api/companies/${companyId}/staff`, {
          credentials: 'include'
        }),
        fetch(`/api/trips/${tripId}/invitations?companyId=${companyId}`, {
          credentials: 'include'
        })
      ])

      let staff: CompanyStaff[] = []
      let invitations: StaffInvitation[] = []

      if (staffResponse.ok) {
        const staffResult = await staffResponse.json()
        staff = (staffResult.staff || []).map((member: any) => ({
          ...member,
          role_priority: member.is_primary_contact ? 1 : (member.job_title?.toLowerCase().includes('admin') ? 1 : 
                        member.job_title?.toLowerCase().includes('manager') ? 2 : 3)
        }))
        
        // Sort staff by role priority, then alphabetically
        staff.sort((a, b) => {
          if (a.role_priority !== b.role_priority) {
            return a.role_priority - b.role_priority
          }
          return a.full_name.localeCompare(b.full_name)
        })
      }

      if (invitationsResponse.ok) {
        const invitationsResult = await invitationsResponse.json()
        invitations = invitationsResult.invitations || []
      }

      setCompanies(prev => prev.map(companyData => 
        companyData.company.id === companyId 
          ? { ...companyData, staff, invitations, expanded: true, loading: false }
          : companyData
      ))
    } catch (error) {
      console.error('Failed to load company data:', error)
      setCompanies(prev => prev.map(companyData => 
        companyData.company.id === companyId 
          ? { ...companyData, loading: false }
          : companyData
      ))
    }
  }

  // Toggle company expansion
  const toggleCompany = (companyId: string) => {
    const companyData = companies.find(c => c.company.id === companyId)
    if (!companyData) return

    if (!companyData.expanded && companyData.staff.length === 0) {
      loadCompanyData(companyId)
    } else {
      setCompanies(prev => prev.map(companyData => 
        companyData.company.id === companyId 
          ? { ...companyData, expanded: !companyData.expanded }
          : companyData
      ))
    }
  }

  // Invite all staff from a company
  const inviteAllCompanyStaff = async (companyId: string) => {
    const companyData = companies.find(c => c.company.id === companyId)
    if (!companyData || companyData.staff.length === 0) return

    try {
      const invitationPromises = companyData.staff.map(staff => 
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
            invitationType: 'external_guest'
          })
        })
      )

      await Promise.allSettled(invitationPromises)
      
      // Reload company data to get updated invitation status
      await loadCompanyData(companyId)
      onInvitationSent()
      
    } catch (error) {
      console.error('Failed to invite company staff:', error)
      setError('Failed to send invitations')
    }
  }

  // Invite individual staff member
  const inviteStaffMember = async (staff: CompanyStaff) => {
    try {
      const response = await fetch('/api/guests/invite', {
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
          invitationType: 'external_guest'
        })
      })

      if (response.ok) {
        // Reload company data to get updated invitation status
        await loadCompanyData(staff.company_id)
        onInvitationSent()
      } else {
        setError('Failed to send invitation')
      }
    } catch (error) {
      console.error('Failed to invite staff member:', error)
      setError('Failed to send invitation')
    }
  }

  // Re-issue invitation
  const reissueInvitation = async (staff: CompanyStaff) => {
    try {
      const response = await fetch('/api/guests/invite', {
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
          message: `Reminder: You have been invited as a representative of ${staff.company_name}.`,
          invitationType: 'external_guest',
          isReminder: true
        })
      })

      if (response.ok) {
        await loadCompanyData(staff.company_id)
        onInvitationSent()
      } else {
        setError('Failed to resend invitation')
      }
    } catch (error) {
      console.error('Failed to resend invitation:', error)
      setError('Failed to resend invitation')
    }
  }

  // Get invitation status for a staff member
  const getInvitationStatus = (staffId: string, companyInvitations: StaffInvitation[]) => {
    return companyInvitations.find(inv => inv.user_id === staffId)
  }

  const handleClose = () => {
    onClose()
    // Reset state
    setTimeout(() => {
      setCompanies([])
      setError(null)
      setSuccess(false)
    }, 300)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] shadow-xl rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] text-white dark:text-golden-400 px-6 py-4 border-b border-pearl-200 dark:border-[#0a2e21] flex justify-between items-center">
          <h2 className="text-lg font-semibold">Company Guests</h2>
          <button 
            onClick={handleClose}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-[#1a1a1a] overflow-hidden">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-2">
                Invitations Sent!
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Company guest invitations have been sent successfully.
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading companies...</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Companies Table */}
              <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
                {companies.length > 0 ? (
                  companies.map(({ company, staff, invitations, expanded, loading: companyLoading }) => (
                    <div key={company.id}>
                      {/* Company Row */}
                      <div className="border-b border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() => toggleCompany(company.id)}
                              className="flex items-center gap-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                            >
                              {expanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {company.company_name}
                                </span>
                                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                                  <Users className="w-3 h-3" />
                                  {company.total_staff} staff
                                </span>
                                {company.company_type && (
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs flex-shrink-0">
                                    {company.company_type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => inviteAllCompanyStaff(company.id)}
                            size="sm"
                            disabled={companyLoading || company.total_staff === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
                          >
                            {companyLoading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
                            ) : (
                              <Send className="w-3 h-3 mr-1" />
                            )}
                            Invite All
                          </Button>
                        </div>
                      </div>

                      {/* Staff Rows */}
                      {expanded && (
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a]">
                          {companyLoading ? (
                            <div className="px-4 py-6 text-center">
                              <div className="animate-spin rounded-full h-5 w-5 border border-gray-400 border-t-transparent mx-auto mb-2"></div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Loading staff...</p>
                            </div>
                          ) : staff.length > 0 ? (
                            staff.map((member) => {
                              const invitation = getInvitationStatus(member.id, invitations)
                              return (
                                <div key={member.id} className="border-b border-gray-200 dark:border-[#2a2a2a] last:border-b-0">
                                  <div className="flex items-center justify-between px-8 py-2 hover:bg-white dark:hover:bg-[#2a2a2a] transition-colors">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {member.full_name}
                                          </span>
                                          {member.is_primary_contact && (
                                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs flex-shrink-0">
                                              Admin
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate block">
                                          {member.email}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      {/* Status */}
                                      <div className="flex items-center gap-1 min-w-0">
                                        {invitation ? (
                                          invitation.status === 'accepted' ? (
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                              <Check className="w-3 h-3" />
                                              <span className="text-xs">Accepted</span>
                                            </div>
                                          ) : invitation.status === 'declined' ? (
                                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                              <UserX className="w-3 h-3" />
                                              <span className="text-xs">Declined</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                              <Clock className="w-3 h-3" />
                                              <span className="text-xs">Pending</span>
                                            </div>
                                          )
                                        ) : (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">Not invited</span>
                                        )}
                                      </div>
                                      
                                      {/* Action Button */}
                                      {invitation ? (
                                        <Button
                                          onClick={() => reissueInvitation(member)}
                                          size="sm"
                                          variant="outline"
                                          className="text-xs px-2 py-1 h-6"
                                        >
                                          <RefreshCw className="w-3 h-3 mr-1" />
                                          Resend
                                        </Button>
                                      ) : (
                                        <Button
                                          onClick={() => inviteStaffMember(member)}
                                          size="sm"
                                          className="text-xs px-2 py-1 h-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                          <Send className="w-3 h-3 mr-1" />
                                          Invite
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="px-8 py-4 text-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400">No staff members found</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No companies found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}