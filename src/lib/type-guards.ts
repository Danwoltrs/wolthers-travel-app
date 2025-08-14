/**
 * Type guard utilities for enhanced calendar events and cost tracking
 * Provides runtime type checking for improved type safety
 */

import { 
  CalendarEvent, 
  CostTracking, 
  CompanyAssociation, 
  CompanyLocationDetails,
  CostBreakdownItem
} from '@/types'

/**
 * Type guard to check if an event has cost tracking
 */
export function hasEventCostTracking(event: CalendarEvent): event is CalendarEvent & { costTracking: CostTracking } {
  return event.costTracking !== undefined && event.costTracking !== null
}

/**
 * Type guard to check if cost tracking has per-person costs
 */
export function hasCostPerPerson(costTracking: CostTracking): costTracking is CostTracking & { costPerPerson: number } {
  return costTracking.costPerPerson !== undefined && costTracking.costPerPerson !== null
}

/**
 * Type guard to check if cost tracking has total cost
 */
export function hasTotalCost(costTracking: CostTracking): costTracking is CostTracking & { totalCost: number } {
  return costTracking.totalCost !== undefined && costTracking.totalCost !== null
}

/**
 * Type guard to check if cost tracking has detailed breakdown
 */
export function hasCostBreakdown(costTracking: CostTracking): costTracking is CostTracking & { costBreakdown: CostBreakdownItem[] } {
  return Array.isArray(costTracking.costBreakdown) && costTracking.costBreakdown.length > 0
}

/**
 * Type guard to check if an event has company association
 */
export function hasCompanyAssociation(event: CalendarEvent): event is CalendarEvent & { companyAssociation: CompanyAssociation } {
  return event.companyAssociation !== undefined && event.companyAssociation !== null
}

/**
 * Type guard to check if company association has location details
 */
export function hasLocationDetails(association: CompanyAssociation): association is CompanyAssociation & { locationDetails: CompanyLocationDetails } {
  return association.locationDetails !== undefined && association.locationDetails !== null
}

/**
 * Type guard to check if an event is a flight event
 */
export function isFlightEvent(event: CalendarEvent): event is CalendarEvent & { 
  type: 'flight'
  airline?: string
  flightNumber?: string
  departure?: { airport: string; city: string }
  arrival?: { airport: string; city: string }
} {
  return event.type === 'flight'
}

/**
 * Type guard to check if an event is a hotel event
 */
export function isHotelEvent(event: CalendarEvent): event is CalendarEvent & { 
  type: 'hotel'
  hotelName?: string
  hotelAddress?: string
  checkIn?: string
  checkOut?: string
} {
  return event.type === 'hotel'
}

/**
 * Type guard to check if an event is a meeting event
 */
export function isMeetingEvent(event: CalendarEvent): boolean {
  return ['meeting', 'conference_session', 'networking', 'presentation'].includes(event.type)
}

/**
 * Type guard to check if an event is a meal event
 */
export function isMealEvent(event: CalendarEvent): boolean {
  return ['lunch', 'dinner'].includes(event.type)
}

/**
 * Type guard to check if an event has enhanced attendee details
 */
export function hasAttendeeDetails(event: CalendarEvent): event is CalendarEvent & {
  attendeeDetails: {
    userId?: string
    name: string
    role?: string
    company?: string
    confirmationStatus?: 'pending' | 'confirmed' | 'declined'
  }[]
} {
  return Array.isArray(event.attendeeDetails) && event.attendeeDetails.length > 0
}

/**
 * Type guard to check if an event requires company association
 */
export function requiresCompanyAssociation(event: CalendarEvent): boolean {
  return isMeetingEvent(event) || event.type === 'networking'
}

/**
 * Type guard to check if an event supports cost tracking
 */
export function supportsCostTracking(event: CalendarEvent): boolean {
  return !isMeetingEvent(event) || event.type === 'conference_session'
}

/**
 * Type guard to validate cost breakdown item structure
 */
export function isValidCostBreakdownItem(item: any): item is CostBreakdownItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.description === 'string' &&
    typeof item.amount === 'number' &&
    typeof item.currency === 'string' &&
    (item.quantity === undefined || typeof item.quantity === 'number') &&
    (item.assignedTo === undefined || typeof item.assignedTo === 'string') &&
    (item.notes === undefined || typeof item.notes === 'string')
  )
}

/**
 * Type guard to validate company location details structure
 */
export function isValidCompanyLocationDetails(details: any): details is CompanyLocationDetails {
  return (
    typeof details === 'object' &&
    details !== null &&
    typeof details.name === 'string' &&
    (details.addressLine1 === undefined || typeof details.addressLine1 === 'string') &&
    (details.city === undefined || typeof details.city === 'string') &&
    (details.country === undefined || typeof details.country === 'string') &&
    (details.phone === undefined || typeof details.phone === 'string') &&
    (details.email === undefined || typeof details.email === 'string')
  )
}

/**
 * Type guard to check if event has coordinates for mapping
 */
export function hasEventCoordinates(event: CalendarEvent): boolean {
  if (hasCompanyAssociation(event) && hasLocationDetails(event.companyAssociation)) {
    return !!(event.companyAssociation.locationDetails.coordinates?.lat && 
              event.companyAssociation.locationDetails.coordinates?.lng)
  }
  return false
}

/**
 * Type guard to check if event has address information
 */
export function hasEventAddress(event: CalendarEvent): boolean {
  // Check legacy location field
  if (event.location && event.location.trim() !== '') {
    return true
  }
  
  // Check hotel address
  if (isHotelEvent(event) && event.hotelAddress && event.hotelAddress.trim() !== '') {
    return true
  }
  
  // Check company location details
  if (hasCompanyAssociation(event) && hasLocationDetails(event.companyAssociation)) {
    const details = event.companyAssociation.locationDetails
    return !!(details.addressLine1 || details.city || details.country)
  }
  
  return false
}

/**
 * Helper function to get event type display information
 */
export function getEventTypeInfo(eventType: CalendarEvent['type']): { 
  label: string
  supportsCost: boolean
  requiresCompany: boolean
  requiresLocation: boolean
} {
  const typeInfo = {
    flight: { label: 'Flight', supportsCost: true, requiresCompany: false, requiresLocation: false },
    hotel: { label: 'Hotel', supportsCost: true, requiresCompany: false, requiresLocation: true },
    meeting: { label: 'Business Meeting', supportsCost: false, requiresCompany: true, requiresLocation: true },
    lunch: { label: 'Lunch', supportsCost: true, requiresCompany: false, requiresLocation: true },
    dinner: { label: 'Dinner', supportsCost: true, requiresCompany: false, requiresLocation: true },
    conference_session: { label: 'Conference Session', supportsCost: true, requiresCompany: false, requiresLocation: true },
    networking: { label: 'Networking', supportsCost: true, requiresCompany: true, requiresLocation: true },
    presentation: { label: 'Presentation', supportsCost: false, requiresCompany: true, requiresLocation: true },
    other: { label: 'Other', supportsCost: true, requiresCompany: false, requiresLocation: false }
  }
  
  return typeInfo[eventType] || typeInfo.other
}