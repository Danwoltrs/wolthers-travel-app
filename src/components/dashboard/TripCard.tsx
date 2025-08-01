import React from 'react'
import { Calendar, Users, Car, Clock, MapPin, Mail, TrendingUp, Route } from 'lucide-react'
import type { TripCard as TripCardType } from '@/types'
import { formatDateRange, cn, getTripProgress, getTripStatus, getTripStatusLabel, getTripProgressColor, formatTripDates } from '@/lib/utils'

interface TripCardProps {
  trip: TripCardType
  onClick?: () => void
  isPast?: boolean
}

export default function TripCard({ trip, onClick, isPast = false }: TripCardProps) {
  const progress = getTripProgress(trip.startDate, trip.endDate)
  const tripStatus = getTripStatus(trip.startDate, trip.endDate)
  const statusLabel = getTripStatusLabel(trip.startDate, trip.endDate)
  const progressColor = getTripProgressColor(trip.startDate, trip.endDate)
  const { dateRange, duration } = formatTripDates(trip.startDate, trip.endDate)
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col w-full max-w-sm xl:max-w-none h-[420px] card-3d',
        isPast ? 'opacity-80 hover:opacity-100 grayscale hover:grayscale-0' : 'hover:card-3d-hover'
      )}
    >
      {/* Zone 1: Header - Golden Background */}
      <div className="bg-golden-400 dark:bg-[#09261d] px-6 py-3 relative h-14 flex items-center">
        <h3 className="text-lg font-bold text-white dark:text-golden-400 leading-tight drop-shadow-sm" title={trip.title}>
          {trip.title}
        </h3>
      </div>
      
      {/* Zone 2: Progress Bar with Status Text */}
      <div className="h-6 relative overflow-hidden bg-emerald-900 dark:bg-[#111111]">
        <div 
          className="absolute left-0 top-0 h-full transition-all duration-700 shadow-sm bg-emerald-700 dark:bg-[#123d32]"
          style={{ width: `${progress}%` }}
        />
        
        {/* Status Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white z-10">
            {tripStatus === 'ongoing' ? 'ONGOING' : 
             tripStatus === 'upcoming' ? statusLabel : 
             'COMPLETED'}
          </span>
        </div>
        
        {tripStatus === 'ongoing' && (
          <div className="absolute right-2 top-0 h-full flex items-center">
            <TrendingUp className="w-2 h-2 text-white z-10" />
          </div>
        )}
      </div>
      
      {/* Zone 3: Date and Client Section - White Background */}
      <div className="bg-white dark:bg-[#1a1a1a] px-6 py-3 border-b border-pearl-200 dark:border-[#2a2a2a] h-16 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-xs font-medium text-gray-900 dark:text-gray-200">
            <Calendar className="w-3 h-3 mr-2 text-golden-500 dark:text-[#0E3D2F] flex-shrink-0" />
            {dateRange}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{duration}</span>
        </div>
        <div className="flex flex-wrap gap-x-2">
          {trip.client.map((company, index) => (
            <span key={company.id} className="text-sm font-medium text-gray-900 dark:text-gray-200">
              {company.fantasyName || company.name}
              {index < trip.client.length - 1 && <span className="text-gray-600 dark:text-gray-400">,</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Zone 4: Guest Information - White Background */}
      <div className="bg-white dark:bg-[#1a1a1a] px-6 py-3 border-b border-pearl-100 dark:border-[#2a2a2a] h-24 flex flex-col justify-start">
        <div className="space-y-1">
          {trip.guests.map((guestGroup, index) => {
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
      <div className="bg-golden-50 dark:bg-[#111111] px-6 py-3 flex-1 flex flex-col justify-start space-y-2">
        {/* Team Section */}
        <div>
          <div className="flex items-center mb-1">
            <Users className="w-4 h-4 mr-2 text-golden-500 dark:text-[#0E3D2F] flex-shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide text-pearl-800 dark:text-gray-300">Team</span>
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
        
        {/* Fleet and Driver Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Fleet Section */}
          <div>
            <div className="flex items-center mb-1">
              <Car className="w-4 h-4 mr-2 text-golden-500 dark:text-[#0E3D2F] flex-shrink-0" />
              <span className="text-xs font-medium uppercase tracking-wide text-pearl-800 dark:text-gray-300">Fleet</span>
            </div>
            <div className="space-y-1">
              {trip.vehicles.length > 0 ? (
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
              {trip.drivers.length > 0 ? (
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
      </div>

      {/* Zone 6: Footer Actions - White Background */}
      <div className="bg-white dark:bg-[#1a1a1a] px-6 py-2 rounded-b-lg h-10 flex items-center justify-between">
        {/* Key Visits Count - Left */}
        <span className="text-xs text-pearl-600 dark:text-gray-400">
          {trip.client.length} visit{trip.client.length > 1 ? 's' : ''}
        </span>
        
        {/* Progress Indicator for Ongoing Trips - Center */}
        <div className="flex-1 flex justify-center">
          {tripStatus === 'ongoing' && (
            <span className="text-xs text-pearl-600 dark:text-gray-400">
              {progress}% complete
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
      </div>
    </div>
  )
}