// Enhanced types for Meetings & Agenda module API responses

export interface CompanyWithLocations {
  company_id: string
  company_name: string
  company_email: string | null
  company_phone: string | null
  location_count: number
  primary_location_id: string | null
  primary_location_name: string | null
  primary_location_address: string | null
}

export interface CompanyLocation {
  id: string
  company_id: string
  location_name: string
  address_line_1: string
  address_line_2: string | null
  city: string
  state_province: string | null
  postal_code: string | null
  country: string
  location_type: string
  is_primary_location: boolean
  is_meeting_location: boolean
  phone: string | null
  email: string | null
  contact_person: string | null
  meeting_room_capacity: number | null
  has_presentation_facilities: boolean
  has_catering: boolean
  parking_availability: string | null
  accessibility_notes: string | null
  latitude: number | null
  longitude: number | null
  notes: string | null
  full_address?: string
  has_meeting_facilities?: boolean
  suitable_for_presentations?: boolean
  suitable_for_catering?: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CompanyLocationResponse {
  location: CompanyLocation & {
    companies: {
      id: string
      name: string
      email: string | null
      phone: string | null
      website: string | null
    }
  }
}

export interface CompaniesWithLocationsResponse {
  companies: CompanyWithLocations[]
  total: number
}

export interface CompanyLocationsResponse {
  company: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  locations: CompanyLocation[]
  total: number
  total_all_locations: number
}

// Cost tracking types
export interface CostBreakdownByParticipant {
  [participantId: string]: {
    name: string
    type: 'wolthers_staff' | 'client' | 'external'
    meals?: number
    transport?: number
    entertainment?: number
    materials?: number
    accommodation?: number
    other?: number
  }
}

export interface CostBreakdownMetadata {
  event_type: string
  currency: string
  notes?: string
  calculation_timestamp: string
  calculated_by: string
  category_totals: {
    meals: number
    transport: number
    entertainment: number
    materials: number
    accommodation: number
    other: number
  }
  participant_count: number
  average_per_participant: number
}

export interface CostCalculationRequest {
  eventType: 'flight' | 'hotel' | 'meeting' | 'business_meeting' | 'presentation' | 'lunch' | 'dinner'
  participants: Array<{
    id: string
    name: string
    type: 'wolthers_staff' | 'client' | 'external'
  }>
  costBreakdown: {
    [participantId: string]: {
      meals?: number
      transport?: number
      entertainment?: number
      materials?: number
      accommodation?: number
      other?: number
    }
  }
  currency?: string
  notes?: string
}

export interface CostCalculationResponse {
  success: boolean
  calculation: {
    totalCost: number
    currency: string
    participantBreakdown: {
      [participantId: string]: {
        participantName: string
        participantType: string
        totalCost: number
        breakdown: {
          meals: number
          transport: number
          entertainment: number
          materials: number
          accommodation: number
          other: number
        }
      }
    }
    costByCategory: {
      meals: number
      transport: number
      entertainment: number
      materials: number
      accommodation: number
      other: number
    }
    participantCount: number
    averageCostPerParticipant: number
  }
  formattedForDatabase: {
    cost_per_person: CostBreakdownByParticipant
    cost_breakdown: CostBreakdownMetadata
    total_estimated_cost: number
    cost_currency: string
  }
}

// Enhanced CalendarEvent interface with cost tracking and company association
export interface EnhancedCalendarEvent {
  id?: string
  type: 'flight' | 'hotel' | 'meeting' | 'business_meeting' | 'presentation' | 'lunch' | 'dinner'
  title: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  description?: string

  // Cost tracking
  costPerPerson?: CostBreakdownByParticipant
  costBreakdown?: CostBreakdownMetadata
  costCurrency?: string
  totalEstimatedCost?: number

  // Company location integration
  companyLocationId?: string
  companyLocation?: CompanyLocation

  // Flight specific
  flightData?: {
    airline: string
    flightNumber: string
    departure: {
      airport: string
      city: string
      date: string
      time: string
    }
    arrival: {
      airport: string
      city: string
      date: string
      time: string
    }
    passengerNames: string[]
    bookingStatus?: string
  }

  // Hotel specific
  hotelData?: {
    hotelName: string
    hotelAddress: string
    checkInDate: string
    checkOutDate: string
    roomType?: string
    guestNames: string[]
    bookingStatus?: string
  }

  // Meeting specific
  attendees?: Array<{
    name: string
    email?: string
    company?: string
    title?: string
    phone?: string
    isExternal?: boolean
  }>
  agenda?: string
  priority?: 'low' | 'medium' | 'high'
  isSupplierMeeting?: boolean
  supplierCompany?: string
  meetingStatus?: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
}

// Bulk operations
export interface BulkCalendarEventRequest {
  operation: 'create' | 'update' | 'delete'
  tripId: string
  events: EnhancedCalendarEvent[]
}

export interface BulkCalendarEventResponse {
  success: boolean
  operation: string
  results: {
    processed: number
    successful: number
    failed: number
    details: Array<{
      eventIndex: number
      eventId?: string
      success: boolean
      error?: string
    }>
  }
  tripId: string
}

// API Error responses
export interface APIError {
  error: string
  details?: string
  stack?: string
  timestamp: string
  context?: {
    hasUser: boolean
    hasAuthHeader: boolean
    requestUrl: string
    bodyReceived: boolean
  }
}