import React from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Users, Car, Building, DollarSign, MapPin } from 'lucide-react'
import { formatDateRange } from '@/lib/utils'

interface ReviewStepProps {
  formData: TripFormData
}

export default function ReviewStep({ formData }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Review Trip Details
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please review all the information before creating the trip.
        </p>
      </div>

      {/* Basic Information */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Title:</span>
            <p className="font-medium text-gray-900 dark:text-white">{formData.title}</p>
          </div>
          
          {formData.subject && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Subject:</span>
              <p className="font-medium text-gray-900 dark:text-white">{formData.subject}</p>
            </div>
          )}
          
          <div>
            <span className="text-gray-500 dark:text-gray-400 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Dates:
            </span>
            <p className="font-medium text-gray-900 dark:text-white">
              {formData.startDate && formData.endDate && 
                formatDateRange(formData.startDate, formData.endDate)
              }
            </p>
          </div>
        </div>
        
        {formData.description && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Description:</span>
            <p className="text-gray-900 dark:text-white mt-1">{formData.description}</p>
          </div>
        )}

        {/* Guest Information */}
        {formData.flightInfo && formData.flightInfo.passengerName && (
          <div>
            <span className="text-gray-500 dark:text-gray-400 flex items-center">
              <User className="w-4 h-4 mr-1" />
              Guest:
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                {formData.flightInfo.passengerName}
                {formData.companies && formData.companies.length > 0 && (
                  <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                    ({formData.companies[0].fantasyName || formData.companies[0].name})
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Team Members */}
        <div>
          <span className="text-gray-500 dark:text-gray-400 flex items-center">
            <Users className="w-4 h-4 mr-1" />
            Team:
          </span>
          <div className="mt-1">
            {(() => {
              const staff = (formData.participants || []).length > 0 
                ? formData.participants 
                : formData.wolthersStaff || []
              
              return staff.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {staff.map(member => (
                    <span
                      key={member.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                    >
                      {member.fullName || member.full_name || member.name || 'Unnamed Staff'}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 text-xs">
                  No team members selected
                </span>
              )
            })()}
          </div>
        </div>
      </div>


      {/* Vehicles */}
      {(formData.vehicles || []).length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <Car className="w-4 h-4 mr-2" />
            Vehicles ({(formData.vehicles || []).length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(formData.vehicles || []).map(vehicle => (
              <div key={vehicle.id} className="text-sm text-gray-700 dark:text-gray-300">
                {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itinerary Summary */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Itinerary Summary
        </h3>
        
        {formData.generatedActivities && formData.generatedActivities.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {formData.generatedActivities.length} activities planned across {' '}
                {[...new Set(formData.generatedActivities.map(a => a.activity_date))].length} days
              </span>
            </div>
            
            {/* Simplified activity list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {[...new Set(formData.generatedActivities.map(a => a.activity_date))]
                .sort()
                .map(date => {
                  const dayActivities = formData.generatedActivities!.filter(a => a.activity_date === date)
                  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })
                  
                  return (
                    <div key={date} className="border-l-2 border-emerald-200 dark:border-emerald-800 pl-3 ml-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {formattedDate} ({dayActivities.length} activities)
                      </h4>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {dayActivities.map(activity => activity.title).join(' • ')}
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 inline mr-1" />
            Itinerary will be created after trip setup
          </div>
        )}
      </div>
    </div>
  )
}