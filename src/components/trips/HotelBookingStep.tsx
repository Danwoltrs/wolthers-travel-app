import React, { useState } from 'react'
import { TripFormData } from './TripCreationModal'
import { Hotel, Plus, Trash2, MapPin, Calendar, DollarSign } from 'lucide-react'

interface Hotel {
  id: string
  name: string
  address: string
  checkInDate: string
  checkOutDate: string
  nights: number
  cost?: number
  notes?: string
}

interface HotelBookingStepProps {
  formData: TripFormData & { hotels?: Hotel[] }
  updateFormData: (data: Partial<TripFormData & { hotels?: Hotel[] }>) => void
}

export default function HotelBookingStep({ formData, updateFormData }: HotelBookingStepProps) {
  const [hotels, setHotels] = useState<Hotel[]>(formData.hotels || [])

  // Calculate nights between check-in and check-out dates
  const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 1
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return Math.max(1, daysDiff)
  }

  // Add a new hotel booking
  const addHotel = () => {
    const newHotel: Hotel = {
      id: `hotel_${Date.now()}`,
      name: '',
      address: '',
      checkInDate: formData.startDate?.toISOString().split('T')[0] || '',
      checkOutDate: formData.endDate?.toISOString().split('T')[0] || '',
      nights: 1,
      cost: undefined,
      notes: ''
    }
    
    // Recalculate nights for the new hotel
    if (newHotel.checkInDate && newHotel.checkOutDate) {
      newHotel.nights = calculateNights(newHotel.checkInDate, newHotel.checkOutDate)
    }

    const updatedHotels = [...hotels, newHotel]
    setHotels(updatedHotels)
    updateFormData({ hotels: updatedHotels })
  }

  // Update hotel information
  const updateHotel = (hotelId: string, updates: Partial<Hotel>) => {
    const updatedHotels = hotels.map(hotel => {
      if (hotel.id === hotelId) {
        const updatedHotel = { ...hotel, ...updates }
        
        // Recalculate nights if dates changed
        if (updates.checkInDate || updates.checkOutDate) {
          updatedHotel.nights = calculateNights(
            updatedHotel.checkInDate, 
            updatedHotel.checkOutDate
          )
        }
        
        return updatedHotel
      }
      return hotel
    })
    
    setHotels(updatedHotels)
    updateFormData({ hotels: updatedHotels })
  }

  // Remove a hotel booking
  const removeHotel = (hotelId: string) => {
    const updatedHotels = hotels.filter(hotel => hotel.id !== hotelId)
    setHotels(updatedHotels)
    updateFormData({ hotels: updatedHotels })
  }

  const totalCost = hotels.reduce((sum, hotel) => sum + (hotel.cost || 0), 0)
  const totalNights = hotels.reduce((sum, hotel) => sum + hotel.nights, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <Hotel className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
          Hotels & Accommodation
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Book hotels and manage accommodation arrangements for your conference trip.
        </p>

        {/* Summary Stats */}
        {hotels.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center">
                <Hotel className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Hotels Booked</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{hotels.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Total Nights</p>
                  <p className="text-lg font-bold text-purple-900 dark:text-purple-300">{totalNights}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">Total Cost</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-300">
                    {totalCost > 0 ? `$${totalCost.toLocaleString()}` : 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hotel List */}
        <div className="space-y-4">
          {hotels.map((hotel, index) => (
            <div key={hotel.id} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                  Hotel {index + 1}
                </h3>
                {hotels.length > 1 && (
                  <button
                    onClick={() => removeHotel(hotel.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hotel Name *
                  </label>
                  <input
                    type="text"
                    value={hotel.name}
                    onChange={(e) => updateHotel(hotel.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    placeholder="e.g., Marriott Hotel Zurich"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Address *
                  </label>
                  <input
                    type="text"
                    value={hotel.address}
                    onChange={(e) => updateHotel(hotel.id, { address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    placeholder="e.g., Neumühlequai 42, 8006 Zürich, Switzerland"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    value={hotel.checkInDate}
                    onChange={(e) => updateHotel(hotel.id, { checkInDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    min={formData.startDate?.toISOString().split('T')[0]}
                    max={formData.endDate?.toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    value={hotel.checkOutDate}
                    onChange={(e) => updateHotel(hotel.id, { checkOutDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    min={hotel.checkInDate || formData.startDate?.toISOString().split('T')[0]}
                    max={formData.endDate?.toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nights
                  </label>
                  <div className="flex items-center px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-gray-50 dark:bg-[#2a2a2a]">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-white">{hotel.nights}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cost (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={hotel.cost || ''}
                      onChange={(e) => updateHotel(hotel.id, { cost: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={hotel.notes || ''}
                    onChange={(e) => updateHotel(hotel.id, { notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    placeholder="e.g., Room preferences, special requests, booking reference..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Hotel Button */}
          <button
            onClick={addHotel}
            className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-400 dark:hover:border-green-500 transition-colors group"
          >
            <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400">
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-medium">Add Hotel Booking</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}