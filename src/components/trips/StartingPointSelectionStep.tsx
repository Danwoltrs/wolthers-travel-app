import React, { useState } from 'react'
import { MapPin, Car, Plane, Ship, Navigation } from 'lucide-react'
import type { TripFormData } from './TripCreationModal'

interface StartingPointSelectionStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

interface StartingPointOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

const startingPointOptions: StartingPointOption[] = [
  {
    id: 'santos',
    name: 'Santos',
    description: 'Start with port/logistics operations and work inland',
    icon: <Ship className="w-6 h-6" />,
    color: 'bg-blue-500'
  },
  {
    id: 'cerrado',
    name: 'Cerrado Region',
    description: 'North to south routing through coffee-growing regions',
    icon: <Navigation className="w-6 h-6" />,
    color: 'bg-green-500'
  },
  {
    id: 'uberlandia',
    name: 'Uberlândia',
    description: 'Fly in, rent car, and explore surrounding regions',
    icon: <Plane className="w-6 h-6" />,
    color: 'bg-purple-500'
  },
  {
    id: 'sao_paulo',
    name: 'São Paulo',
    description: 'Metropolitan hub with easy access to multiple regions',
    icon: <Car className="w-6 h-6" />,
    color: 'bg-orange-500'
  }
]

export default function StartingPointSelectionStep({ formData, updateFormData }: StartingPointSelectionStepProps) {
  const [selectedStartingPoint, setSelectedStartingPoint] = useState<string>(
    formData.startingPoint || ''
  )
  const [customLocation, setCustomLocation] = useState<string>(
    formData.startingPoint && !startingPointOptions.some(opt => opt.id === formData.startingPoint) 
      ? formData.startingPoint 
      : ''
  )
  const [showCustomInput, setShowCustomInput] = useState<boolean>(
    formData.startingPoint === 'other' || 
    (formData.startingPoint && !startingPointOptions.some(opt => opt.id === formData.startingPoint))
  )

  const handleStartingPointSelect = (pointId: string) => {
    if (pointId === 'other') {
      setShowCustomInput(true)
      setSelectedStartingPoint('other')
      updateFormData({ startingPoint: customLocation || 'other' })
    } else {
      setShowCustomInput(false)
      setSelectedStartingPoint(pointId)
      setCustomLocation('')
      updateFormData({ startingPoint: pointId })
    }
  }

  const handleCustomLocationChange = (value: string) => {
    setCustomLocation(value)
    if (showCustomInput) {
      updateFormData({ startingPoint: value || 'other' })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-emerald-300 mb-2">
          Where are we starting the trip?
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose your departure point to optimize route planning and logistics
        </p>
      </div>

      {/* Starting Point Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {startingPointOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleStartingPointSelect(option.id)}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200 text-left
              hover:border-emerald-300 dark:hover:border-emerald-600
              hover:bg-emerald-50 dark:hover:bg-emerald-900/20
              ${selectedStartingPoint === option.id
                ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]'
              }
            `}
          >
            {/* Selection indicator */}
            {selectedStartingPoint === option.id && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <MapPin className="w-3 h-3 text-white" />
              </div>
            )}

            <div className="flex items-start space-x-4">
              {/* Icon */}
              <div className={`${option.color} p-3 rounded-lg text-white flex-shrink-0`}>
                {option.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-emerald-300 mb-1">
                  {option.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        ))}

        {/* Other/Custom Option */}
        <button
          type="button"
          onClick={() => handleStartingPointSelect('other')}
          className={`
            relative p-6 rounded-xl border-2 transition-all duration-200 text-left
            hover:border-emerald-300 dark:hover:border-emerald-600
            hover:bg-emerald-50 dark:hover:bg-emerald-900/20
            ${selectedStartingPoint === 'other' || showCustomInput
              ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
              : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]'
            }
          `}
        >
          {/* Selection indicator */}
          {(selectedStartingPoint === 'other' || showCustomInput) && (
            <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <MapPin className="w-3 h-3 text-white" />
            </div>
          )}

          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className="bg-gray-500 p-3 rounded-lg text-white flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-emerald-300 mb-1">
                Other Location
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Specify a custom starting point for your trip
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Custom Location Input */}
      {showCustomInput && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 p-6">
          <label htmlFor="customLocation" className="block text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
            Custom Starting Location
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <MapPin className="w-4 h-4 text-emerald-500" />
            </div>
            <input
              type="text"
              id="customLocation"
              value={customLocation}
              onChange={(e) => handleCustomLocationChange(e.target.value)}
              placeholder="Enter city, airport, or specific location..."
              className="w-full pl-10 pr-4 py-3 border border-emerald-300 dark:border-emerald-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-emerald-400 dark:placeholder-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            This will help optimize route planning and logistics for your trip
          </p>
        </div>
      )}

      {/* Selected Summary */}
      {(selectedStartingPoint && selectedStartingPoint !== 'other') && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border border-emerald-200 dark:border-emerald-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-lg text-white">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-emerald-900 dark:text-emerald-300">
                Starting from {startingPointOptions.find(opt => opt.id === selectedStartingPoint)?.name}
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Your trip will begin from this location and routes will be optimized accordingly
              </p>
            </div>
          </div>
        </div>
      )}

      {(showCustomInput && customLocation) && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border border-emerald-200 dark:border-emerald-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-lg text-white">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-emerald-900 dark:text-emerald-300">
                Starting from {customLocation}
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Your trip will begin from this location and routes will be optimized accordingly
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}