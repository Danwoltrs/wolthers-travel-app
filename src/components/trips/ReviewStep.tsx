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
      {/* Trip Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          
          {/* Dates */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Dates</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {formData.startDate && formData.endDate && 
                formatDateRange(formData.startDate, formData.endDate)
              }
            </p>
          </div>

          {/* Wolthers Staff */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Wolthers Staff</h3>
            {(() => {
              const staff = (formData.participants || []).length > 0 
                ? formData.participants 
                : formData.wolthersStaff || []
              
              return staff.length > 0 ? (
                <div className="space-y-1">
                  {staff.map(member => (
                    <p key={member.id} className="text-gray-700 dark:text-gray-300">
                      {member.fullName || member.full_name || member.name || 'Unnamed Staff'}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">None selected</p>
              )
            })()}
          </div>

          {/* Guest */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Guest</h3>
            {formData.flightInfo && formData.flightInfo.passengerName ? (
              <div>
                <p className="text-gray-700 dark:text-gray-300">{formData.flightInfo.passengerName}</p>
                {formData.companies && formData.companies.length > 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {formData.companies[0].fantasyName || formData.companies[0].name}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No guest</p>
            )}
          </div>

          {/* Vehicle & Driver */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Vehicle & Driver</h3>
            {(formData.vehicles || []).length > 0 ? (
              <div className="space-y-1">
                {(formData.vehicles || []).map(vehicle => (
                  <div key={vehicle.id}>
                    <p className="text-gray-700 dark:text-gray-300">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {vehicle.licensePlate}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No vehicle selected</p>
            )}
          </div>
        </div>
      </div>

      {/* Itinerary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">Itinerary</h3>
        
        {formData.generatedActivities && formData.generatedActivities.length > 0 ? (
          <div className="space-y-4">
            {[...new Set(formData.generatedActivities.map(a => a.activity_date))]
              .sort()
              .map(date => {
                const dayActivities = formData.generatedActivities!.filter(a => a.activity_date === date)
                const formattedDate = new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })
                
                return (
                  <div key={date}>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {formattedDate}
                    </h4>
                    <div className="space-y-1 ml-4">
                      {dayActivities.map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="text-gray-500 dark:text-gray-400 text-sm font-mono min-w-[50px]">
                            {activity.start_time}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {activity.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            }
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">
            Itinerary will be created after trip setup
          </p>
        )}
      </div>
    </div>
  )
}