import React from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Users, Car, Building, DollarSign, MapPin, User } from 'lucide-react'
import { formatDateRange } from '@/lib/utils'

interface ReviewStepProps {
  formData: TripFormData
}

export default function ReviewStep({ formData }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Review Trip Details
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please review all the information before creating the trip.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Basic Information */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</label>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{formData.title}</p>
              </div>
              
              {formData.subject && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject</label>
                  <p className="text-base text-gray-900 dark:text-white mt-1">{formData.subject}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Dates</label>
                <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                  {formData.startDate && formData.endDate && 
                    formatDateRange(formData.startDate, formData.endDate)
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.startDate && formData.endDate && 
                    `${Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days`
                  }
                </p>
              </div>
              
              {formData.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{formData.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Team & Participants */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Team & Participants
            </h3>
            
            <div className="space-y-4">
              {/* Guest Information */}
              {formData.flightInfo && formData.flightInfo.passengerName && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Guest</label>
                  <div className="mt-2">
                    <div className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                      <User className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                        {formData.flightInfo.passengerName}
                      </span>
                      {formData.companies && formData.companies.length > 0 && (
                        <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                          from {formData.companies[0].fantasyName || formData.companies[0].name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Wolthers Team */}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Wolthers Team</label>
                <div className="mt-2">
                  {(() => {
                    const staff = (formData.participants || []).length > 0 
                      ? formData.participants 
                      : formData.wolthersStaff || []
                    
                    return staff.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {staff.map(member => (
                          <div 
                            key={member.id}
                            className="flex items-center px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium mr-3">
                              {(member.fullName || member.full_name || member.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              {member.fullName || member.full_name || member.name || 'Unnamed Staff'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-amber-600 dark:text-amber-400 italic">
                        No team members selected
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Logistics & Itinerary */}
        <div className="space-y-6">
          
          {/* Vehicles */}
          {(formData.vehicles || []).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-purple-600" />
                Vehicles ({(formData.vehicles || []).length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {(formData.vehicles || []).map(vehicle => (
                  <div 
                    key={vehicle.id} 
                    className="flex items-center px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800"
                  >
                    <Car className="w-4 h-4 mr-3 text-purple-600 dark:text-purple-400" />
                    <div>
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        {vehicle.make} {vehicle.model}
                      </span>
                      <span className="text-xs text-purple-600 dark:text-purple-400 ml-2">
                        ({vehicle.licensePlate})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itinerary Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-orange-600" />
              Itinerary Summary
            </h3>
            
            {formData.generatedActivities && formData.generatedActivities.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-800 dark:text-orange-200 font-medium">
                      {formData.generatedActivities.length} activities planned
                    </span>
                    <span className="text-orange-600 dark:text-orange-400">
                      {[...new Set(formData.generatedActivities.map(a => a.activity_date))].length} days
                    </span>
                  </div>
                </div>
                
                {/* Activity timeline */}
                <div className="space-y-3 max-h-80 overflow-y-auto">
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
                        <div key={date} className="border-l-4 border-orange-200 dark:border-orange-800 pl-4">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            {formattedDate}
                          </h4>
                          <div className="space-y-2">
                            {dayActivities.map((activity, idx) => (
                              <div key={idx} className="flex items-start">
                                <div className="flex-shrink-0 w-12 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {activity.start_time}
                                </div>
                                <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                  {activity.title}
                                  {activity.type === 'travel' && (
                                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                                      (Travel)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Itinerary will be created after trip setup
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}