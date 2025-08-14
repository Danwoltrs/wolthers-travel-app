/**
 * Calendar Events Service
 * Type-safe service for managing enhanced calendar events with cost tracking and company integration
 */

import { 
  CalendarEvent, 
  CostCalculationRequest, 
  CostCalculationResponse,
  CompanyWithLocations,
  ProgressiveSaveRequest,
  ProgressiveSaveResponse
} from '@/types'

import {
  CreateCalendarEventRequest,
  CreateCalendarEventResponse,
  BulkCalendarEventRequest,
  BulkCalendarEventResponse,
  GetCalendarEventsRequest,
  GetCalendarEventsResponse,
  BulkCostCalculationRequest,
  BulkCostCalculationResponse,
  UpdateCostTrackingRequest,
  UpdateCostTrackingResponse,
  GetCompanyLocationsRequest,
  CompanyLocationResponse,
  AssociateEventCompanyRequest,
  AssociateEventCompanyResponse,
  ExportCalendarEventsRequest,
  ExportCalendarEventsResponse,
  CalendarApiError,
  CalendarApiErrorCode
} from '@/types/api'

/**
 * Calendar Events API Service Class
 */
export class CalendarEventsService {
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Create a single calendar event
   */
  async createEvent(request: CreateCalendarEventRequest): Promise<CreateCalendarEventResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-events`, {
        method: 'POST',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return this.handleError('Failed to create calendar event', error)
    }
  }

  /**
   * Bulk create or update multiple calendar events
   */
  async bulkCreateEvents(request: BulkCalendarEventRequest): Promise<BulkCalendarEventResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-events/bulk`, {
        method: 'POST',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        processed: 0,
        created: 0,
        updated: 0,
        skipped: request.events.length,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get calendar events for a trip
   */
  async getEvents(request: GetCalendarEventsRequest): Promise<GetCalendarEventsResponse> {
    try {
      const params = new URLSearchParams({
        tripId: request.tripId
      })

      if (request.dateRange) {
        params.append('startDate', request.dateRange.startDate)
        params.append('endDate', request.dateRange.endDate)
      }

      if (request.eventTypes && request.eventTypes.length > 0) {
        params.append('eventTypes', request.eventTypes.join(','))
      }

      if (request.includeCosts) {
        params.append('includeCosts', 'true')
      }

      if (request.includeCompanies) {
        params.append('includeCompanies', 'true')
      }

      const response = await fetch(`${this.baseUrl}/calendar-events?${params}`, {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        events: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CreateCalendarEventResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-events/${eventId}`, {
        method: 'PATCH',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return this.handleError('Failed to update calendar event', error)
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-events/${eventId}`, {
        method: 'DELETE',
        headers: this.defaultHeaders,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Calculate costs for multiple events
   */
  async calculateBulkCosts(request: BulkCostCalculationRequest): Promise<BulkCostCalculationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-events/calculate-costs`, {
        method: 'POST',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        calculations: request.requests.map(() => ({
          success: false,
          currency: 'USD',
          error: error instanceof Error ? error.message : 'Cost calculation failed'
        })),
        error: error instanceof Error ? error.message : 'Bulk cost calculation failed'
      }
    }
  }

  /**
   * Update cost tracking for an event
   */
  async updateCostTracking(request: UpdateCostTrackingRequest): Promise<UpdateCostTrackingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-events/${request.eventId}/costs`, {
        method: 'PUT',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify({
          costTracking: request.costTracking,
          userId: request.userId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update cost tracking'
      }
    }
  }

  /**
   * Get company locations for event planning
   */
  async getCompanyLocations(request: GetCompanyLocationsRequest): Promise<CompanyLocationResponse> {
    try {
      const params = new URLSearchParams()

      if (request.companyIds && request.companyIds.length > 0) {
        params.append('companyIds', request.companyIds.join(','))
      }

      if (request.search) {
        params.append('search', request.search)
      }

      if (request.includeCoordinates) {
        params.append('includeCoordinates', 'true')
      }

      if (request.offset !== undefined) {
        params.append('offset', request.offset.toString())
      }

      if (request.limit !== undefined) {
        params.append('limit', request.limit.toString())
      }

      const response = await fetch(`${this.baseUrl}/companies/locations?${params}`, {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        locations: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch company locations'
      }
    }
  }

  /**
   * Associate an event with a company location
   */
  async associateEventWithCompany(request: AssociateEventCompanyRequest): Promise<AssociateEventCompanyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-events/${request.eventId}/company`, {
        method: 'PUT',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify({
          companyAssociation: request.companyAssociation,
          userId: request.userId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to associate event with company'
      }
    }
  }

  /**
   * Export calendar events in various formats
   */
  async exportEvents(request: ExportCalendarEventsRequest): Promise<ExportCalendarEventsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-events/export`, {
        method: 'POST',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export calendar events'
      }
    }
  }

  /**
   * Progressive save for calendar events during trip creation
   */
  async progressiveSave(request: ProgressiveSaveRequest): Promise<ProgressiveSaveResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/trips/progressive-save`, {
        method: 'POST',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        eventsSaved: 0,
        error: error instanceof Error ? error.message : 'Progressive save failed',
        lastSaved: new Date()
      }
    }
  }

  /**
   * Generic error handler for API responses
   */
  private handleError(context: string, error: unknown): CreateCalendarEventResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      errors: [errorMessage],
      error: `${context}: ${errorMessage}`
    }
  }
}

/**
 * Default calendar events service instance
 */
export const calendarEventsService = new CalendarEventsService()

/**
 * Hook for using calendar events service in React components
 */
export function useCalendarEventsService() {
  return calendarEventsService
}

/**
 * Utility function to validate calendar event data before API calls
 */
export function validateCalendarEvent(event: Partial<CalendarEvent>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!event.title || event.title.trim() === '') {
    errors.push('Event title is required')
  }

  if (!event.type) {
    errors.push('Event type is required')
  }

  if (!event.date) {
    errors.push('Event date is required')
  }

  if (!event.startTime) {
    errors.push('Start time is required')
  }

  if (!event.endTime) {
    errors.push('End time is required')
  }

  if (event.startTime && event.endTime && event.startTime >= event.endTime) {
    errors.push('End time must be after start time')
  }

  // Validate cost tracking if present
  if (event.costTracking) {
    if (event.costTracking.costPerPerson !== undefined && event.costTracking.costPerPerson < 0) {
      errors.push('Cost per person cannot be negative')
    }

    if (event.costTracking.totalCost !== undefined && event.costTracking.totalCost < 0) {
      errors.push('Total cost cannot be negative')
    }

    if (event.costTracking.costBreakdown) {
      event.costTracking.costBreakdown.forEach((item, index) => {
        if (!item.description || item.description.trim() === '') {
          errors.push(`Cost breakdown item ${index + 1} must have a description`)
        }
        if (item.amount < 0) {
          errors.push(`Cost breakdown item ${index + 1} cannot have negative amount`)
        }
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Utility function to calculate total cost across multiple events
 */
export function calculateTotalEventsCost(events: CalendarEvent[]): { totalCost: number; currency: string; breakdown: Record<string, number> } {
  let totalCost = 0
  const currencyMap = new Map<string, number>()
  const breakdown: Record<string, number> = {}

  events.forEach(event => {
    if (event.costTracking) {
      let eventCost = 0
      const currency = event.costTracking.currency || 'USD'

      if (event.costTracking.totalCost !== undefined) {
        eventCost = event.costTracking.totalCost
      } else if (event.costTracking.costPerPerson !== undefined) {
        const attendeeCount = event.attendeeDetails?.length || 1
        eventCost = event.costTracking.costPerPerson * attendeeCount
      } else if (event.costTracking.costBreakdown) {
        eventCost = event.costTracking.costBreakdown.reduce((sum, item) => {
          return sum + (item.amount * (item.quantity || 1))
        }, 0)
      }

      if (eventCost > 0) {
        currencyMap.set(currency, (currencyMap.get(currency) || 0) + eventCost)
        breakdown[event.type] = (breakdown[event.type] || 0) + eventCost
      }
    }
  })

  // For simplicity, return the currency with the highest total
  const primaryCurrency = Array.from(currencyMap.entries())
    .sort((a, b) => b[1] - a[1])[0]

  return {
    totalCost: primaryCurrency?.[1] || 0,
    currency: primaryCurrency?.[0] || 'USD',
    breakdown
  }
}