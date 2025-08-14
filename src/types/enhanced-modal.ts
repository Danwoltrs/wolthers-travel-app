/**
 * Enhanced Quick View Modal Types
 * 
 * Comprehensive type definitions for the enhanced Quick View modal with full editing capabilities.
 * Integrates with existing Trip, Activity, User, Company, and Vehicle types while providing
 * type-safe interfaces for complex editing workflows, validation, and real-time updates.
 */

import type { 
  Trip,
  Activity,
  ItineraryDay,
  TripParticipant,
  User,
  Company,
  CompanyLocation,
  Vehicle,
  CalendarEvent,
  TripStatus,
  UserRole,
  CompanyWithLocations
} from './index'

// ===== CORE MODAL STATE TYPES =====

/**
 * Enhanced modal tabs with editing capabilities
 */
export type EnhancedModalTab = 'overview' | 'schedule' | 'participants' | 'logistics' | 'documents' | 'expenses'

/**
 * Modal editing modes
 */
export type ModalEditingMode = 'view' | 'edit' | 'bulk-edit' | 'create'

/**
 * Modal state for managing editing workflows
 */
export interface EnhancedModalState {
  /** Current active tab */
  activeTab: EnhancedModalTab
  /** Current editing mode */
  editingMode: ModalEditingMode
  /** Whether any changes have been made */
  hasUnsavedChanges: boolean
  /** Whether auto-save is enabled */
  autoSaveEnabled: boolean
  /** Last save timestamp */
  lastSaved: Date | null
  /** Current save status */
  saveStatus: SaveStatus
  /** Validation state for each tab */
  validationState: Record<EnhancedModalTab, TabValidationState>
  /** Loading states for each tab */
  loadingState: Record<EnhancedModalTab, boolean>
  /** Error states for each tab */
  errorState: Record<EnhancedModalTab, string | null>
}

/**
 * Save status tracking
 */
export interface SaveStatus {
  /** Whether a save operation is in progress */
  isSaving: boolean
  /** Save operation result */
  status: 'idle' | 'saving' | 'success' | 'error'
  /** Error message if save failed */
  error: string | null
  /** Progress indicator for long operations */
  progress?: number
}

/**
 * Validation state for each tab
 */
export interface TabValidationState {
  /** Whether the tab content is valid */
  isValid: boolean
  /** Validation errors grouped by field */
  errors: Record<string, string[]>
  /** Warnings that don't prevent saving */
  warnings: Record<string, string[]>
  /** Field-level validation states */
  fieldStates: Record<string, FieldValidationState>
}

/**
 * Individual field validation state
 */
export interface FieldValidationState {
  /** Whether the field is valid */
  isValid: boolean
  /** Whether the field has been touched by user */
  isTouched: boolean
  /** Whether the field is currently being validated */
  isValidating: boolean
  /** Field-specific error messages */
  errors: string[]
  /** Field-specific warnings */
  warnings: string[]
}

// ===== SCHEDULE TAB TYPES =====

/**
 * Schedule editing data structure
 */
export interface ScheduleEditData {
  /** Original trip dates */
  originalStartDate: Date
  originalEndDate: Date
  /** Modified trip dates */
  startDate: Date
  endDate: Date
  /** Itinerary days with activities */
  itineraryDays: EnhancedItineraryDay[]
  /** Drag and drop operations */
  dragDropState: DragDropState
  /** Calendar view settings */
  calendarView: CalendarViewSettings
}

/**
 * Enhanced itinerary day with editing capabilities
 */
export interface EnhancedItineraryDay extends ItineraryDay {
  /** Whether this day is being edited */
  isEditing: boolean
  /** Temporary changes before saving */
  pendingChanges?: Partial<ItineraryDay>
  /** Activities with enhanced editing features */
  activities: EnhancedActivity[]
  /** Day-level validation state */
  validation: TabValidationState
}

/**
 * Enhanced activity with editing and drag-drop support
 */
export interface EnhancedActivity extends Activity {
  /** Unique identifier for drag-drop operations */
  dragId: string
  /** Whether this activity is being edited */
  isEditing: boolean
  /** Whether this activity is selected for bulk operations */
  isSelected: boolean
  /** Temporary changes before saving */
  pendingChanges?: Partial<Activity>
  /** Drag state information */
  dragState?: ActivityDragState
  /** Conflict resolution data */
  conflicts?: ActivityConflict[]
  /** Activity-level validation state */
  validation: TabValidationState
}

/**
 * Drag and drop state management
 */
export interface DragDropState {
  /** Currently dragged activity */
  draggedActivity: EnhancedActivity | null
  /** Drop target information */
  dropTarget: DropTarget | null
  /** Whether drag operation is in progress */
  isDragging: boolean
  /** Drag preview data */
  dragPreview: DragPreview | null
}

/**
 * Drop target for drag operations
 */
export interface DropTarget {
  /** Target day ID */
  dayId: string
  /** Target position in day */
  position: number
  /** Target time slot */
  timeSlot: string
  /** Whether this is a valid drop target */
  isValid: boolean
}

/**
 * Drag preview information
 */
export interface DragPreview {
  /** Preview activity data */
  activity: EnhancedActivity
  /** Calculated new time */
  newTime: string
  /** Calculated conflicts */
  potentialConflicts: ActivityConflict[]
}

/**
 * Activity conflict information
 */
export interface ActivityConflict {
  /** Type of conflict */
  type: 'time_overlap' | 'resource_conflict' | 'location_conflict' | 'participant_conflict'
  /** Severity level */
  severity: 'low' | 'medium' | 'high'
  /** Conflict description */
  description: string
  /** Conflicting activity ID */
  conflictingActivityId?: string
  /** Suggested resolution */
  suggestedResolution?: string
}

/**
 * Activity drag state
 */
export interface ActivityDragState {
  /** Original position */
  originalDayId: string
  originalPosition: number
  /** Current position during drag */
  currentDayId?: string
  currentPosition?: number
  /** Whether drag started */
  isDragStarted: boolean
}

/**
 * Calendar view settings
 */
export interface CalendarViewSettings {
  /** View type */
  viewType: 'day' | 'week' | 'timeline'
  /** Time slot duration in minutes */
  timeSlotDuration: 15 | 30 | 60
  /** Start hour for day view */
  startHour: number
  /** End hour for day view */
  endHour: number
  /** Whether weekends are shown */
  showWeekends: boolean
}

// ===== PARTICIPANTS TAB TYPES =====

/**
 * Participants editing data structure
 */
export interface ParticipantsEditData {
  /** Wolthers staff participants */
  wolthersStaff: EnhancedStaffParticipant[]
  /** Company participants */
  companyParticipants: EnhancedCompanyParticipant[]
  /** External guests */
  externalGuests: EnhancedExternalGuest[]
  /** Availability checking state */
  availabilityCheck: AvailabilityCheckState
  /** Role assignment data */
  roleAssignments: RoleAssignmentData
}

/**
 * Enhanced staff participant with editing features
 */
export interface EnhancedStaffParticipant extends TripParticipant {
  /** User details */
  user: User
  /** Availability status */
  availability: ParticipantAvailability
  /** Role-specific permissions */
  rolePermissions: Record<string, boolean>
  /** Workload information */
  workload: StaffWorkload
  /** Whether selected for bulk operations */
  isSelected: boolean
  /** Temporary changes before saving */
  pendingChanges?: Partial<TripParticipant>
}

/**
 * Enhanced company participant
 */
export interface EnhancedCompanyParticipant extends TripParticipant {
  /** Company details */
  company: Company
  /** Associated users from this company */
  users: User[]
  /** Company-specific permissions */
  companyPermissions: Record<string, boolean>
  /** Whether selected for bulk operations */
  isSelected: boolean
  /** Temporary changes before saving */
  pendingChanges?: Partial<TripParticipant>
}

/**
 * External guest participant
 */
export interface EnhancedExternalGuest {
  /** Unique identifier */
  id: string
  /** Guest name */
  name: string
  /** Guest email */
  email?: string
  /** Guest phone */
  phone?: string
  /** Guest company/organization */
  organization?: string
  /** Guest role in trip */
  role: string
  /** Start and end dates */
  startDate: Date
  endDate: Date
  /** Special requirements */
  requirements?: string[]
  /** Whether selected for bulk operations */
  isSelected: boolean
}

/**
 * Participant availability status
 */
export interface ParticipantAvailability {
  /** Overall availability status */
  status: 'available' | 'busy' | 'conflict' | 'unknown'
  /** Conflicting events */
  conflicts: AvailabilityConflict[]
  /** Last checked timestamp */
  lastChecked: Date
  /** Confidence level */
  confidence: number
}

/**
 * Availability conflict
 */
export interface AvailabilityConflict {
  /** Conflict date and time */
  startTime: Date
  endTime: Date
  /** Conflict description */
  description: string
  /** Conflict severity */
  severity: 'low' | 'medium' | 'high'
  /** Source of conflict */
  source: 'calendar' | 'trip' | 'manual'
}

/**
 * Staff workload information
 */
export interface StaffWorkload {
  /** Current trip count */
  currentTrips: number
  /** Upcoming trip count */
  upcomingTrips: number
  /** Workload percentage */
  workloadPercentage: number
  /** Recommended actions */
  recommendations: string[]
}

/**
 * Availability checking state
 */
export interface AvailabilityCheckState {
  /** Whether check is in progress */
  isChecking: boolean
  /** Last check timestamp */
  lastChecked: Date | null
  /** Check results */
  results: Record<string, ParticipantAvailability>
  /** Check errors */
  errors: Record<string, string>
}

/**
 * Role assignment data
 */
export interface RoleAssignmentData {
  /** Available roles */
  availableRoles: TripRole[]
  /** Role assignments */
  assignments: Record<string, string[]>
  /** Role requirements */
  requirements: RoleRequirement[]
}

/**
 * Trip role definition
 */
export interface TripRole {
  /** Role identifier */
  id: string
  /** Role display name */
  name: string
  /** Role description */
  description: string
  /** Required permissions */
  permissions: string[]
  /** Maximum number of users with this role */
  maxUsers?: number
  /** Required user roles that can have this trip role */
  requiredUserRoles: UserRole[]
}

/**
 * Role requirement
 */
export interface RoleRequirement {
  /** Role ID */
  roleId: string
  /** Minimum required users */
  minRequired: number
  /** Whether requirement is met */
  isMet: boolean
  /** Requirement description */
  description: string
}

// ===== LOGISTICS TAB TYPES =====

/**
 * Logistics editing data structure
 */
export interface LogisticsEditData {
  /** Vehicle assignments */
  vehicleAssignments: EnhancedVehicleAssignment[]
  /** Driver assignments */
  driverAssignments: EnhancedDriverAssignment[]
  /** Equipment tracking */
  equipment: EquipmentItem[]
  /** Accommodation details */
  accommodations: AccommodationItem[]
  /** Transportation planning */
  transportation: TransportationPlan
}

/**
 * Enhanced vehicle assignment
 */
export interface EnhancedVehicleAssignment {
  /** Assignment ID */
  id: string
  /** Vehicle details */
  vehicle: Vehicle
  /** Assigned driver */
  driver?: User
  /** Assignment start date */
  startDate: Date
  /** Assignment end date */
  endDate: Date
  /** Specific activities this vehicle is assigned to */
  assignedActivities: string[]
  /** Vehicle-specific requirements met */
  requirementsMet: VehicleRequirement[]
  /** Assignment status */
  status: 'assigned' | 'reserved' | 'confirmed' | 'in_use' | 'returned'
  /** Whether selected for bulk operations */
  isSelected: boolean
  /** Temporary changes before saving */
  pendingChanges?: Partial<EnhancedVehicleAssignment>
}

/**
 * Enhanced driver assignment
 */
export interface EnhancedDriverAssignment {
  /** Assignment ID */
  id: string
  /** Driver details */
  driver: User
  /** Assigned vehicle */
  vehicle?: Vehicle
  /** Assignment start date */
  startDate: Date
  /** Assignment end date */
  endDate: Date
  /** Driver availability */
  availability: ParticipantAvailability
  /** License and certification status */
  certifications: DriverCertification[]
  /** Assignment status */
  status: 'assigned' | 'confirmed' | 'active' | 'completed'
  /** Whether selected for bulk operations */
  isSelected: boolean
}

/**
 * Vehicle requirement
 */
export interface VehicleRequirement {
  /** Requirement type */
  type: 'capacity' | 'features' | 'license' | 'insurance'
  /** Requirement description */
  description: string
  /** Whether requirement is met */
  isMet: boolean
  /** Additional details */
  details?: string
}

/**
 * Driver certification
 */
export interface DriverCertification {
  /** Certification type */
  type: 'license' | 'insurance' | 'training'
  /** Certification name */
  name: string
  /** Expiry date */
  expiryDate: Date
  /** Whether certification is valid */
  isValid: boolean
  /** Certification details */
  details?: string
}

/**
 * Equipment item
 */
export interface EquipmentItem {
  /** Equipment ID */
  id: string
  /** Equipment name */
  name: string
  /** Equipment type */
  type: 'presentation' | 'communication' | 'safety' | 'other'
  /** Equipment description */
  description?: string
  /** Quantity needed */
  quantityNeeded: number
  /** Quantity assigned */
  quantityAssigned: number
  /** Assigned to specific activities */
  assignedActivities: string[]
  /** Equipment status */
  status: 'needed' | 'assigned' | 'delivered' | 'returned'
}

/**
 * Accommodation item
 */
export interface AccommodationItem {
  /** Accommodation ID */
  id: string
  /** Hotel/accommodation name */
  name: string
  /** Address */
  address: string
  /** Check-in date */
  checkInDate: Date
  /** Check-out date */
  checkOutDate: Date
  /** Room details */
  rooms: RoomAssignment[]
  /** Booking reference */
  bookingReference?: string
  /** Booking status */
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out'
  /** Cost information */
  cost: AccommodationCost
}

/**
 * Room assignment
 */
export interface RoomAssignment {
  /** Room ID */
  id: string
  /** Room number */
  roomNumber?: string
  /** Room type */
  roomType: string
  /** Assigned guests */
  assignedGuests: string[]
  /** Room capacity */
  capacity: number
  /** Special requests */
  specialRequests?: string[]
}

/**
 * Accommodation cost
 */
export interface AccommodationCost {
  /** Cost per night */
  costPerNight: number
  /** Total cost */
  totalCost: number
  /** Currency */
  currency: string
  /** Cost breakdown */
  breakdown: CostBreakdownItem[]
}

/**
 * Transportation plan
 */
export interface TransportationPlan {
  /** Transportation legs */
  legs: TransportationLeg[]
  /** Total distance */
  totalDistance: number
  /** Total duration */
  totalDuration: number
  /** Transportation mode preferences */
  preferences: TransportationPreferences
}

/**
 * Transportation leg
 */
export interface TransportationLeg {
  /** Leg ID */
  id: string
  /** Origin */
  origin: Location
  /** Destination */
  destination: Location
  /** Transportation mode */
  mode: 'driving' | 'flying' | 'train' | 'bus' | 'walking'
  /** Departure time */
  departureTime: Date
  /** Arrival time */
  arrivalTime: Date
  /** Distance in kilometers */
  distance: number
  /** Duration in minutes */
  duration: number
  /** Assigned vehicle */
  assignedVehicle?: string
  /** Assigned driver */
  assignedDriver?: string
  /** Passengers */
  passengers: string[]
}

/**
 * Transportation preferences
 */
export interface TransportationPreferences {
  /** Preferred mode of transport */
  preferredMode: 'driving' | 'flying' | 'mixed'
  /** Maximum driving time per day */
  maxDrivingTimePerDay: number
  /** Rest stop requirements */
  restStopRequirements: boolean
  /** Fuel efficiency priority */
  fuelEfficiencyPriority: boolean
}

/**
 * Location information
 */
export interface Location {
  /** Location name */
  name: string
  /** Address */
  address: string
  /** Coordinates */
  coordinates: {
    latitude: number
    longitude: number
  }
  /** Additional location details */
  details?: string
}

// ===== FORM DATA TYPES =====

/**
 * Complete form data for enhanced modal editing
 */
export interface EnhancedModalFormData {
  /** Basic trip information */
  trip: Partial<Trip>
  /** Schedule editing data */
  schedule: ScheduleEditData
  /** Participants editing data */
  participants: ParticipantsEditData
  /** Logistics editing data */
  logistics: LogisticsEditData
  /** Additional metadata */
  metadata: Record<string, any>
}

/**
 * Bulk edit operations data
 */
export interface BulkEditData {
  /** Selected item IDs */
  selectedItems: string[]
  /** Bulk operation type */
  operation: BulkOperation
  /** Operation parameters */
  parameters: Record<string, any>
}

/**
 * Bulk operation types
 */
export type BulkOperation = 
  | 'update_status'
  | 'assign_participants'
  | 'update_times'
  | 'delete'
  | 'duplicate'
  | 'move_to_day'
  | 'assign_vehicles'
  | 'update_permissions'

// ===== API INTEGRATION TYPES =====

/**
 * Real-time update event
 */
export interface RealtimeUpdateEvent {
  /** Event type */
  type: 'activity_updated' | 'participant_added' | 'vehicle_assigned' | 'trip_modified'
  /** Trip ID */
  tripId: string
  /** Updated entity ID */
  entityId: string
  /** Update data */
  data: any
  /** Timestamp */
  timestamp: Date
  /** User who made the change */
  userId: string
}

/**
 * Progressive save request
 */
export interface ProgressiveSaveRequest {
  /** Trip ID */
  tripId: string
  /** Tab being saved */
  tab: EnhancedModalTab
  /** Form data to save */
  formData: Partial<EnhancedModalFormData>
  /** Save options */
  options: ProgressiveSaveOptions
}

/**
 * Progressive save options
 */
export interface ProgressiveSaveOptions {
  /** Whether this is an auto-save */
  isAutoSave: boolean
  /** Fields to save */
  fieldsToSave?: string[]
  /** Validation level */
  validationLevel: 'none' | 'basic' | 'full'
  /** Conflict resolution strategy */
  conflictResolution: 'overwrite' | 'merge' | 'prompt'
}

/**
 * Progressive save response
 */
export interface ProgressiveSaveResponse {
  /** Success status */
  success: boolean
  /** Saved data */
  savedData: Partial<EnhancedModalFormData>
  /** Validation results */
  validation: TabValidationState
  /** Conflicts encountered */
  conflicts: SaveConflict[]
  /** Save timestamp */
  timestamp: Date
  /** Error message if failed */
  error?: string
}

/**
 * Save conflict
 */
export interface SaveConflict {
  /** Conflict type */
  type: 'concurrent_edit' | 'validation_error' | 'permission_error'
  /** Field name */
  field: string
  /** Current value */
  currentValue: any
  /** Conflicting value */
  conflictingValue: any
  /** Suggested resolution */
  suggestedResolution: 'keep_current' | 'use_new' | 'merge'
}

// ===== TYPE GUARDS AND UTILITIES =====

/**
 * Type guard for enhanced activities
 */
export function isEnhancedActivity(activity: Activity | EnhancedActivity): activity is EnhancedActivity {
  return 'dragId' in activity && 'isEditing' in activity
}

/**
 * Type guard for enhanced participants
 */
export function isStaffParticipant(participant: EnhancedStaffParticipant | EnhancedCompanyParticipant): participant is EnhancedStaffParticipant {
  return 'user' in participant && 'availability' in participant
}

/**
 * Utility type for tab form data
 */
export type TabFormData<T extends EnhancedModalTab> = 
  T extends 'schedule' ? ScheduleEditData :
  T extends 'participants' ? ParticipantsEditData :
  T extends 'logistics' ? LogisticsEditData :
  T extends 'overview' ? Partial<Trip> :
  Record<string, any>

/**
 * Cost breakdown item (re-exported from main types)
 */
export interface CostBreakdownItem {
  id: string
  description: string
  amount: number
  currency: string
  quantity?: number
  assignedTo?: string
  notes?: string
}