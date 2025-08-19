/**
 * Simplified one-line ParticipantRow with checkbox for direct staff selection
 * Streamlined design focusing on name, location, and availability status
 */

import React, { useState } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin,
  Mail,
  UserCheck,
  UserX,
  Send
} from 'lucide-react'
import { EnhancedParticipant, ParticipantRole, ParticipantAvailability } from '@/hooks/useParticipants'
import { getAvailabilityClasses, getAvailabilityTooltip } from '@/lib/availability'

interface ParticipantRowProps {
  participant: EnhancedParticipant
  selected: boolean
  onToggle: (participantId: string, selected: boolean) => void
  tripDateRange: { start: string; end: string }
  className?: string
}

export function ParticipantRow({
  participant,
  selected,
  onToggle,
  tripDateRange,
  className = ''
}: ParticipantRowProps) {
  // Get availability icon and status
  const getAvailabilityIcon = (status: ParticipantAvailability) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'unavailable':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'unknown':
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const isConflicted = participant.conflictingTripName && participant.availability === 'unavailable'
  const isOnTrip = participant.metadata?.addedToTrip

  return (
    <div className={`group px-4 md:px-6 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${
      participant.isOptimistic ? 'opacity-60' : ''
    } ${isConflicted ? 'opacity-50' : ''} ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side: Checkbox and Info */}
        <div className="flex items-center space-x-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={selected || isOnTrip}
            onChange={(e) => onToggle(participant.id, e.target.checked)}
            disabled={isConflicted}
            className={`w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 ${
              isConflicted ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          />

          {/* Name and Location */}
          <div className="flex items-center space-x-2">
            <div className="flex flex-col">
              <span className={`font-medium ${
                isConflicted 
                  ? 'text-gray-400 dark:text-gray-500' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {participant.fullName}
              </span>
              
              {/* Invitation Info for Company Guests */}
              {participant.metadata?.invitation && (participant.role === 'company_rep' || participant.role === 'external') && (
                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>Invited by {participant.metadata.invitation.invitedByName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(participant.metadata.invitation.sentAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {participant.metadata.invitation.status === 'accepted' ? (
                      <>
                        <UserCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Accepted</span>
                      </>
                    ) : participant.metadata.invitation.status === 'declined' ? (
                      <>
                        <UserX className="w-3 h-3 text-red-500" />
                        <span className="text-red-600 dark:text-red-400">Declined</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 text-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400">Pending</span>
                        {participant.metadata.invitation.emailSentCount > 1 && (
                          <span className="text-gray-400">({participant.metadata.invitation.emailSentCount} emails)</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {participant.location && (
              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="w-3 h-3" />
                <span>{participant.location}</span>
              </div>
            )}

            {isOnTrip && (
              <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                On Trip
              </span>
            )}

            {participant.isOptimistic && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Saving...
              </span>
            )}
          </div>
        </div>

        {/* Right side: Availability and Conflict Info */}
        <div className="flex items-center space-x-3">
          {/* Conflicting Trip Info */}
          {isConflicted && (
            <span className="text-xs text-red-600 dark:text-red-400">
              Scheduled for: {participant.conflictingTripName}
            </span>
          )}

          {/* Availability Indicator */}
          <div className="flex items-center space-x-1">
            {getAvailabilityIcon(participant.availability)}
            <span className={`text-xs capitalize ${
              isConflicted 
                ? 'text-gray-400 dark:text-gray-500'
                : participant.availability === 'available' 
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : participant.availability === 'unavailable'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-400 dark:text-gray-500'
            }`}>
              {participant.availability}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}