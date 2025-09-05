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
          
          {/* Estimated Budget section removed */}
          {/* Budget will be re-implemented in a future update */}
        </div>
        
        {formData.description && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Description:</span>
            <p className="text-gray-900 dark:text-white mt-1">{formData.description}</p>
          </div>
        )}
      </div>

      {/* Companies */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
          <Building className="w-4 h-4 mr-2" />
          Companies ({(formData.companies || []).length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {(formData.companies || []).map(company => (
            <span
              key={company.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
            >
              {company.fantasyName || company.name}
            </span>
          ))}
        </div>
      </div>

      {/* Team & Drivers */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Team Members & Drivers
        </h3>
        
        <div className="space-y-4">
          {/* Show participants from formData.participants (selected Wolthers staff) */}
          {(formData.participants || []).length > 0 && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Wolthers Staff ({(formData.participants || []).length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(formData.participants || []).map(staff => (
                  <div key={staff.id} className="text-sm">
                    <div className="text-gray-700 dark:text-gray-300 font-medium">
                      {staff.fullName || staff.name}
                    </div>
                    {(staff as any).isDriver && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                        <Car className="w-3 h-3 mr-1" />
                        Driver - {(staff as any).drivingLicense || 'B'} License
                        {(staff as any).canDriveManual && ' (Manual)'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Legacy support for formData.wolthersStaff */}
          {(formData.wolthersStaff || []).length > 0 && !(formData.participants || []).length && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Wolthers Staff ({(formData.wolthersStaff || []).length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(formData.wolthersStaff || []).map(staff => (
                  <div key={staff.id} className="text-sm text-gray-700 dark:text-gray-300">
                    {staff.fullName}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Show driver count summary */}
          {(formData.participants || []).filter((p: any) => p.isDriver).length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700">
              <div className="flex items-center text-emerald-700 dark:text-emerald-400">
                <Car className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  {(formData.participants || []).filter((p: any) => p.isDriver).length} Staff Member(s) Available as Driver(s)
                </span>
              </div>
            </div>
          )}
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
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          Itinerary Summary
        </h3>
        
        {/* Generated Activities Display */}
        {formData.generatedActivities && formData.generatedActivities.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formData.generatedActivities.length} activities planned across {' '}
              {[...new Set(formData.generatedActivities.map(a => a.activity_date))].length} days
            </p>
            
            {/* Group activities by date */}
            {[...new Set(formData.generatedActivities.map(a => a.activity_date))]
              .sort()
              .map(date => {
                const dayActivities = formData.generatedActivities!.filter(a => a.activity_date === date)
                const formattedDate = new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })
                
                return (
                  <div key={date} className="border-l-2 border-blue-200 dark:border-blue-800 pl-3 ml-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {formattedDate}
                    </h4>
                    <div className="space-y-1">
                      {dayActivities.map((activity, idx) => (
                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-gray-400 mr-2 mt-0.5">•</span>
                          <div>
                            <span className="text-gray-500 mr-2">
                              {activity.start_time} - {activity.end_time}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {activity.title}
                            </span>
                            {activity.location && (
                              <div className="text-gray-500 text-xs mt-0.5">
                                📍 {activity.location}
                              </div>
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
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {(formData.itineraryDays || []).length} days planned
          </p>
        )}
      </div>
    </div>
  )
}