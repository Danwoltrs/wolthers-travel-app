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

          {/* Buyer Companies & Guests */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Buyer Companies & Guests</h3>
            {(() => {
              // Get all buyer companies and their guests
              const companiesInfo: { company: string; guests: string[] }[] = []
              
              if (formData.companies && formData.companies.length > 0) {
                formData.companies.forEach(company => {
                  const participants = (company as any).participants || []
                  const guests = participants.map((p: any) => 
                    p.full_name || p.name || 'Unnamed Guest'
                  )
                  
                  companiesInfo.push({
                    company: company.fantasyName || company.name,
                    guests: guests
                  })
                })
              }
              
              // Also check flight info for additional passengers
              if (formData.flightInfo && formData.flightInfo.passengerName) {
                const companyName = formData.companies && formData.companies.length > 0 
                  ? (formData.companies[0].fantasyName || formData.companies[0].name)
                  : 'Unknown Company'
                
                // Add to existing company or create new entry
                const existingCompany = companiesInfo.find(c => c.company === companyName)
                if (existingCompany) {
                  existingCompany.guests.push(formData.flightInfo.passengerName)
                } else {
                  companiesInfo.push({
                    company: companyName,
                    guests: [formData.flightInfo.passengerName]
                  })
                }
              }
              
              return companiesInfo.length > 0 ? (
                <div className="space-y-2">
                  {companiesInfo.map((companyInfo, idx) => (
                    <div key={idx}>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{companyInfo.company}</p>
                      {companyInfo.guests.length > 0 ? (
                        companyInfo.guests.map((guest, guestIdx) => (
                          <p key={guestIdx} className="text-gray-600 dark:text-gray-400 text-sm ml-2">• {guest}</p>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm ml-2 italic">• No specific guests assigned</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No buyer companies</p>
              )
            })()}
          </div>

          {/* Vehicle & Driver */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Vehicle & Driver</h3>
            {(() => {
              // Check vehicle assignments first
              const assignments = formData.vehicleAssignments || []
              
              if (assignments.length > 0) {
                return (
                  <div className="space-y-2">
                    {assignments.map((assignment: any, idx: number) => {
                      const driver = assignment.driver
                      const vehicle = assignment.vehicle
                      
                      return (
                        <div key={idx}>
                          {vehicle && (
                            <p className="text-gray-700 dark:text-gray-300">
                              {vehicle.make} {vehicle.model}
                            </p>
                          )}
                          {driver && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              Driver: {driver.fullName || driver.full_name || driver.name || 'Unnamed Driver'}
                            </p>
                          )}
                          {vehicle && vehicle.licensePlate && (
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              {vehicle.licensePlate}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              }
              
              // Fallback to legacy vehicles array
              if ((formData.vehicles || []).length > 0) {
                return (
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
                )
              }
              
              return <p className="text-gray-500 dark:text-gray-400 italic">No vehicle selected</p>
            })()}
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