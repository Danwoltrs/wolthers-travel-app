import React from 'react'
import { Calendar, Users, Car, Clock } from 'lucide-react'
import type { TripCard as TripCardType } from '@/types'
import { formatDateRange, cn, getTripProgress } from '@/lib/utils'

interface TripCardProps {
  trip: TripCardType
  onClick?: () => void
  isPast?: boolean
}

export default function TripCard({ trip, onClick, isPast = false }: TripCardProps) {
  const progress = getTripProgress(trip.startDate, trip.endDate)
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-sm border border-pearl-200 hover:border-pearl-300 transition-all duration-200 cursor-pointer overflow-hidden h-full flex flex-col h-[420px] shadow-sm hover:shadow-md',
        isPast && 'opacity-75 hover:opacity-100'
      )}
    >
      {/* Trip Title Header with Gold/Cream Background */}
      <div className="bg-amber-50 px-6 py-5">
        <h3 className="text-lg font-semibold text-pearl-900 truncate leading-tight" title={trip.title}>
          {trip.title}
        </h3>
      </div>
      
      {/* Thin Progress Bar */}
      <div className="h-1 bg-pearl-100 relative">
        <div 
          className="absolute left-0 top-0 h-full bg-amber-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Company Section with Light Brown Background */}
      <div className="bg-amber-100/50 px-6 py-3 border-b border-pearl-100">
        <div className="flex items-start">
          <span className="text-sm font-medium text-pearl-800">Visiting:</span>
          <div className="ml-2 flex-1">
            {trip.client.map((company, index) => (
              <span key={company.id} className="text-sm text-pearl-700">
                {company.fantasyName || company.name}
                {index < trip.client.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-5 flex-1 flex flex-col">
        {/* Trip Subject */}
        <div className="h-12 mb-4">
          <p className="text-sm text-pearl-700 line-clamp-2 leading-relaxed" style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {trip.subject}
          </p>
        </div>

        {/* Dates and Duration */}
        <div className="h-12 mb-4">
          <div className="flex items-center text-sm text-pearl-800 mb-2">
            <Calendar className="w-4 h-4 mr-3 text-pearl-500" />
            <span className="font-medium">{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
          <div className="flex items-center text-sm text-pearl-700">
            <Clock className="w-4 h-4 mr-3 text-pearl-500" />
            <span className="font-medium">{trip.duration} days</span>
          </div>
        </div>


        {/* Team Information - Fixed Heights */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Wolthers Staff */}
          <div className="h-24 mb-4">
            <div className="flex items-center text-pearl-800 mb-2">
              <Users className="w-4 h-4 mr-3 text-pearl-500" />
              <span className="text-sm font-medium">Wolthers Staff</span>
            </div>
            <div className="space-y-1 pl-7">
              {trip.wolthersStaff.slice(0, 2).map((staff) => (
                <div key={staff.id} className="text-sm text-pearl-700">
                  {staff.fullName}
                </div>
              ))}
              {trip.wolthersStaff.length > 2 && (
                <div className="text-sm text-pearl-600">
                  +{trip.wolthersStaff.length - 2} more
                </div>
              )}
            </div>
          </div>

          {/* Fleet & Drivers */}
          <div className="h-24">
            <div className="flex items-center text-pearl-800 mb-2">
              <Car className="w-4 h-4 mr-3 text-pearl-500" />
              <span className="text-sm font-medium">Fleet & Drivers</span>
            </div>
            <div className="space-y-1 pl-7">
              {trip.vehicles.length > 0 ? (
                <>
                  {trip.vehicles.slice(0, 2).map((vehicle) => (
                    <div key={vehicle.id} className="text-sm text-pearl-700">
                      {vehicle.make} {vehicle.model}
                    </div>
                  ))}
                  {trip.vehicles.length > 2 && (
                    <div className="text-sm text-pearl-600">
                      +{trip.vehicles.length - 2} more
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-pearl-500">No vehicles assigned</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}