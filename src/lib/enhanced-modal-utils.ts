/**
 * Enhanced Modal Utilities
 * 
 * Type-safe utilities and helper functions for the enhanced Quick View modal.
 * Provides type guards, validation helpers, and utility functions for complex editing workflows.
 */

import type {
  EnhancedActivity,
  EnhancedStaffParticipant,
  EnhancedCompanyParticipant,
  EnhancedExternalGuest,
  EnhancedVehicleAssignment,
  ActivityConflict,
  AvailabilityConflict,
  EnhancedModalState,
  TabValidationState,
  FieldValidationState,
  DragDropState,
  ValidationResult,
  ValidationContext,
  ConflictDetectionResult,
  DetectedConflict,
  ParticipantAvailability
} from '@/types/enhanced-modal'

import type {
  ValidationRule,
  ValidationRuleType,
  ConflictType,
  AsyncValidationState
} from '@/types/enhanced-modal-validation'

import type { Activity, TripParticipant, User, Vehicle } from '@/types'

// ===== TYPE GUARDS =====

/**
 * Type guard to check if activity is enhanced
 */
export function isEnhancedActivity(
  activity: Activity | EnhancedActivity
): activity is EnhancedActivity {
  return (
    'dragId' in activity &&
    'isEditing' in activity &&
    'isSelected' in activity &&
    'validation' in activity
  )
}

/**
 * Type guard to check if participant is staff participant
 */
export function isStaffParticipant(
  participant: EnhancedStaffParticipant | EnhancedCompanyParticipant
): participant is EnhancedStaffParticipant {
  return 'user' in participant && 'availability' in participant
}

/**
 * Type guard to check if participant is company participant
 */
export function isCompanyParticipant(
  participant: EnhancedStaffParticipant | EnhancedCompanyParticipant
): participant is EnhancedCompanyParticipant {
  return 'company' in participant && 'users' in participant
}

/**
 * Type guard to check if validation state has errors
 */
export function hasValidationErrors(state: TabValidationState): boolean {
  return !state.isValid || Object.keys(state.errors).length > 0
}

/**
 * Type guard to check if validation state has warnings
 */
export function hasValidationWarnings(state: TabValidationState): boolean {
  return Object.keys(state.warnings).length > 0
}

/**
 * Type guard to check if field has pending validation
 */
export function isFieldValidating(field: FieldValidationState): boolean {
  return field.isValidating
}

/**
 * Type guard to check if modal has unsaved changes
 */
export function hasUnsavedChanges(state: EnhancedModalState): boolean {
  return state.hasUnsavedChanges
}

// ===== VALIDATION UTILITIES =====

/**
 * Creates a new validation context
 */
export function createValidationContext(
  fieldValue: any,
  formData: Record<string, any>,
  additionalContext: Record<string, any> = {}
): ValidationContext {
  return {
    fieldValue,
    formData,
    currentTab: 'overview',
    mode: 'onChange',
    context: additionalContext
  }
}

/**
 * Creates an empty validation result
 */
export function createEmptyValidationResult(): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {}
  }
}

/**
 * Merges validation results
 */
export function mergeValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  const merged: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {}
  }

  for (const result of results) {
    merged.isValid = merged.isValid && result.isValid
    merged.errors.push(...result.errors)
    merged.warnings.push(...result.warnings)
    Object.assign(merged.metadata!, result.metadata || {})
  }

  return merged
}

/**
 * Creates tab validation state
 */
export function createTabValidationState(): TabValidationState {
  return {
    isValid: true,
    errors: {},
    warnings: {},
    fieldStates: {}
  }
}

/**
 * Creates field validation state
 */
export function createFieldValidationState(): FieldValidationState {
  return {
    isValid: true,
    isTouched: false,
    isValidating: false,
    errors: [],
    warnings: []
  }
}

/**
 * Updates field validation state
 */
export function updateFieldValidationState(
  current: FieldValidationState,
  result: ValidationResult,
  isTouched: boolean = true
): FieldValidationState {
  return {
    ...current,
    isValid: result.isValid,
    isTouched,
    isValidating: false,
    errors: result.errors,
    warnings: result.warnings
  }
}

/**
 * Gets all validation errors from tab state
 */
export function getAllValidationErrors(state: TabValidationState): string[] {
  const allErrors: string[] = []
  
  Object.values(state.errors).forEach(errors => {
    allErrors.push(...errors)
  })
  
  Object.values(state.fieldStates).forEach(fieldState => {
    allErrors.push(...fieldState.errors)
  })
  
  return allErrors
}

/**
 * Gets all validation warnings from tab state
 */
export function getAllValidationWarnings(state: TabValidationState): string[] {
  const allWarnings: string[] = []
  
  Object.values(state.warnings).forEach(warnings => {
    allWarnings.push(...warnings)
  })
  
  Object.values(state.fieldStates).forEach(fieldState => {
    allWarnings.push(...fieldState.warnings)
  })
  
  return allWarnings
}

// ===== ACTIVITY UTILITIES =====

/**
 * Converts regular activity to enhanced activity
 */
export function toEnhancedActivity(
  activity: Activity,
  options: {
    dragId?: string
    isEditing?: boolean
    isSelected?: boolean
  } = {}
): EnhancedActivity {
  return {
    ...activity,
    dragId: options.dragId || `activity-${activity.id}-${Date.now()}`,
    isEditing: options.isEditing || false,
    isSelected: options.isSelected || false,
    validation: createTabValidationState(),
    conflicts: []
  }
}

/**
 * Checks for activity time conflicts
 */
export function detectActivityTimeConflicts(
  activity: EnhancedActivity,
  otherActivities: EnhancedActivity[]
): ActivityConflict[] {
  const conflicts: ActivityConflict[] = []
  
  for (const other of otherActivities) {
    if (other.id === activity.id) continue
    
    // Check if activities overlap in time
    const activityStart = new Date(`${activity.itineraryDayId} ${activity.time}`)
    const activityEnd = new Date(activityStart.getTime() + (activity.durationMinutes || 60) * 60000)
    const otherStart = new Date(`${other.itineraryDayId} ${other.time}`)
    const otherEnd = new Date(otherStart.getTime() + (other.durationMinutes || 60) * 60000)
    
    if (activityStart < otherEnd && activityEnd > otherStart) {
      conflicts.push({
        type: 'time_overlap',
        severity: 'high',
        description: `Time overlap with activity: ${other.title}`,
        conflictingActivityId: other.id,
        suggestedResolution: 'Reschedule one of the activities'
      })
    }
  }
  
  return conflicts
}

/**
 * Checks for activity attendee conflicts
 */
export function detectActivityAttendeeConflicts(
  activity: EnhancedActivity,
  otherActivities: EnhancedActivity[]
): ActivityConflict[] {
  const conflicts: ActivityConflict[] = []
  
  for (const other of otherActivities) {
    if (other.id === activity.id) continue
    
    // Check for shared attendees in overlapping time
    const sharedAttendees = activity.attendees.filter(attendee => 
      other.attendees.includes(attendee)
    )
    
    if (sharedAttendees.length > 0) {
      const activityStart = new Date(`${activity.itineraryDayId} ${activity.time}`)
      const activityEnd = new Date(activityStart.getTime() + (activity.durationMinutes || 60) * 60000)
      const otherStart = new Date(`${other.itineraryDayId} ${other.time}`)
      const otherEnd = new Date(otherStart.getTime() + (other.durationMinutes || 60) * 60000)
      
      if (activityStart < otherEnd && activityEnd > otherStart) {
        conflicts.push({
          type: 'participant_conflict',
          severity: 'medium',
          description: `Shared attendees with overlapping activity: ${other.title}`,
          conflictingActivityId: other.id,
          suggestedResolution: 'Remove shared attendees or reschedule'
        })
      }
    }
  }
  
  return conflicts
}

/**
 * Calculates activity duration in minutes
 */
export function calculateActivityDuration(activity: EnhancedActivity): number {
  return activity.durationMinutes || 60
}

/**
 * Formats activity time for display
 */
export function formatActivityTime(activity: EnhancedActivity): string {
  const startTime = activity.time
  const durationMinutes = calculateActivityDuration(activity)
  
  if (!durationMinutes) return startTime
  
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
  const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  
  return `${startTime} - ${endTime}`
}

// ===== PARTICIPANT UTILITIES =====

/**
 * Converts regular participant to enhanced staff participant
 */
export function toEnhancedStaffParticipant(
  participant: TripParticipant,
  user: User
): EnhancedStaffParticipant {
  return {
    ...participant,
    user,
    availability: createEmptyAvailability(),
    rolePermissions: {},
    workload: createEmptyWorkload(),
    isSelected: false
  }
}

/**
 * Creates empty availability status
 */
export function createEmptyAvailability(): ParticipantAvailability {
  return {
    status: 'unknown',
    conflicts: [],
    lastChecked: new Date(),
    confidence: 0
  }
}

/**
 * Creates empty workload information
 */
export function createEmptyWorkload() {
  return {
    currentTrips: 0,
    upcomingTrips: 0,
    workloadPercentage: 0,
    recommendations: []
  }
}

/**
 * Checks participant availability conflicts
 */
export function checkParticipantAvailability(
  participant: EnhancedStaffParticipant,
  startDate: Date,
  endDate: Date
): AvailabilityConflict[] {
  // This would typically integrate with calendar systems
  // For now, return empty array
  return []
}

/**
 * Calculates participant workload
 */
export function calculateParticipantWorkload(
  participant: EnhancedStaffParticipant,
  allTrips: any[]
): number {
  // Calculate workload based on active trips and assignments
  return participant.workload.workloadPercentage
}

// ===== DRAG AND DROP UTILITIES =====

/**
 * Creates initial drag and drop state
 */
export function createInitialDragDropState(): DragDropState {
  return {
    draggedActivity: null,
    dropTarget: null,
    isDragging: false,
    dragPreview: null
  }
}

/**
 * Validates drop target for activity
 */
export function validateDropTarget(
  draggedActivity: EnhancedActivity,
  targetDayId: string,
  targetPosition: number,
  allActivities: EnhancedActivity[]
): boolean {
  // Check if drop would create conflicts
  const targetDayActivities = allActivities.filter(a => a.itineraryDayId === targetDayId)
  
  // Add more sophisticated validation logic here
  return true
}

/**
 * Calculates new activity time based on drop position
 */
export function calculateNewActivityTime(
  position: number,
  targetDayActivities: EnhancedActivity[]
): string {
  // Calculate appropriate time based on position and existing activities
  const baseHour = 8 + Math.floor(position / 2) // Starting at 8 AM, 30-min slots
  const minutes = (position % 2) * 30
  
  return `${baseHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// ===== CONFLICT DETECTION UTILITIES =====

/**
 * Creates empty conflict detection result
 */
export function createEmptyConflictDetectionResult(): ConflictDetectionResult {
  return {
    conflicts: [],
    overallSeverity: 'none',
    suggestedResolutions: [],
    metadata: {
      detectionTime: new Date(),
      detectionDuration: 0,
      rulesApplied: [],
      confidence: 1
    }
  }
}

/**
 * Gets conflict severity color
 */
export function getConflictSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low': return 'text-yellow-600'
    case 'medium': return 'text-orange-600'
    case 'high': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

/**
 * Gets conflict severity icon
 */
export function getConflictSeverityIcon(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low': return 'AlertCircle'
    case 'medium': return 'AlertTriangle'
    case 'high': return 'XCircle'
    default: return 'Info'
  }
}

/**
 * Filters conflicts by type
 */
export function filterConflictsByType(
  conflicts: DetectedConflict[],
  type: ConflictType
): DetectedConflict[] {
  return conflicts.filter(conflict => conflict.type === type)
}

/**
 * Groups conflicts by severity
 */
export function groupConflictsBySeverity(
  conflicts: DetectedConflict[]
): Record<'low' | 'medium' | 'high', DetectedConflict[]> {
  return conflicts.reduce((groups, conflict) => {
    groups[conflict.severity].push(conflict)
    return groups
  }, { low: [], medium: [], high: [] } as Record<'low' | 'medium' | 'high', DetectedConflict[]>)
}

// ===== ASYNC VALIDATION UTILITIES =====

/**
 * Creates async validation state
 */
export function createAsyncValidationState(): AsyncValidationState {
  return {
    isLoading: false,
    result: null,
    lastValidated: null,
    error: null
  }
}

/**
 * Debounces validation function
 */
export function debounceValidation<T extends any[]>(
  validationFn: (...args: T) => Promise<ValidationResult>,
  delay: number = 300
): (...args: T) => Promise<ValidationResult> {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: T): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await validationFn(...args)
          resolve(result)
        } catch (error) {
          resolve({
            isValid: false,
            errors: [`Validation error: ${error}`],
            warnings: []
          })
        }
      }, delay)
    })
  }
}

// ===== FORM DATA UTILITIES =====

/**
 * Deep clones form data
 */
export function cloneFormData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

/**
 * Compares form data for changes
 */
export function hasFormDataChanged<T>(original: T, current: T): boolean {
  return JSON.stringify(original) !== JSON.stringify(current)
}

/**
 * Gets changed fields in form data
 */
export function getChangedFields<T extends Record<string, any>>(
  original: T,
  current: T
): Array<keyof T> {
  const changedFields: Array<keyof T> = []
  
  for (const key in current) {
    if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
      changedFields.push(key)
    }
  }
  
  return changedFields
}

/**
 * Resets form field to original value
 */
export function resetFormField<T extends Record<string, any>>(
  formData: T,
  fieldName: keyof T,
  originalValue: any
): T {
  return {
    ...formData,
    [fieldName]: originalValue
  }
}