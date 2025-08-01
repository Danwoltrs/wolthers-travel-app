'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import TripCard from '@/components/dashboard/TripCard'
import QuickViewModal from '@/components/dashboard/QuickViewModal'
import type { TripCard as TripCardType, Company, User, Vehicle } from '@/types'
import { UserRole, VehicleStatus } from '@/types'
import { getTripStatus, getTripProgress, calculateDuration, cn } from '@/lib/utils'

// Mock data - will be replaced with API calls
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Mitsui & Co Ltd',
    fantasyName: 'Mitsui',
    email: 'contact@mitsui.com',
    industry: 'Coffee Trading',
    totalTripCostsThisYear: 15000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Swiss Coffee Trading AG',
    fantasyName: 'Swiss Coffee Trading',
    email: 'info@swisscoffee.ch',
    industry: 'Coffee Trading',
    totalTripCostsThisYear: 25000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Guatemalan Highland Farms',
    fantasyName: 'Highland Farms',
    email: 'hello@highlandfarms.gt',
    industry: 'Coffee Production',
    totalTripCostsThisYear: 8500,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Colombian Coffee Exporters',
    fantasyName: 'CCE',
    email: 'exports@cce.co',
    industry: 'Coffee Export',
    totalTripCostsThisYear: 12000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Sucafina SA',
    fantasyName: 'S&D',
    email: 'info@sucafina.com',
    industry: 'Coffee Trading',
    totalTripCostsThisYear: 18000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockUsers: User[] = [
  {
    id: '1',
    email: 'erik.wolthers@wolthers.com',
    fullName: 'Erik Wolthers',
    role: UserRole.WOLTHERS_STAFF,
    permissions: {},
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '2',
    email: 'maria.santos@wolthers.com',
    fullName: 'Maria Santos',
    role: UserRole.WOLTHERS_STAFF,
    permissions: {},
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '3',
    email: 'carlos.mendez@wolthers.com',
    fullName: 'Carlos Mendez',
    role: UserRole.DRIVER,
    permissions: {},
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '4',
    email: 'anna.larsen@wolthers.com',
    fullName: 'Anna Larsen',
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
    licensePlate: 'WOL-001',
    currentMileage: 25000,
    status: VehicleStatus.ACTIVE,
    createdAt: new Date()
  },
  {
    id: '2',
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2023,
    color: 'Silver',
    licensePlate: 'WOL-002',
    currentMileage: 15000,
    status: VehicleStatus.ACTIVE,
    createdAt: new Date()
  },
  {
    id: '3',
    make: 'Ford',
    model: 'Transit',
    year: 2021,
    color: 'Blue',
    licensePlate: 'WOL-003',
    currentMileage: 45000,
    status: VehicleStatus.ACTIVE,
    createdAt: new Date()
  }
]

const mockTrips: TripCardType[] = [
  // 2 ONGOING TRIPS with different progress levels
  {
    id: '1',
    title: 'Brazil Coffee Farm Tour',
    subject: 'Strategic visit to Minas Gerais coffee farms to establish direct trade relationships and assess quality standards for premium coffee sourcing',
    client: [mockCompanies[0], mockCompanies[4]],
    guests: [
      { companyId: '1', names: ['Nakaya', 'Kurobe', 'Okada'] },
      { companyId: '5', names: ['Ada', 'Martinez'] }
    ],
    wolthersStaff: [mockUsers[0], mockUsers[3]],
    vehicles: [mockVehicles[0], mockVehicles[1]],
    drivers: [mockUsers[2]],
    startDate: new Date('2025-07-29'),
    endDate: new Date('2025-08-04'),
    duration: calculateDuration('2025-07-29', '2025-08-04'),
    status: 'ongoing',
    progress: 75,
    notesCount: 8
  },
  {
    id: '2',
    title: 'European Coffee Summit',
    subject: 'Multi-day European Coffee Summit in Copenhagen focusing on sustainability, innovation, and market trends in the Nordic coffee scene',
    client: [mockCompanies[1], mockCompanies[3]],
    guests: [
      { companyId: '2', names: ['Mueller', 'Hansen'] },
      { companyId: '4', names: ['Rodriguez', 'Silva'] }
    ],
    wolthersStaff: [mockUsers[0], mockUsers[1]],
    vehicles: [],
    drivers: [],
    startDate: new Date('2025-07-30'),
    endDate: new Date('2025-08-05'),
    duration: calculateDuration('2025-07-30', '2025-08-05'),
    status: 'ongoing',
    progress: 35,
    notesCount: 3
  },
  
  // 3 UPCOMING TRIPS (closest dates first)
  {
    id: '3',
    title: 'Colombia Coffee Expo',
    subject: 'Colombian Coffee Expo and Trade Show in Bogotá featuring new processing techniques and sustainable farming practices',
    client: [mockCompanies[3]],
    guests: [
      { companyId: '4', names: ['Garcia', 'Lopez', 'Morales'] }
    ],
    wolthersStaff: [mockUsers[1], mockUsers[3]],
    vehicles: [mockVehicles[1]],
    drivers: [mockUsers[2]],
    startDate: new Date('2025-08-08'),
    endDate: new Date('2025-08-12'),
    duration: calculateDuration('2025-08-08', '2025-08-12'),
    status: 'upcoming',
    progress: 0,
    notesCount: 12
  },
  {
    id: '4',
    title: 'Guatemala Highland Visit',
    subject: 'Comprehensive assessment of highland coffee farms in Antigua region focusing on specialty grade arabica cultivation and processing methods',
    client: [mockCompanies[2]],
    guests: [
      { companyId: '3', names: ['Hernandez', 'Castillo'] }
    ],
    wolthersStaff: [mockUsers[0], mockUsers[1], mockUsers[3]],
    vehicles: [mockVehicles[0], mockVehicles[2]],
    drivers: [mockUsers[2]],
    startDate: new Date('2025-08-18'),
    endDate: new Date('2025-08-22'),
    duration: calculateDuration('2025-08-18', '2025-08-22'),
    status: 'upcoming',
    progress: 0,
    notesCount: 0
  },
  {
    id: '5',
    title: 'NCA Convention 2025',
    subject: 'Annual National Coffee Association Convention in New Orleans featuring keynote speakers and networking opportunities with leading coffee industry professionals',
    client: [mockCompanies[0], mockCompanies[1]],
    guests: [
      { companyId: '1', names: ['Tanaka', 'Sato'] },
      { companyId: '2', names: ['Weber'] }
    ],
    wolthersStaff: [mockUsers[0], mockUsers[1]],
    vehicles: [mockVehicles[0]],
    drivers: [mockUsers[2]],
    startDate: new Date('2025-09-15'),
    endDate: new Date('2025-09-20'),
    duration: calculateDuration('2025-09-15', '2025-09-20'),
    status: 'upcoming',
    progress: 0,
    notesCount: 2
  },

  // PAST TRIPS (completed - will go to Past Trips section)
  {
    id: '6',
    title: 'Swiss Coffee Dinner 2025',
    subject: 'Annual Swiss Coffee Association formal dinner and awards ceremony celebrating excellence in Swiss coffee culture and trading',
    client: [mockCompanies[1]],
    guests: [
      { companyId: '2', names: ['Schmidt', 'Braun'] }
    ],
    wolthersStaff: [mockUsers[0]],
    vehicles: [],
    drivers: [],
    startDate: new Date('2025-06-10'),
    endDate: new Date('2025-06-12'),
    duration: calculateDuration('2025-06-10', '2025-06-12'),
    status: 'completed',
    progress: 100
  },
  {
    id: '7',
    title: 'Kenya Coffee Origin Tour',
    subject: 'Educational tour of Kenyan coffee cooperatives and processing stations to understand African coffee cultivation methods',
    client: [mockCompanies[0], mockCompanies[2]],
    guests: [
      { companyId: '1', names: ['Yamamoto'] },
      { companyId: '3', names: ['Mendez', 'Ramirez'] }
    ],
    wolthersStaff: [mockUsers[1], mockUsers[3]],
    vehicles: [mockVehicles[1]],
    drivers: [mockUsers[2]],
    startDate: new Date('2025-05-05'),
    endDate: new Date('2025-05-10'),
    duration: calculateDuration('2025-05-05', '2025-05-10'),
    status: 'completed',
    progress: 100
  },
  {
    id: '8',
    title: 'Vietnam Coffee Industry Summit',
    subject: 'Vietnamese coffee industry summit focusing on robusta quality improvement and sustainable farming practices',
    client: [mockCompanies[3]],
    guests: [
      { companyId: '4', names: ['Nguyen', 'Tran'] }
    ],
    wolthersStaff: [mockUsers[0], mockUsers[1]],
    vehicles: [],
    drivers: [],
    startDate: new Date('2025-04-20'),
    endDate: new Date('2025-04-24'),
    duration: calculateDuration('2025-04-20', '2025-04-24'),
    status: 'completed',
    progress: 100
  }
]

export default function Dashboard() {
  const [selectedTrip, setSelectedTrip] = useState<TripCardType | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Listen for menu state changes (this would need to be coordinated with Header component)
  React.useEffect(() => {
    const handleMenuToggle = (event: CustomEvent) => {
      setIsMenuOpen(event.detail.isOpen)
    }
    
    window.addEventListener('menuToggle', handleMenuToggle as EventListener)
    return () => window.removeEventListener('menuToggle', handleMenuToggle as EventListener)
  }, [])
  
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
    <div className="min-h-screen bg-beige-100 dark:bg-[#212121] pt-40 xl:pt-40 pb-8 transition-colors duration-300">
      {/* Fixed Add Trip Button fine-tuned positioning */}
      <div className="fixed left-[calc(max(2rem,(100vw-80rem)/2)+2rem+30px)] top-[calc(160px+72px+24px+2px)] z-40 hidden xl:block">
        <div
          onClick={handleCreateTrip}
          className="bg-white dark:bg-[#123d32] rounded-lg shadow-lg hover:shadow-xl border-2 border-dashed border-gray-300 dark:border-[#123d32] hover:border-golden-400 dark:hover:border-golden-400 hover:bg-golden-50 dark:hover:bg-[#0E3D2F] transition-all duration-300 cursor-pointer flex items-center justify-center group transform hover:-translate-y-1 hover:scale-105 w-[60px] h-[420px]"
        >
          <Plus className="w-8 h-8 text-gray-400 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300 transition-colors" />
        </div>
      </div>

      {/* Mobile Fixed Add Trip Button */}
      <div className={cn(
        "fixed left-0 right-0 z-50 px-10 sm:px-12 md:px-20 lg:px-20 xl:hidden transition-all duration-300",
        isMenuOpen ? "top-[520px]" : "top-[125px]"
      )}>
        <div
          onClick={handleCreateTrip}
          className="bg-white dark:bg-[#123d32] rounded-lg shadow-lg hover:shadow-xl border-2 border-dashed border-gray-300 dark:border-[#123d32] hover:border-golden-400 dark:hover:border-golden-400 hover:bg-golden-50 dark:hover:bg-[#0E3D2F] transition-all duration-300 cursor-pointer flex items-center justify-center group transform hover:-translate-y-1 w-full h-[50px]"
        >
          <Plus className="w-6 h-6 text-gray-400 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300 transition-colors" />
          <span className="ml-2 text-sm font-medium text-gray-600 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300">Add New Trip</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 xl:pt-0">

        {/* Current & Upcoming Trips */}
        <div className="mb-12">
          {/* Section Header with Color-Coded Lane */}
          <div className="section-lane-current mb-6">
            <h2 className="text-xl font-semibold text-golden-800 dark:text-amber-200">
              Current & Upcoming Trips
            </h2>
            <p className="text-sm text-golden-700 dark:text-amber-300 mt-1">
              Active and scheduled travel itineraries
            </p>
          </div>

          {currentTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-x-6 md:gap-y-6 lg:gap-x-6 lg:gap-y-6 xl:gap-8 justify-items-center xl:justify-items-stretch justify-center xl:justify-start place-items-center xl:place-items-stretch md:max-w-3xl lg:max-w-3xl xl:max-w-none md:mx-auto lg:mx-auto xl:mx-0 [&>*:nth-child(odd):last-child]:md:col-span-2 [&>*:nth-child(odd):last-child]:lg:col-span-2 [&>*:nth-child(odd):last-child]:xl:col-span-1 [&>*:nth-child(odd):last-child]:md:justify-self-center [&>*:nth-child(odd):last-child]:lg:justify-self-center [&>*:nth-child(odd):last-child]:xl:justify-self-stretch">
              {currentTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleTripClick(trip)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-green-400">
              <p>No current or upcoming trips</p>
              <p className="text-sm mt-1">Click the "+" button to create your first trip</p>
            </div>
          )}
        </div>

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <div>
            {/* Section Header with Color-Coded Lane */}
            <div className="section-lane-past mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-green-200">
                Past Trips
              </h2>
              <p className="text-sm text-gray-600 dark:text-green-400 mt-1">
                Completed travel itineraries and archived trips
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-x-6 md:gap-y-6 lg:gap-x-6 lg:gap-y-6 xl:gap-8 justify-items-center xl:justify-items-stretch justify-center xl:justify-start place-items-center xl:place-items-stretch md:max-w-3xl lg:max-w-3xl xl:max-w-none md:mx-auto lg:mx-auto xl:mx-0 [&>*:nth-child(odd):last-child]:md:col-span-2 [&>*:nth-child(odd):last-child]:lg:col-span-2 [&>*:nth-child(odd):last-child]:xl:col-span-1 [&>*:nth-child(odd):last-child]:md:justify-self-center [&>*:nth-child(odd):last-child]:lg:justify-self-center [&>*:nth-child(odd):last-child]:xl:justify-self-stretch">
              {pastTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleTripClick(trip)}
                  isPast={true}
                />
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