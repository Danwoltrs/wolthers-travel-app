import React, { useRef, useState } from 'react'
import { Calendar, Users, Car, Clock, MapPin, Mail, TrendingUp, Route, Key, Check } from 'lucide-react'
import type { TripCard as TripCardType } from '@/types'
import { formatDateRange, cn, getTripProgress, getTripStatus, getTripStatusLabel, getTripProgressColor, formatTripDates } from '@/lib/utils'
// Removed framer-motion imports to fix tooltip interference

interface TripCardProps {
  trip: TripCardType
  onClick?: () => void
  isPast?: boolean
}

export default function TripCard({ trip, onClick, isPast = false }: TripCardProps) {
  const ref = useRef(null)
  const [showCopied, setShowCopied] = useState(false)
  const [copiedPosition, setCopiedPosition] = useState({ x: 0, y: 0 })
  
  // Check if this is a draft trip
  const isDraft = (trip as any).isDraft || (trip as any).status === 'draft'
  
  // Always calculate progress based on current date for real-time updates
  const progress = isDraft ? (trip as any).completionPercentage || 0 : getTripProgress(trip.startDate, trip.endDate)
  const tripStatus = isDraft ? 'draft' : getTripStatus(trip.startDate, trip.endDate)
  const statusLabel = isDraft ? getDraftStatusLabel(trip) : getTripStatusLabel(trip.startDate, trip.endDate)
  const progressColor = isDraft ? 'amber' : getTripProgressColor(trip.startDate, trip.endDate)
  const { dateRange, duration } = formatTripDates(trip.startDate, trip.endDate)
  
  // Helper function to get draft status label
  function getDraftStatusLabel(trip: any) {
    if (!trip.startDate) return 'DRAFT'
    
    const startDate = new Date(trip.startDate)
    const now = new Date()
    const diffTime = startDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return 'DRAFT'
    if (diffDays <= 7) return `DRAFT - ${diffDays} day${diffDays === 1 ? '' : 's'}`
    if (diffDays <= 56) { // 8 weeks
      const weeks = Math.ceil(diffDays / 7)
      return `DRAFT - ${weeks} week${weeks === 1 ? '' : 's'}`
    }
    const months = Math.ceil(diffDays / 30)
    return `DRAFT - ${months} month${months === 1 ? '' : 's'}`
  }

  // Removed 3D tilt effect to fix tooltip interference

  const handleCopyAccessCode = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    
    if (!trip.accessCode) return
    
    // Capture mouse position
    setCopiedPosition({ x: e.clientX, y: e.clientY })
    
    try {
      await navigator.clipboard.writeText(trip.accessCode)
      // Show copied notification
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 1200) // Hide after 1.2 seconds
      
      console.log('Access code copied:', trip.accessCode)
    } catch (err) {
      console.error('Failed to copy access code:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = trip.accessCode || ''
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      // Show copied notification even for fallback
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 1200)
    }
  }
  
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'rounded-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col w-full max-w-sm xl:max-w-none h-[420px]',
        'shadow-lg hover:shadow-2xl',
        'hover:-translate-y-1 hover:scale-[1.02]',
        isDraft 
          ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-600/50 shadow-amber-200/50 dark:shadow-amber-900/20 hover:shadow-amber-300/50 dark:hover:shadow-amber-900/40'
          : 'bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40',
        isPast ? 'opacity-80 hover:opacity-100 grayscale hover:grayscale-0' : ''
      )}
    >
        {/* Zone 1: Header - Golden/Amber Background */}
        <div className={cn(
          'px-4 py-3 relative h-14 flex items-center',
          isDraft 
            ? 'bg-amber-400 dark:bg-amber-800'
            : 'bg-golden-400 dark:bg-[#09261d]'
        )}>
          <h3 className={cn(
            'text-lg font-bold leading-tight drop-shadow-sm line-clamp-2 flex-1 pr-6',
            isDraft 
              ? 'text-amber-900 dark:text-amber-100'
              : 'text-white dark:text-golden-400'
          )} title={trip.title}>
            {trip.title}
          </h3>
          {trip.accessCode && (
            <button
              onClick={handleCopyAccessCode}
              className={cn(
                'absolute right-2 transition-colors p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10',
                isDraft
                  ? 'text-amber-900 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-200'
                  : 'text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300'
              )}
              title="Copy trip key"
            >
              <Key className="w-4 h-4" />
            </button>
          )}
        </div>
      
      {/* Zone 2: Progress Bar with Status Text */}
      <div className={cn(
        'h-6 relative overflow-hidden',
        isDraft 
          ? 'bg-amber-700 dark:bg-amber-900'
          : 'bg-emerald-900 dark:bg-[#111111]'
      )}>
        <div 
          className={cn(
            'absolute left-0 top-0 h-full transition-all duration-700 shadow-sm',
            isDraft 
              ? 'bg-amber-500 dark:bg-amber-600'
              : 'bg-emerald-700 dark:bg-[#123d32]'
          )}
          style={{ width: `${progress}%` }}
        />
        
        {/* Status Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white z-10">
            {isDraft ? statusLabel :
             tripStatus === 'ongoing' ? 'ONGOING' : 
             tripStatus === 'upcoming' ? statusLabel : 
             'COMPLETED'}
          </span>
        </div>
        
        {tripStatus === 'ongoing' && !isDraft && (
          <div className="absolute right-2 top-0 h-full flex items-center">
            <TrendingUp className="w-2 h-2 text-white z-10" />
          </div>
        )}
      </div>
      
      {/* Zone 3: Date and Client Section */}
      <div className={cn(
        'px-6 py-3 border-b h-16 flex flex-col justify-center',
        isDraft 
          ? 'bg-amber-25 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
          : 'bg-white dark:bg-[#1a1a1a] border-pearl-200 dark:border-[#2a2a2a]'
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className={cn(
            'flex items-center text-xs font-medium',
            isDraft 
              ? 'text-amber-900 dark:text-amber-200'
              : 'text-gray-900 dark:text-gray-200'
          )}>
            <Calendar className={cn(
              'w-3 h-3 mr-2 flex-shrink-0',
              isDraft 
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-golden-500 dark:text-[#0E3D2F]'
            )} />
            {dateRange}
          </div>
          <span className={cn(
            'text-xs font-medium',
            isDraft 
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-gray-500 dark:text-gray-400'
          )}>{duration}</span>
        </div>
        <div className="flex flex-wrap gap-x-2">
          {isDraft ? (
            <span className={cn(
              'text-sm font-medium',
              isDraft 
                ? 'text-amber-800 dark:text-amber-300'
                : 'text-gray-900 dark:text-gray-200'
            )}>
              {(trip as any).tripType ? (trip as any).tripType.replace('_', ' ').toUpperCase() + ' Trip' : 'New Trip'}
            </span>
          ) : (
            trip.client?.map((company, index) => (
              <span key={company.id} className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {company.fantasyName || company.name}
                {index < trip.client.length - 1 && <span className="text-gray-600 dark:text-gray-400">,</span>}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Zone 4: Guest Information - White Background */}
      <div className="bg-white dark:bg-[#1a1a1a] px-6 py-3 border-b border-pearl-100 dark:border-[#2a2a2a] h-24 flex flex-col justify-start">
        <div className="space-y-1">
          {trip.guests && trip.guests.map((guestGroup, index) => {
            const company = trip.client.find(c => c.id === guestGroup.companyId);
            return (
              <div key={guestGroup.companyId} className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{company?.fantasyName || company?.name}:</span>{' '}
                <span>{guestGroup.names.join(', ')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone 5: Team & Logistics - Very Light Golden Background */}
      <div className="bg-golden-50 dark:bg-[#111111] px-6 py-3 h-[140px] flex flex-col justify-between space-y-2">
        {/* Wolthers Team Section */}
        <div>
          <div className="flex items-center mb-1">
            <Users className="w-4 h-4 mr-2 text-golden-500 dark:text-[#0E3D2F] flex-shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide text-pearl-800 dark:text-gray-300">Wolthers Team Attending</span>
          </div>
          <div className="flex flex-wrap gap-x-2 min-h-[2rem]">
            {trip.wolthersStaff.slice(0, 3).map((staff, index) => (
              <span key={staff.id} className="text-xs text-pearl-700 dark:text-gray-400">
                {staff.fullName}
                {index < Math.min(trip.wolthersStaff.length - 1, 2) && <span className="text-pearl-500 dark:text-gray-500">,</span>}
              </span>
            ))}
            {trip.wolthersStaff.length > 3 && (
              <span className="text-xs text-golden-600 dark:text-[#0E3D2F] font-medium">
                +{trip.wolthersStaff.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        {!isDraft && (
          /* Fleet and Driver Section */
          <div className="grid grid-cols-2 gap-4">
            {/* Fleet Section */}
            <div>
              <div className="flex items-center mb-1">
                <Car className="w-4 h-4 mr-2 text-golden-500 dark:text-[#0E3D2F] flex-shrink-0" />
                <span className="text-xs font-medium uppercase tracking-wide text-pearl-800 dark:text-gray-300">Fleet</span>
              </div>
              <div className="space-y-1">
                {trip.vehicles?.length > 0 ? (
                  <>
                    {trip.vehicles.slice(0, 3).map((vehicle) => (
                      <div key={vehicle.id} className="text-xs text-pearl-700 dark:text-gray-400 truncate">
                        {vehicle.make} {vehicle.model}
                      </div>
                    ))}
                    {trip.vehicles.length > 3 && (
                      <div className="text-xs text-golden-600 dark:text-[#0E3D2F] font-medium">
                        +{trip.vehicles.length - 3} more
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-pearl-500 dark:text-gray-500 italic">No vehicles assigned</div>
                )}
              </div>
            </div>
            
            {/* Driver Section */}
            <div>
              <div className="flex items-center mb-1">
                <Users className="w-4 h-4 mr-2 text-golden-500 dark:text-[#0E3D2F] flex-shrink-0" />
                <span className="text-xs font-medium uppercase tracking-wide text-pearl-800 dark:text-gray-300">Driver</span>
              </div>
              <div className="space-y-1">
                {trip.drivers?.length > 0 ? (
                  <>
                    {trip.drivers.slice(0, 3).map((driver) => (
                      <div key={driver.id} className="text-xs text-pearl-700 dark:text-gray-400 truncate">
                        {driver.fullName}
                      </div>
                    ))}
                    {trip.drivers.length > 3 && (
                      <div className="text-xs text-golden-600 dark:text-[#0E3D2F] font-medium">
                        +{trip.drivers.length - 3} more
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-pearl-500 dark:text-gray-500 italic">No driver assigned</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone 6: Footer Actions */}
      <div className={cn(
        'px-6 py-2 rounded-b-lg h-10 flex items-center justify-between',
        isDraft 
          ? 'bg-amber-50 dark:bg-amber-900/20'
          : 'bg-white dark:bg-[#1a1a1a]'
      )}>
        {isDraft ? (
          /* Draft Footer */
          <>
            <span className={cn(
              'text-xs',
              'text-amber-700 dark:text-amber-400'
            )}>
              Step {(trip as any).currentStep || 1} of 5
            </span>
            
            <div className="flex-1 flex justify-center">
              <span className={cn(
                'text-xs font-medium',
                'text-amber-800 dark:text-amber-300'
              )}>
                {progress}% Complete
              </span>
            </div>
            
            <span className={cn(
              'text-xs',
              'text-amber-600 dark:text-amber-500'
            )}>
              Draft
            </span>
          </>
        ) : (
          /* Regular Trip Footer */
          <>
            {/* Key Visits Count - Left */}
            <span className="text-xs text-pearl-600 dark:text-gray-400">
              {trip.visitCount || 0} visit{trip.visitCount !== 1 ? 's' : ''}
            </span>
            
            {/* Status Indicator - Center */}
            <div className="flex-1 flex justify-center">
              {tripStatus === 'ongoing' && (
                <span className="text-xs text-pearl-600 dark:text-gray-400">
                  {progress}% complete
                </span>
              )}
              {tripStatus === 'upcoming' && (
                <span className="text-xs text-pearl-600 dark:text-gray-400">
                  {statusLabel}
                </span>
              )}
              {tripStatus === 'completed' && (
                <span className="text-xs text-pearl-600 dark:text-gray-400">
                  Completed
                </span>
              )}
            </div>
            
            {/* Notes Count - Right */}
            <span className="text-xs text-pearl-500 dark:text-gray-500 hover:text-golden-600 dark:hover:text-[#0E3D2F] transition-colors">
              {trip.notesCount && trip.notesCount > 0 
                ? `${trip.notesCount} note${trip.notesCount > 1 ? 's' : ''}`
                : 'No notes'
              }
            </span>
          </>
        )}
      </div>

      {/* Copy Notification Overlay */}
      {showCopied && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: copiedPosition.x - 50,
            top: copiedPosition.y - 40,
          }}
        >
          <div className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in zoom-in duration-200">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Key copied</span>
          </div>
        </div>
      )}
    </div>
  )
}