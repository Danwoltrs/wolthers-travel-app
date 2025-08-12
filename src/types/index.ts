export enum UserRole {
  GLOBAL_ADMIN = "global_admin",
  WOLTHERS_STAFF = "wolthers_staff",
  WOLTHERS_FINANCE = "wolthers_finance",
  COMPANY_ADMIN = "company_admin",
  VISITOR = "visitor",
  VISITOR_ADMIN = "visitor_admin",
  HOST = "host",
  DRIVER = "driver",
  GUEST = "guest"
}

export enum TripStatus {
  PLANNING = "planning",
  CONFIRMED = "confirmed",
  ONGOING = "ongoing",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum VehicleStatus {
  ACTIVE = "active",
  MAINTENANCE = "maintenance",
  INACTIVE = "inactive"
}

export enum ExpenseStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REIMBURSED = "reimbursed"
}

export enum AuthMethod {
  EMAIL_OTP = "email_otp",
  MICROSOFT = "microsoft",
  PASSWORD = "password"
}

export enum AuthStatus {
  UNAUTHENTICATED = "unauthenticated",
  AUTHENTICATING = "authenticating",
  AUTHENTICATED = "authenticated",
  EXPIRED = "expired",
  ERROR = "error"
}

export enum ClientType {
  ROASTERS = "roasters",
  DEALERS_IMPORTERS = "dealers_importers",
  EXPORTERS_COOPS = "exporters_coops",
  SERVICE_PROVIDERS = "service_providers"
}

/**
 * Trip card display status - simplified view for dashboard
 */
export type TripCardStatus = 'upcoming' | 'ongoing' | 'completed' | 'planning' | 'confirmed' | 'cancelled'

/**
 * User entity representing system users including staff, drivers, and company users
 */
export interface User {
  /** Unique identifier for the user */
  id: string
  /** User's email address - must be unique */
  email: string
  /** User's full display name */
  fullName: string
  /** Optional company association for company users */
  companyId?: string
  /** User's role determining permissions and access level */
  role: UserRole
  /** Custom permissions overrides */
  permissions: Record<string, boolean>
  /** Last login timestamp */
  lastLogin?: Date
  /** Whether the user account is active */
  isActive: boolean
  /** Account creation timestamp */
  createdAt: Date
}

/**
 * Company entity representing client organizations
 */
export interface Company {
  /** Unique identifier for the company */
  id: string
  /** Official company name */
  name: string
  /** Preferred display name or brand name */
  fantasyName?: string
  /** Primary contact email */
  email?: string
  /** Primary contact phone number */
  phone?: string
  /** Company website URL */
  website?: string
  /** Client type category for the company */
  clientType: ClientType
  /** Total travel costs incurred this year */
  totalTripCostsThisYear: number
  /** Number of employees/staff */
  staffCount?: number
  /** Additional notes about the company */
  notes?: string
  /** Whether the company is active */
  isActive: boolean
  /** Company creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
}

export interface CompanyLocation {
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

/**
 * Core trip entity with full trip information
 */
export interface Trip {
  /** Unique identifier for the trip */
  id: string
  /** Trip title/name */
  title: string
  /** Detailed trip description */
  description?: string
  /** Brief subject line */
  subject?: string
  /** Trip start date */
  startDate: Date
  /** Trip end date */
  endDate: Date
  /** Current trip status */
  status: TripStatus
  /** ID of user who created the trip */
  createdBy: string
  /** Estimated budget in USD */
  estimatedBudget?: number
  /** Actual cost incurred in USD */
  actualCost: number
  /** Optional trip code for tracking */
  tripCode?: string
  /** Whether this is a convention/conference trip */
  isConvention: boolean
  /** Parent trip ID for branched trips */
  parentTripId?: string
  /** Date when trip was branched from parent */
  branchDate?: Date
  /** Additional metadata */
  metadata: Record<string, any>
  /** Public access code for guest access */
  accessCode?: string
  /** Trip creation timestamp */
  createdAt: Date
}

export interface TripParticipant {
  id: string
  tripId: string
  userId?: string
  companyId?: string
  role: string
  startDate: Date
  endDate: Date
  permissions: Record<string, boolean>
}

/**
 * Vehicle entity for fleet management
 */
export interface Vehicle {
  /** Unique identifier for the vehicle */
  id: string
  /** Vehicle manufacturer */
  make: string
  /** Vehicle model */
  model: string
  /** Manufacturing year */
  year: number
  /** Vehicle color */
  color?: string
  /** License plate number - must be unique */
  licensePlate: string
  /** Vehicle identification number */
  vin?: string
  /** Current odometer reading */
  currentMileage: number
  /** Date of last service */
  lastServiceDate?: Date
  /** Next scheduled service date */
  nextServiceDue?: Date
  /** Insurance expiry date */
  insuranceExpiry?: Date
  /** Current operational status */
  status: VehicleStatus
  /** Additional notes about the vehicle */
  notes?: string
  /** Vehicle registration timestamp */
  createdAt: Date
}

/**
 * Activity within a trip itinerary day
 */
export interface Activity {
  /** Unique identifier for the activity */
  id: string
  /** ID of the itinerary day this belongs to */
  itineraryDayId: string
  /** Scheduled time in HH:MM format */
  time: string
  /** Type of activity */
  type: 'meeting' | 'visit' | 'travel' | 'meal' | 'hotel' | 'conference' | 'convention'
  /** Activity title */
  title: string
  /** Optional activity description */
  description?: string
  /** Associated company ID if applicable */
  companyId?: string
  /** Location ID if applicable */
  locationId?: string
  /** Expected duration in minutes */
  durationMinutes?: number
  /** List of attendee user IDs */
  attendees: string[]
  /** Current activity status */
  status: string
  /** Confirmation status from attendees */
  confirmationStatus: string
  /** Additional notes */
  notes?: string
  /** External event source information */
  externalSource?: {
    name: string
    id?: string
    url?: string
    registrationUrl?: string
    confidence?: number
  }
  /** Detailed location information */
  location?: {
    name?: string
    address?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    city?: string
    country?: string
  }
  /** Activity creation timestamp */
  createdAt: Date
}

export interface ItineraryDay {
  id: string
  tripId: string
  date: Date
  notes?: string
  activities: Activity[]
  createdAt: Date
}

/**
 * Trip card interface for dashboard display
 * Contains essential trip information for card view
 */
export interface TripCard {
  id: string
  title: string
  subject: string
  client: Company[]
  guests: { companyId: string; names: string[] }[]
  wolthersStaff: User[]
  vehicles: Vehicle[]
  drivers: User[]
  startDate: Date
  endDate: Date
  duration: number
  status: TripCardStatus
  progress?: number
  notesCount?: number
  visitCount?: number
  accessCode?: string
  
  // Draft-specific properties
  isDraft?: boolean
  currentStep?: number
  completionPercentage?: number
  draftInformation?: {
    lastAccessed?: Date
    expiresAt?: Date
  }
}

export interface MeetingNote {
  id: string
  activityId: string
  companyId: string
  userId: string
  content?: string
  noteType: 'text' | 'image' | 'voice' | 'ocr'
  attachments: string[]
  ocrContent?: string
  aiSummary?: string
  keywords: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
  actionItems: string[]
  createdAt: Date
}

export interface Expense {
  id: string
  tripId: string
  userId: string
  category: string
  amount: number
  description?: string
  receiptImage?: string
  creditCardLast4?: string
  cardHolderName?: string
  isPersonalCard: boolean
  merchantName?: string
  expenseDate: Date
  status: ExpenseStatus
  createdAt: Date
}

/**
 * NextAuth.js session extension
 * Extends the default session to include additional user properties
 */
export interface AuthUser {
  id: string
  name?: string | null
  full_name?: string | null
  email?: string | null
  image?: string | null
  role?: UserRole
  companyId?: string
  permissions?: Record<string, boolean>
  azure_id?: string
  preferred_username?: string
  phone?: string | null
  whatsapp?: string | null
  timezone?: string | null
  last_login_at?: string | null
  last_login_timezone?: string | null
  last_login_provider?: string | null
  last_profile_update?: string | null
  user_type?: string
  is_global_admin?: boolean
  can_view_all_trips?: boolean
  can_view_company_trips?: boolean
  microsoft_oauth_id?: string | null
  company_name?: string | null
  notification_preferences?: {
    email?: boolean
    whatsapp?: boolean
    in_app?: boolean
  }
  profile_picture_url?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Extended NextAuth session
 */
export interface AuthSession {
  user: AuthUser
  expires: string
}

/**
 * User profile stored in database for NextAuth integration
 */
export interface UserProfile {
  user_id: string
  email: string
  name?: string
  role: UserRole
  company_id?: string
  permissions: Record<string, boolean>
  azure_id?: string
  preferred_username?: string
  created_at: string
  updated_at?: string
}

/**
 * Auth provider information
 */
export interface AuthProvider {
  id: string
  name: string
  type: 'oauth' | 'email'
  signinUrl: string
  callbackUrl: string
}

/**
 * Authentication form interfaces for auth components
 */

/**
 * Login form data
 */
export interface LoginFormData {
  email: string
  password?: string
  rememberMe?: boolean
  authMethod: AuthMethod
}

/**
 * OTP verification data
 */
export interface OTPVerificationData {
  email: string
  otp: string
  purpose: 'login' | 'password_reset' | '2fa'
}

/**
 * Password reset request data
 */
export interface PasswordResetData {
  email: string
  token?: string
  newPassword?: string
}

/**
 * Authentication response from API
 */
export interface AuthResponse {
  success: boolean
  message?: string
  token?: string
  user?: AuthUser
  requiresOTP?: boolean
  otpSent?: boolean
  expiresAt?: string
}

/**
 * Authentication error
 */
export interface AuthError {
  code: string
  message: string
  field?: string
  details?: Record<string, any>
}

/**
 * Authentication context state
 */
export interface AuthContextState {
  user: AuthUser | null
  status: AuthStatus
  isLoading: boolean
  error: AuthError | null
  signIn: (credentials: LoginFormData) => Promise<AuthResponse>
  signOut: () => Promise<void>
  verifyOTP: (data: OTPVerificationData) => Promise<AuthResponse>
  resetPassword: (data: PasswordResetData) => Promise<AuthResponse>
  clearError: () => void
}