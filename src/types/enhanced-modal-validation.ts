/**
 * Enhanced Modal Validation Types
 * 
 * Comprehensive validation types for the enhanced Quick View modal editing workflows.
 * Provides type-safe validation schemas, error handling, and form validation utilities.
 */

import type { 
  EnhancedModalTab, 
  TabValidationState,
  FieldValidationState,
  EnhancedActivity,
  EnhancedStaffParticipant,
  EnhancedCompanyParticipant,
  EnhancedVehicleAssignment,
  ActivityConflict,
  AvailabilityConflict
} from './enhanced-modal'

// ===== VALIDATION SCHEMA TYPES =====

/**
 * Base validation rule
 */
export interface ValidationRule {
  /** Rule identifier */
  id: string
  /** Rule type */
  type: ValidationRuleType
  /** Rule configuration */
  config: ValidationRuleConfig
  /** Error message template */
  errorMessage: string
  /** Warning message template */
  warningMessage?: string
  /** Rule priority */
  priority: 'low' | 'medium' | 'high'
}

/**
 * Validation rule types
 */
export type ValidationRuleType = 
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'phone'
  | 'date'
  | 'dateRange'
  | 'time'
  | 'timeRange'
  | 'number'
  | 'numberRange'
  | 'custom'
  | 'uniqueIn'
  | 'dependsOn'
  | 'conditional'

/**
 * Validation rule configuration
 */
export interface ValidationRuleConfig {
  /** Minimum value/length */
  min?: number
  /** Maximum value/length */
  max?: number
  /** Regular expression pattern */
  pattern?: string
  /** Custom validation function */
  customValidator?: (value: any, context: ValidationContext) => ValidationResult
  /** Fields this rule depends on */
  dependencies?: string[]
  /** Condition for conditional validation */
  condition?: (context: ValidationContext) => boolean
  /** Unique constraint scope */
  uniqueScope?: string
  /** Additional configuration parameters */
  params?: Record<string, any>
}

/**
 * Validation context
 */
export interface ValidationContext {
  /** Current field value */
  fieldValue: any
  /** All form data */
  formData: Record<string, any>
  /** Current tab */
  currentTab: EnhancedModalTab
  /** Validation mode */
  mode: ValidationMode
  /** Additional context data */
  context: Record<string, any>
}

/**
 * Validation modes
 */
export type ValidationMode = 'onChange' | 'onBlur' | 'onSubmit' | 'progressive' | 'bulk'

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean
  /** Validation errors */
  errors: string[]
  /** Validation warnings */
  warnings: string[]
  /** Additional validation metadata */
  metadata?: Record<string, any>
}

// ===== FIELD-SPECIFIC VALIDATION SCHEMAS =====

/**
 * Activity validation schema
 */
export interface ActivityValidationSchema {
  /** Activity title validation */
  title: ValidationRule[]
  /** Activity time validation */
  time: ValidationRule[]
  /** Activity duration validation */
  durationMinutes: ValidationRule[]
  /** Activity type validation */
  type: ValidationRule[]
  /** Location validation */
  location: ValidationRule[]
  /** Attendees validation */
  attendees: ValidationRule[]
  /** Description validation */
  description: ValidationRule[]
  /** Custom activity validations */
  custom: ValidationRule[]
}

/**
 * Participant validation schema
 */
export interface ParticipantValidationSchema {
  /** Participant role validation */
  role: ValidationRule[]
  /** Start date validation */
  startDate: ValidationRule[]
  /** End date validation */
  endDate: ValidationRule[]
  /** Permissions validation */
  permissions: ValidationRule[]
  /** Availability validation */
  availability: ValidationRule[]
  /** Contact information validation */
  contact: ValidationRule[]
}

/**
 * Vehicle assignment validation schema
 */
export interface VehicleValidationSchema {
  /** Vehicle selection validation */
  vehicle: ValidationRule[]
  /** Driver assignment validation */
  driver: ValidationRule[]
  /** Assignment dates validation */
  assignmentDates: ValidationRule[]
  /** Capacity validation */
  capacity: ValidationRule[]
  /** Requirements validation */
  requirements: ValidationRule[]
  /** Status validation */
  status: ValidationRule[]
}

/**
 * Logistics validation schema
 */
export interface LogisticsValidationSchema {
  /** Transportation validation */
  transportation: ValidationRule[]
  /** Equipment validation */
  equipment: ValidationRule[]
  /** Accommodation validation */
  accommodation: ValidationRule[]
  /** Cost validation */
  cost: ValidationRule[]
}

// ===== COMPLEX VALIDATION TYPES =====

/**
 * Cross-field validation rule
 */
export interface CrossFieldValidationRule {
  /** Rule identifier */
  id: string
  /** Fields involved in validation */
  fields: string[]
  /** Validation function */
  validator: (values: Record<string, any>, context: ValidationContext) => ValidationResult
  /** Error message template */
  errorMessage: string
  /** Rule priority */
  priority: 'low' | 'medium' | 'high'
}

/**
 * Business logic validation rule
 */
export interface BusinessLogicValidationRule {
  /** Rule identifier */
  id: string
  /** Rule description */
  description: string
  /** Business rule validator */
  validator: (formData: any, context: ValidationContext) => ValidationResult
  /** When this rule should be applied */
  applicableWhen: (context: ValidationContext) => boolean
  /** Error severity */
  severity: 'error' | 'warning' | 'info'
}

/**
 * Async validation rule for external checks
 */
export interface AsyncValidationRule {
  /** Rule identifier */
  id: string
  /** Async validator function */
  validator: (value: any, context: ValidationContext) => Promise<ValidationResult>
  /** Debounce delay in milliseconds */
  debounceMs: number
  /** Cache duration in milliseconds */
  cacheDurationMs?: number
  /** Loading message */
  loadingMessage?: string
  /** Timeout in milliseconds */
  timeoutMs?: number
}

// ===== VALIDATION STATE MANAGEMENT =====

/**
 * Form validation state
 */
export interface FormValidationState {
  /** Overall form validity */
  isValid: boolean
  /** Whether validation is in progress */
  isValidating: boolean
  /** Tab-specific validation states */
  tabs: Record<EnhancedModalTab, TabValidationState>
  /** Cross-field validation results */
  crossFieldResults: Record<string, ValidationResult>
  /** Business logic validation results */
  businessLogicResults: Record<string, ValidationResult>
  /** Async validation states */
  asyncValidationStates: Record<string, AsyncValidationState>
}

/**
 * Async validation state
 */
export interface AsyncValidationState {
  /** Whether async validation is in progress */
  isLoading: boolean
  /** Validation result */
  result: ValidationResult | null
  /** Last validation timestamp */
  lastValidated: Date | null
  /** Validation error */
  error: string | null
}

/**
 * Validation batch for bulk operations
 */
export interface ValidationBatch {
  /** Batch identifier */
  id: string
  /** Items to validate */
  items: string[]
  /** Validation rules to apply */
  rules: ValidationRule[]
  /** Batch validation result */
  result: BatchValidationResult
  /** Batch progress */
  progress: ValidationProgress
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  /** Overall batch validity */
  isValid: boolean
  /** Individual item results */
  itemResults: Record<string, ValidationResult>
  /** Batch-level errors */
  batchErrors: string[]
  /** Batch-level warnings */
  batchWarnings: string[]
}

/**
 * Validation progress tracking
 */
export interface ValidationProgress {
  /** Total items to validate */
  total: number
  /** Completed validations */
  completed: number
  /** Failed validations */
  failed: number
  /** Progress percentage */
  percentage: number
  /** Estimated completion time */
  estimatedCompletion?: Date
}

// ===== CONFLICT DETECTION TYPES =====

/**
 * Conflict detection configuration
 */
export interface ConflictDetectionConfig {
  /** Types of conflicts to check */
  conflictTypes: ConflictType[]
  /** Detection mode */
  mode: ConflictDetectionMode
  /** Detection sensitivity */
  sensitivity: 'low' | 'medium' | 'high'
  /** Real-time detection enabled */
  realTimeEnabled: boolean
}

/**
 * Conflict types
 */
export type ConflictType = 
  | 'time_overlap'
  | 'resource_conflict'
  | 'location_conflict'
  | 'participant_availability'
  | 'vehicle_availability'
  | 'equipment_conflict'
  | 'budget_conflict'
  | 'policy_violation'

/**
 * Conflict detection modes
 */
export type ConflictDetectionMode = 'strict' | 'permissive' | 'advisory'

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
  /** Conflicts found */
  conflicts: DetectedConflict[]
  /** Overall conflict severity */
  overallSeverity: 'none' | 'low' | 'medium' | 'high'
  /** Suggested resolutions */
  suggestedResolutions: ConflictResolution[]
  /** Detection metadata */
  metadata: ConflictDetectionMetadata
}

/**
 * Detected conflict
 */
export interface DetectedConflict {
  /** Conflict identifier */
  id: string
  /** Conflict type */
  type: ConflictType
  /** Conflict severity */
  severity: 'low' | 'medium' | 'high'
  /** Conflict description */
  description: string
  /** Affected entities */
  affectedEntities: string[]
  /** Conflict details */
  details: Record<string, any>
  /** Auto-resolvable */
  isAutoResolvable: boolean
}

/**
 * Conflict resolution
 */
export interface ConflictResolution {
  /** Resolution identifier */
  id: string
  /** Conflict this resolves */
  conflictId: string
  /** Resolution type */
  type: 'automatic' | 'user_action' | 'ignore'
  /** Resolution description */
  description: string
  /** Resolution action */
  action: ConflictResolutionAction
  /** Impact of resolution */
  impact: ResolutionImpact
}

/**
 * Conflict resolution action
 */
export interface ConflictResolutionAction {
  /** Action type */
  type: 'reschedule' | 'reassign' | 'modify' | 'delete' | 'approve_override'
  /** Action parameters */
  parameters: Record<string, any>
  /** Affected fields */
  affectedFields: string[]
  /** Rollback possible */
  isRollbackable: boolean
}

/**
 * Resolution impact
 */
export interface ResolutionImpact {
  /** Impact severity */
  severity: 'none' | 'low' | 'medium' | 'high'
  /** Impact description */
  description: string
  /** Affected entities */
  affectedEntities: string[]
  /** Side effects */
  sideEffects: string[]
}

/**
 * Conflict detection metadata
 */
export interface ConflictDetectionMetadata {
  /** Detection timestamp */
  detectionTime: Date
  /** Detection duration */
  detectionDuration: number
  /** Rules applied */
  rulesApplied: string[]
  /** Detection confidence */
  confidence: number
}

// ===== VALIDATION PRESETS =====

/**
 * Validation preset for different trip types
 */
export interface ValidationPreset {
  /** Preset identifier */
  id: string
  /** Preset name */
  name: string
  /** Preset description */
  description: string
  /** Applicable trip types */
  tripTypes: string[]
  /** Validation schemas */
  schemas: ValidationSchemaSet
  /** Conflict detection config */
  conflictDetection: ConflictDetectionConfig
  /** Custom business rules */
  businessRules: BusinessLogicValidationRule[]
}

/**
 * Complete validation schema set
 */
export interface ValidationSchemaSet {
  /** Activity validation schema */
  activity: ActivityValidationSchema
  /** Participant validation schema */
  participant: ParticipantValidationSchema
  /** Vehicle validation schema */
  vehicle: VehicleValidationSchema
  /** Logistics validation schema */
  logistics: LogisticsValidationSchema
  /** Cross-field validation rules */
  crossField: CrossFieldValidationRule[]
  /** Async validation rules */
  async: AsyncValidationRule[]
}

// ===== VALIDATION UTILITIES =====

/**
 * Validation error formatter
 */
export interface ValidationErrorFormatter {
  /** Format single error */
  formatError: (error: string, context: ValidationContext) => string
  /** Format multiple errors */
  formatErrors: (errors: string[], context: ValidationContext) => string[]
  /** Format field-specific errors */
  formatFieldErrors: (fieldErrors: Record<string, string[]>) => Record<string, string[]>
  /** Format cross-field errors */
  formatCrossFieldErrors: (errors: Record<string, ValidationResult>) => string[]
}

/**
 * Validation debouncer configuration
 */
export interface ValidationDebouncerConfig {
  /** Debounce delay in milliseconds */
  delay: number
  /** Maximum wait time */
  maxWait: number
  /** Leading edge execution */
  leading: boolean
  /** Trailing edge execution */
  trailing: boolean
}

/**
 * Validation performance metrics
 */
export interface ValidationPerformanceMetrics {
  /** Total validation time */
  totalTime: number
  /** Average validation time per field */
  averageTimePerField: number
  /** Slowest validations */
  slowestValidations: Array<{ field: string; time: number }>
  /** Validation cache hit rate */
  cacheHitRate: number
  /** Number of validations performed */
  validationCount: number
}