'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import TripCard from '@/components/dashboard/TripCard'
import QuickViewModal from '@/components/dashboard/QuickViewModal'
import type { TripCard as TripCardType, Company, User, Vehicle } from '@/types'
import { UserRole, VehicleStatus } from '@/types'
import { getTripStatus, getTripProgress, calculateDuration } from '@/lib/utils'

// Mock data - will be replaced with API calls
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Cooxupe Coffee Cooperative',
    fantasyName: 'Cooxupe',
    email: 'contact@cooxupe.com.br',
    industry: 'coffee',
    totalTripCostsThisYear: 15000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Swiss Coffee Trading AG',
    fantasyName: 'Swiss Coffee',
    email: 'info@swisscoffee.ch',
    industry: 'coffee',
    totalTripCostsThisYear: 25000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@wolthers.com',
    fullName: 'John Doe',
    role: UserRole.WOLTHERS_STAFF,
    permissions: {},
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '2',
    email: 'jane.smith@wolthers.com',
    fullName: 'Jane Smith',
    role: UserRole.WOLTHERS_STAFF,
    permissions: {},
    isActive: true,
    createdAt: new Date()
  }
]

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Land Cruiser',
    year: 2022,
    color: 'White',
    licensePlate: 'ABC-1234',
    currentMileage: 25000,
    status: VehicleStatus.ACTIVE,
    createdAt: new Date()
  }
]

const mockTrips: TripCardType[] = [
  {
    id: '1',
    title: 'NCA Convention 2025',
    subject: 'Annual National Coffee Association Convention',
    client: [mockCompanies[0], mockCompanies[1]],
    wolthersStaff: mockUsers,
    vehicles: mockVehicles,
    drivers: [mockUsers[0]],
    startDate: new Date('2025-03-15'),
    endDate: new Date('2025-03-20'),
    duration: 5,
    status: 'upcoming',
    progress: 0
  },
  {
    id: '2',
    title: 'Brazil Coffee Farm Tour',
    subject: 'Visit to Minas Gerais coffee farms',
    client: [mockCompanies[0]],
    wolthersStaff: [mockUsers[0]],
    vehicles: mockVehicles,
    drivers: [mockUsers[1]],
    startDate: new Date('2025-01-20'),
    endDate: new Date('2025-01-25'),
    duration: 5,
    status: 'ongoing',
    progress: 60
  },
  {
    id: '3',
    title: 'Swiss Coffee Dinner 2024',
    subject: 'Annual Swiss Coffee Association Dinner',
    client: [mockCompanies[1]],
    wolthersStaff: mockUsers,
    vehicles: [],
    drivers: [],
    startDate: new Date('2024-12-10'),
    endDate: new Date('2024-12-12'),
    duration: 2,
    status: 'completed',
    progress: 100
  },
  {
    id: '4',
    title: 'Colombia Coffee Expo',
    subject: 'Colombian Coffee Expo and Trade Show',
    client: [mockCompanies[0]],
    wolthersStaff: [mockUsers[1]],
    vehicles: mockVehicles,
    drivers: [mockUsers[0]],
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-02-05'),
    duration: 5,
    status: 'upcoming',
    progress: 0
  },
  {
    id: '5',
    title: 'Guatemala Highland Visit',
    subject: 'Visiting highland coffee farms in Guatemala',
    client: [mockCompanies[1]],
    wolthersStaff: mockUsers,
    vehicles: mockVehicles,
    drivers: [mockUsers[1]],
    startDate: new Date('2025-01-28'),
    endDate: new Date('2025-01-30'),
    duration: 3,
    status: 'ongoing',
    progress: 30
  }
]

export default function Dashboard() {
  const [selectedTrip, setSelectedTrip] = useState<TripCardType | null>(null)
  
  // Separate and sort trips by status
  const ongoingTrips = mockTrips.filter(trip => trip.status === 'ongoing')
  const upcomingTrips = mockTrips
    .filter(trip => trip.status === 'upcoming')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) // Sort by closest date first
  
  // Combine ongoing (first) and upcoming (sorted by date) trips
  const currentTrips = [...ongoingTrips, ...upcomingTrips]
  const pastTrips = mockTrips.filter(trip => trip.status === 'completed')

  const handleTripClick = (trip: TripCardType) => {
    setSelectedTrip(trip)
  }

  const handleCreateTrip = () => {
    window.location.href = '/trips/new'
  }

  const closeModal = () => {
    setSelectedTrip(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Current & Upcoming Trips */}
        <div className="mb-12">
          {/* Section Header with Color-Coded Lane */}
          <div className="section-lane-current mb-6">
            <h2 className="text-xl font-semibold text-blue-900">
              Current & Upcoming Trips
            </h2>
            <p className="text-sm text-blue-700 mt-1">
              Active and scheduled travel itineraries
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Add Trip Button - Positioned Outside Grid */}
            <div className="flex-shrink-0 lg:sticky lg:top-8">
              <div
                onClick={handleCreateTrip}
                className="bg-white rounded-lg shadow-md hover:shadow-lg border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all duration-300 cursor-pointer flex items-center justify-center group transform hover:-translate-y-1 lg:flex-col lg:h-[420px] w-full lg:w-[60px] h-[60px]"
              >
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-amber-600 transition-colors lg:mb-2" />
                <span className="text-xs text-gray-500 group-hover:text-amber-600 font-medium ml-2 lg:ml-0 lg:writing-mode-vertical lg:transform lg:rotate-180">
                  Add Trip
                </span>
              </div>
            </div>

            {/* Trip Cards Grid */}
            <div className="flex-1 w-full">
              {currentTrips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {currentTrips.map((trip) => (
                    <div key={trip.id} className="min-w-0">
                      <TripCard
                        trip={trip}
                        onClick={() => handleTripClick(trip)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No current or upcoming trips</p>
                  <p className="text-sm mt-1">Click the "Add Trip" button to create your first trip</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <div>
            {/* Section Header with Color-Coded Lane */}
            <div className="section-lane-past mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Past Trips
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Completed travel itineraries and archived trips
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {pastTrips.map((trip) => (
                <div key={trip.id} className="min-w-0">
                  <TripCard
                    trip={trip}
                    onClick={() => handleTripClick(trip)}
                    isPast={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick View Modal */}
        {selectedTrip && (
          <QuickViewModal
            trip={selectedTrip}
            isOpen={!!selectedTrip}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  )
}