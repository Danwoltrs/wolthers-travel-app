import React from 'react'
import { TripFormData } from './TripCreationModal'
import { Plus, Calendar, Clock, MapPin } from 'lucide-react'

interface ItineraryBuilderStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

export default function ItineraryBuilderStep({ formData, updateFormData }: ItineraryBuilderStepProps) {
  // Calculate days between start and end date
  const getDaysArray = () => {
    if (!formData.startDate || !formData.endDate) return []
    
    const days = []
    const currentDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  const days = getDaysArray()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Build Your Itinerary
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add activities for each day of your trip. You can include meetings, visits, travel time, and meals.
        </p>
      </div>

      {days.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Please select trip dates in the previous step to build your itinerary.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Activity
                </button>
              </div>

              {/* Placeholder for activities */}
              <div className="space-y-3">
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No activities scheduled yet
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Temporary - mark as having itinerary for demo */}
      {days.length > 0 && (
        <button
          type="button"
          onClick={() => updateFormData({ 
            itineraryDays: days.map(day => ({
              id: Math.random().toString(),
              tripId: '',
              date: day,
              activities: [],
              createdAt: new Date()
            }))
          })}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Use Sample Itinerary (Demo)
        </button>
      )}
    </div>
  )
}