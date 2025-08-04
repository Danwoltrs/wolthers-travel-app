import type { Trip, ItineraryDay, Activity, TripStatus } from '@/types'

// Mock trip data for demonstration
export const mockTripData = [
  {
    id: '1',
    trip: {
      id: '1',
      title: 'Guatemala Origins Tour 2024',
      description: 'Comprehensive coffee origin tour visiting premium farms and processing facilities across Guatemala\'s prime coffee regions.',
      subject: 'Guatemala Coffee Origins Exploration',
      startDate: new Date('2024-08-05'),
      endDate: new Date('2024-08-09'),
      status: 'ongoing' as TripStatus,
      createdBy: 'admin',
      estimatedBudget: 15000,
      actualCost: 12500,
      tripCode: 'GT-2024-001',
      isConvention: false,
      metadata: {},
      createdAt: new Date('2024-07-01')
    } as Trip,
    itineraryDays: [
      {
        id: 'day-1',
        tripId: '1',
        date: new Date('2024-08-05'),
        notes: 'Arrival day - Airport pickup and hotel check-in',
        activities: [
          {
            id: 'act-1',
            itineraryDayId: 'day-1',
            time: '10:00',
            type: 'travel' as const,
            title: 'Airport Pickup',
            description: 'Meet clients at Guatemala City Airport',
            companyId: undefined,
            locationId: undefined,
            durationMinutes: 60,
            attendees: ['driver-1'],
            status: 'completed',
            confirmationStatus: 'confirmed',
            notes: 'Flight arrived on time',
            createdAt: new Date()
          },
          {
            id: 'act-2',
            itineraryDayId: 'day-1',
            time: '14:00',
            type: 'meal' as const,
            title: 'Welcome Lunch',
            description: 'Traditional Guatemalan cuisine introduction',
            companyId: undefined,
            locationId: undefined,
            durationMinutes: 120,
            attendees: ['guide-1', 'client-1', 'client-2'],
            status: 'completed',
            confirmationStatus: 'confirmed',
            notes: 'Great introduction to local flavors',
            createdAt: new Date()
          },
          {
            id: 'act-3',
            itineraryDayId: 'day-1',
            time: '19:00',
            type: 'hotel' as const,
            title: 'Hotel Check-in & Rest',
            description: 'Check into Casa Santo Domingo Hotel',
            companyId: undefined,
            locationId: undefined,
            durationMinutes: 60,
            attendees: ['client-1', 'client-2'],
            status: 'completed',
            confirmationStatus: 'confirmed',
            createdAt: new Date()
          }
        ],
        createdAt: new Date()
      },
      {
        id: 'day-2',
        tripId: '1',
        date: new Date('2024-08-06'),
        notes: 'Farm visits in Antigua region',
        activities: [
          {
            id: 'act-4',
            itineraryDayId: 'day-2',
            time: '08:00',
            type: 'travel' as const,
            title: 'Departure to Finca El Injerto',
            description: 'Travel to award-winning coffee farm',
            companyId: 'farm-1',
            locationId: 'location-1',
            durationMinutes: 90,
            attendees: ['driver-1', 'guide-1', 'client-1', 'client-2'],
            status: 'completed',
            confirmationStatus: 'confirmed',
            notes: 'Beautiful mountain scenery during drive',
            createdAt: new Date()
          },
          {
            id: 'act-5',
            itineraryDayId: 'day-2',
            time: '10:00',
            type: 'visit' as const,
            title: 'Finca El Injerto Farm Tour',
            description: 'Comprehensive tour of processing facilities and coffee fields',
            companyId: 'farm-1',
            locationId: 'location-1',
            durationMinutes: 180,
            attendees: ['farm-owner-1', 'guide-1', 'client-1', 'client-2'],
            status: 'completed',
            confirmationStatus: 'confirmed',
            notes: 'Exceptional Geisha variety samples',
            createdAt: new Date()
          },
          {
            id: 'act-6',
            itineraryDayId: 'day-2',
            time: '15:00',
            type: 'meeting' as const,
            title: 'Cupping Session & Quality Discussion',
            description: 'Professional cupping of farm\'s premium lots',
            companyId: 'farm-1',
            locationId: 'location-1',
            durationMinutes: 120,
            attendees: ['cupping-expert', 'client-1', 'client-2'],
            status: 'completed',
            confirmationStatus: 'confirmed',
            notes: 'Identified 3 potential contract lots',
            createdAt: new Date()
          }
        ],
        createdAt: new Date()
      },
      {
        id: 'day-3',
        tripId: '1',
        date: new Date('2024-08-07'),
        notes: 'Processing facilities and cooperative visits',
        activities: [
          {
            id: 'act-7',
            itineraryDayId: 'day-3',
            time: '09:00',
            type: 'visit' as const,
            title: 'Bella Vista Cooperative',
            description: 'Visit to farmers cooperative and wet mill',
            companyId: 'coop-1',
            locationId: 'location-2',
            durationMinutes: 150,
            attendees: ['coop-manager', 'guide-1', 'client-1', 'client-2'],
            status: 'in-progress',
            confirmationStatus: 'confirmed',
            notes: 'Learning about cooperative structure and member benefits',
            createdAt: new Date()
          },
          {
            id: 'act-8',
            itineraryDayId: 'day-3',
            time: '13:00',
            type: 'meal' as const,
            title: 'Lunch with Farmers',
            description: 'Traditional meal prepared by cooperative members',
            companyId: 'coop-1',
            locationId: 'location-2',
            durationMinutes: 90,
            attendees: ['farmers-group', 'client-1', 'client-2'],
            status: 'upcoming',
            confirmationStatus: 'confirmed',
            createdAt: new Date()
          },
          {
            id: 'act-9',
            itineraryDayId: 'day-3',
            time: '16:00',
            type: 'meeting' as const,
            title: 'Contract Negotiations',
            description: 'Discuss pricing and volume commitments',
            companyId: 'coop-1',
            locationId: 'location-2',
            durationMinutes: 120,
            attendees: ['coop-manager', 'client-1', 'client-2'],
            status: 'upcoming',
            confirmationStatus: 'pending',
            createdAt: new Date()
          }
        ],
        createdAt: new Date()
      },
      {
        id: 'day-4',
        tripId: '1',
        date: new Date('2024-08-08'),
        notes: 'Cultural experiences and final farm visits',
        activities: [
          {
            id: 'act-10',
            itineraryDayId: 'day-4',
            time: '08:30',
            type: 'visit' as const,
            title: 'Antigua Cultural Walk',
            description: 'Historical tour of Antigua Guatemala',
            companyId: undefined,
            locationId: 'location-3',
            durationMinutes: 120,
            attendees: ['cultural-guide', 'client-1', 'client-2'],
            status: 'upcoming',
            confirmationStatus: 'confirmed',
            createdAt: new Date()
          },
          {
            id: 'act-11',
            itineraryDayId: 'day-4',
            time: '14:00',
            type: 'visit' as const,
            title: 'La Azotea Coffee Museum',
            description: 'Coffee history and traditional processing methods',
            companyId: 'museum-1',
            locationId: 'location-4',
            durationMinutes: 90,
            attendees: ['museum-guide', 'client-1', 'client-2'],
            status: 'upcoming',
            confirmationStatus: 'confirmed',
            createdAt: new Date()
          },
          {
            id: 'act-12',
            itineraryDayId: 'day-4',
            time: '17:00',
            type: 'meal' as const,
            title: 'Farewell Dinner',
            description: 'Celebration dinner at Casa Santo Domingo',
            companyId: undefined,
            locationId: 'location-5',
            durationMinutes: 150,
            attendees: ['all-participants'],
            status: 'upcoming',
            confirmationStatus: 'confirmed',
            createdAt: new Date()
          }
        ],
        createdAt: new Date()
      },
      {
        id: 'day-5',
        tripId: '1',
        date: new Date('2024-08-09'),
        notes: 'Departure day',
        activities: [
          {
            id: 'act-13',
            itineraryDayId: 'day-5',
            time: '10:00',
            type: 'travel' as const,
            title: 'Airport Transfer',
            description: 'Transportation to Guatemala City Airport',
            companyId: undefined,
            locationId: undefined,
            durationMinutes: 90,
            attendees: ['driver-1', 'client-1', 'client-2'],
            status: 'upcoming',
            confirmationStatus: 'confirmed',
            createdAt: new Date()
          },
          {
            id: 'act-14',
            itineraryDayId: 'day-5',
            time: '14:30',
            type: 'travel' as const,
            title: 'Flight Departure',
            description: 'International departure',
            companyId: undefined,
            locationId: undefined,
            durationMinutes: 60,
            attendees: ['client-1', 'client-2'],
            status: 'upcoming',
            confirmationStatus: 'confirmed',
            createdAt: new Date()
          }
        ],
        createdAt: new Date()
      }
    ] as ItineraryDay[]
  }
]