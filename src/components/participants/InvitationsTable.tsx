/**
 * Clean, minimal table showing all pending and accepted guest invitations
 */

import React, { useState } from 'react'
import { 
  UserCheck,
  UserX, 
  Send,
  Clock,
  Mail,
  RefreshCcw
} from 'lucide-react'
import { PendingInvitation } from '@/hooks/useParticipants'

interface InvitationsTableProps {
  invitations: PendingInvitation[]
  className?: string
  onResendInvitation?: (invitation: PendingInvitation) => Promise<void>
}

export function InvitationsTable({ invitations, className = '', onResendInvitation }: InvitationsTableProps) {
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set())

  const handleResendInvitation = async (invitation: PendingInvitation) => {
    if (!onResendInvitation || resendingIds.has(invitation.id)) return
    
    setResendingIds(prev => new Set(prev).add(invitation.id))
    
    try {
      await onResendInvitation(invitation)
    } finally {
      setResendingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(invitation.id)
        return newSet
      })
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <UserCheck className="w-4 h-4 text-emerald-500" />
      case 'declined':
        return <UserX className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Send className="w-4 h-4 text-amber-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="text-emerald-600 dark:text-emerald-400 capitalize">{status}</span>
      case 'declined':
        return <span className="text-red-600 dark:text-red-400 capitalize">{status}</span>
      case 'pending':
        return <span className="text-amber-600 dark:text-amber-400 capitalize">{status}</span>
      default:
        return <span className="text-gray-500 dark:text-gray-400 capitalize">{status}</span>
    }
  }

  if (invitations.length === 0) {
    return (
      <div className={`px-4 md:px-6 py-12 text-center ${className}`}>
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No invitations sent yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Click "Add Company Guest" above to start inviting company representatives to this trip
        </p>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* Enable horizontal scrolling within the table on small screens instead of the entire page */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-[#2a2a2a]">
          <thead className="bg-gray-50 dark:bg-[#2a2a2a]">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Guest
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Invited By
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-200 dark:divide-[#2a2a2a]">
            {invitations.map((invitation) => (
              <tr key={invitation.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {invitation.guest_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {invitation.guest_email}
                    </div>
                    {invitation.guest_title && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {invitation.guest_title}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {invitation.guest_company || '-'}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {invitation.invited_by_user?.full_name || 'Unknown'}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(invitation.sent_at)}
                    </div>
                    {invitation.email_sent_count > 1 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {invitation.email_sent_count} emails sent
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(invitation.status)}
                    {getStatusText(invitation.status)}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  {invitation.status === 'pending' && onResendInvitation && (
                    <button
                      onClick={() => handleResendInvitation(invitation)}
                      disabled={resendingIds.has(invitation.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send reminder email"
                    >
                      {resendingIds.has(invitation.id) ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border border-amber-700 dark:border-amber-300 border-t-transparent"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="w-3 h-3" />
                          <span>Resend</span>
                        </>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}