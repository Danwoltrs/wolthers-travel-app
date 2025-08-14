/**
 * API types for enhanced calendar events and cost tracking
 * Provides type-safe interfaces for all API interactions
 */

import { 
  CalendarEvent, 
  CostTracking, 
  CompanyAssociation, 
  CompanyLocationDetails,
  CostCalculationRequest,
  CostCalculationResponse,
  ProgressiveSaveRequest,
  ProgressiveSaveResponse,
  CompanyLocationResponse
} from './index'

// ===== CALENDAR EVENT API TYPES =====

/**
 * Request to create or update a calendar event
 */
export interface CreateCalendarEventRequest {
  /** Calendar event data */
  event: Omit<CalendarEvent, 'id'>
  /** Trip ID this event belongs to */
  tripId: string
  /** User ID creating the event */
  userId: string
}

/**
 * Response from creating or updating a calendar event
 */
export interface CreateCalendarEventResponse {
  /** Success status */
  success: boolean
  /** Created/updated event */
  event?: CalendarEvent
  /** Validation errors */
  errors?: string[]
  /** Warning messages */
  warnings?: string[]
  /** Error message if request failed */
  error?: string
}

/**
 * Request to bulk create/update multiple calendar events
 */
export interface BulkCalendarEventRequest {
  /** Array of calendar events */
  events: (Omit<CalendarEvent, 'id'> | CalendarEvent)[]
  /** Trip ID these events belong to */
  tripId: string
  /** User ID performing the operation */
  userId: string
  /** Whether to replace all existing events */
  replaceAll?: boolean
}

/**
 * Response from bulk calendar event operations
 */
export interface BulkCalendarEventResponse {
  /** Success status */
  success: boolean
  /** Number of events processed */
  processed: number
  /** Number of events created */
  created: number
  /** Number of events updated */
  updated: number
  /** Number of events skipped due to errors */
  skipped: number
  /** Array of created/updated events */
  events: CalendarEvent[]
  /** Validation errors by event index */
  errors?: Record<number, string[]>
  /** Overall error message */
  error?: string
}

/**
 * Request to get calendar events for a trip
 */
export interface GetCalendarEventsRequest {
  /** Trip ID to get events for */
  tripId: string
  /** Optional date range filter */
  dateRange?: {
    startDate: string
    endDate: string
  }
  /** Optional event type filter */
  eventTypes?: CalendarEvent['type'][]
  /** Include cost information */
  includeCosts?: boolean
  /** Include company information */
  includeCompanies?: boolean
}

/**
 * Response from getting calendar events
 */
export interface GetCalendarEventsResponse {
  /** Success status */
  success: boolean
  /** Array of calendar events */
  events: CalendarEvent[]
  /** Total count of events */
  total: number
  /** Total estimated cost across all events */
  totalCost?: number
  /** Currency for total cost */
  currency?: string
  /** Error message if request failed */
  error?: string
}

// ===== COST TRACKING API TYPES =====

/**
 * Request to calculate costs for multiple events
 */
export interface BulkCostCalculationRequest {
  /** Array of cost calculation requests */
  requests: CostCalculationRequest[]
  /** Trip ID for context */
  tripId?: string
  /** User ID for pricing context */
  userId?: string
}

/**
 * Response from bulk cost calculation
 */
export interface BulkCostCalculationResponse {
  /** Success status */
  success: boolean
  /** Array of cost calculation responses */
  calculations: CostCalculationResponse[]
  /** Overall error message */
  error?: string
}

/**
 * Request to update cost tracking for an event
 */
export interface UpdateCostTrackingRequest {
  /** Event ID to update */
  eventId: string
  /** Updated cost tracking data */
  costTracking: CostTracking
  /** User ID performing the update */
  userId: string
}

/**
 * Response from updating cost tracking
 */
export interface UpdateCostTrackingResponse {
  /** Success status */
  success: boolean
  /** Updated event with new cost tracking */
  event?: CalendarEvent
  /** Validation errors */
  errors?: string[]
  /** Error message if update failed */
  error?: string
}

// ===== COMPANY INTEGRATION API TYPES =====

/**
 * Request to get company locations for event planning
 */
export interface GetCompanyLocationsRequest {
  /** Optional company IDs to filter by */
  companyIds?: string[]
  /** Search query for location names or addresses */
  search?: string
  /** Include coordinates for mapping */
  includeCoordinates?: boolean
  /** Pagination offset */
  offset?: number
  /** Number of results per page */
  limit?: number
}

/**
 * Request to associate an event with a company location
 */
export interface AssociateEventCompanyRequest {
  /** Event ID to associate */
  eventId: string
  /** Company association data */
  companyAssociation: CompanyAssociation
  /** User ID performing the association */
  userId: string
}

/**
 * Response from associating event with company
 */
export interface AssociateEventCompanyResponse {
  /** Success status */
  success: boolean
  /** Updated event with company association */
  event?: CalendarEvent
  /** Error message if association failed */
  error?: string
}

/**
 * Request to create a new company location
 */
export interface CreateCompanyLocationRequest {
  /** Company ID */
  companyId: string
  /** Location details */
  locationDetails: CompanyLocationDetails
  /** Whether this is the primary location */
  isPrimary?: boolean
  /** User ID creating the location */
  userId: string
}

/**
 * Response from creating company location
 */
export interface CreateCompanyLocationResponse {
  /** Success status */
  success: boolean
  /** Created location */
  location?: {
    id: string
    companyId: string
    name: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    googleMapsLink?: string
    coordinates?: { lat: number; lng: number }
    isPrimary: boolean
    createdAt: Date
  }
  /** Error message if creation failed */
  error?: string
}

// ===== VALIDATION AND UTILITY TYPES =====

/**
 * Validation result for calendar event data
 */
export interface CalendarEventValidation {
  /** Whether the event is valid */
  isValid: boolean
  /** Array of validation errors */
  errors: string[]
  /** Array of warnings */
  warnings: string[]
  /** Suggested fixes */
  suggestions?: string[]
}

/**
 * Export format options for calendar events
 */
export type CalendarExportFormat = 'ics' | 'csv' | 'json' | 'pdf'

/**
 * Request to export calendar events
 */
export interface ExportCalendarEventsRequest {
  /** Trip ID to export events for */
  tripId: string
  /** Export format */
  format: CalendarExportFormat
  /** Optional date range filter */
  dateRange?: {
    startDate: string
    endDate: string
  }
  /** Include cost information in export */
  includeCosts?: boolean
  /** Include company information in export */
  includeCompanies?: boolean
  /** User ID requesting the export */
  userId: string
}

/**
 * Response from exporting calendar events
 */
export interface ExportCalendarEventsResponse {
  /** Success status */
  success: boolean
  /** Export file URL or data */
  exportData?: string
  /** File download URL */
  downloadUrl?: string
  /** Export metadata */
  metadata?: {
    format: CalendarExportFormat
    eventCount: number
    generatedAt: Date
    expiresAt?: Date
  }
  /** Error message if export failed */
  error?: string
}

// ===== ERROR TYPES =====

/**
 * Calendar API error codes
 */
export enum CalendarApiErrorCode {
  VALIDATION_ERROR = 'validation_error',
  UNAUTHORIZED = 'unauthorized',
  NOT_FOUND = 'not_found',
  DUPLICATE_EVENT = 'duplicate_event',
  COST_CALCULATION_FAILED = 'cost_calculation_failed',
  COMPANY_NOT_FOUND = 'company_not_found',
  LOCATION_NOT_FOUND = 'location_not_found',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  RATE_LIMITED = 'rate_limited',
  EXTERNAL_API_ERROR = 'external_api_error',
  INTERNAL_ERROR = 'internal_error'
}

/**
 * Detailed API error response
 */
export interface CalendarApiError {
  /** Error code */
  code: CalendarApiErrorCode
  /** Human-readable error message */
  message: string
  /** Additional error details */
  details?: Record<string, any>
  /** Field-specific errors */
  fieldErrors?: Record<string, string[]>
  /** Request ID for debugging */
  requestId?: string
  /** Timestamp when error occurred */
  timestamp: Date
}