import React from 'react'
import { TripFormData } from '@/app/trips/new/page'
import { Calendar, Users, Car, Building, DollarSign } from 'lucide-react'
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
          
          {formData.estimatedBudget && (
            <div>
              <span className="text-gray-500 dark:text-gray-400 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Budget:
              </span>
              <p className="font-medium text-gray-900 dark:text-white">
                ${formData.estimatedBudget.toLocaleString()}
              </p>
            </div>
          )}
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
          Companies ({formData.companies.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {formData.companies.map(company => (
            <span
              key={company.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
            >
              {company.fantasyName || company.name}
            </span>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Team Members
        </h3>
        
        <div className="space-y-3">
          {formData.wolthersStaff.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Wolthers Staff ({formData.wolthersStaff.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {formData.wolthersStaff.map(staff => (
                  <div key={staff.id} className="text-sm text-gray-700 dark:text-gray-300">
                    {staff.fullName}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {formData.drivers.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Drivers ({formData.drivers.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {formData.drivers.map(driver => (
                  <div key={driver.id} className="text-sm text-gray-700 dark:text-gray-300">
                    {driver.fullName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicles */}
      {formData.vehicles.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <Car className="w-4 h-4 mr-2" />
            Vehicles ({formData.vehicles.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {formData.vehicles.map(vehicle => (
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
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formData.itineraryDays.length} days planned
        </p>
      </div>
    </div>
  )
}