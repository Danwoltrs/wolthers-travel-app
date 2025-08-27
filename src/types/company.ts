export type CompanyType = 'buyer' | 'supplier' | 'service_provider'

export type RoleType = 'owner' | 'executive' | 'manager' | 'staff' | 'consultant'

export type ContactMethod = 'email' | 'phone' | 'whatsapp' | 'in_person'

export type DocumentCategory = 'contract' | 'presentation' | 'report' | 'sample' | 'price_list' | 'certificate' | 'correspondence' | 'general'

export type AccessLevel = 'public' | 'internal' | 'restricted' | 'confidential'

export type PeriodType = 'month' | 'quarter' | 'year' | 'all_time'

export type ActionType = 'view' | 'download' | 'upload' | 'edit' | 'delete' | 'share'

export interface Company {
  id: string
  name: string
  email: string | null
  phone: string | null
  website: string | null
  company_type: CompanyType
  company_subtype: string | null
  legacy_id: string | null
  trip_count: number
  total_cost_usd: number
  last_visit_date: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  notes: string | null
  is_active: boolean
  tags: string[]
  industry_certifications: string[]
  created_at: string
  updated_at: string
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
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CompanyStaff {
  id: string
  company_id: string
  location_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  position: string | null
  department: string | null
  role_type: RoleType
  is_primary_contact: boolean
  is_decision_maker: boolean
  preferred_contact_method: ContactMethod
  language_preference: string
  timezone: string | null
  linkedin_url: string | null
  twitter_handle: string | null
  notes: string | null
  photo_url: string | null
  is_active: boolean
  last_contact_date: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Relations
  company?: Company
  location?: CompanyLocation
}

export interface CompanyDocument {
  id: string
  company_id: string
  trip_id: string | null
  meeting_id: string | null
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  mime_type: string | null
  parent_folder_id: string | null
  is_folder: boolean
  folder_name: string | null
  folder_path: string | null
  document_category: DocumentCategory
  document_year: number | null
  access_level: AccessLevel
  visible_to_company: boolean
  visible_to_participants: boolean
  description: string | null
  tags: string[]
  version_number: number
  is_latest_version: boolean
  previous_version_id: string | null
  download_count: number
  last_accessed_at: string | null
  last_accessed_by: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Relations
  company?: Company
  children?: CompanyDocument[] // For folder structure
}

export interface CompanyStatistics {
  id: string
  company_id: string
  period_type: PeriodType
  period_year: number | null
  period_month: number | null
  period_quarter: number | null
  trip_count: number
  meeting_count: number
  unique_staff_count: number
  total_travel_cost: number
  total_meeting_cost: number
  total_hotel_cost: number
  total_flight_cost: number
  currency: string
  document_count: number
  note_count: number
  last_interaction_date: string | null
  interaction_score: number
  top_visitors: TopVisitor[]
  heatmap_data: any // JSON data for heatmap visualization
  calculated_at: string
  expires_at: string | null
  // Relations
  company?: Company
}

export interface TopVisitor {
  user_id: string
  name: string
  trip_count: number
}

export interface CompanyAccessLog {
  id: string
  company_id: string
  user_id: string
  document_id: string | null
  action_type: ActionType
  action_details: any // JSON object with additional details
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// View/Display interfaces
export interface CompanyCardData extends Company {
  primary_location?: CompanyLocation
  staff_count?: number
  document_count?: number
  recent_trips?: Array<{
    id: string
    title: string
    start_date: string
    end_date: string
  }>
}

export interface CompanyDetailView extends Company {
  locations: CompanyLocation[]
  staff: CompanyStaff[]
  statistics: CompanyStatistics[]
  recent_documents: CompanyDocument[]
}

// Form/Input interfaces
export interface CreateCompanyInput {
  name: string
  email?: string
  phone?: string
  website?: string
  company_type: CompanyType
  company_subtype?: string
  notes?: string
  tags?: string[]
  industry_certifications?: string[]
}

export interface CreateCompanyStaffInput {
  company_id: string
  location_id?: string
  full_name: string
  email?: string
  phone?: string
  whatsapp?: string
  position?: string
  department?: string
  role_type?: RoleType
  is_primary_contact?: boolean
  is_decision_maker?: boolean
  preferred_contact_method?: ContactMethod
  notes?: string
}

export interface CompanyFilters {
  search?: string
  company_type?: CompanyType[]
  is_active?: boolean
  has_recent_trips?: boolean
  min_trip_count?: number
  max_trip_count?: number
  tags?: string[]
  certifications?: string[]
  location_country?: string[]
  sort_by?: 'name' | 'last_visit' | 'trip_count' | 'total_cost'
  sort_order?: 'asc' | 'desc'
}

export interface CompanyStatisticsFilters {
  company_id: string
  period_type: PeriodType
  year?: number
  month?: number
  quarter?: number
}

// Document folder structure
export interface DocumentFolder {
  id: string
  name: string
  path: string
  parent_id: string | null
  children: DocumentFolder[]
  documents: CompanyDocument[]
  document_count: number
  is_expanded?: boolean // For UI state
}

// Heatmap data structure
export interface CompanyHeatmapData {
  company_id: string
  company_name: string
  year: number
  months: Array<{
    month: number
    month_name: string
    trip_count: number
    meeting_count: number
    cost: number
    intensity: number // 0-4 for visual representation
  }>
  total_trips: number
  total_cost: number
}

// Legacy Company Integration Types
export interface LegacyCompanyResult {
  id: number
  name: string
  fantasyName?: string
  city?: string
  state?: string
  country: string
  businessType?: string
  group1?: string
  group2?: string
  address: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    country: string
    postalCode?: string
  }
  contacts: {
    phone1?: string
    phone2?: string
    email?: string
    contractEmail?: string
  }
  fullAddress: string
  displayName: string
  location: string
}

export interface CompanyContact {
  id: string
  company_id: string
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  title?: string
  department?: string
  is_primary: boolean
  contact_type: 'business' | 'technical' | 'financial' | 'logistics'
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateFromLegacyInput {
  legacyClientId: number
  pic?: {
    name: string
    email: string
    whatsapp: string
    title: string
  }
  additionalLocations?: Array<{
    name: string
    address: string
    isHeadquarters?: boolean
  }>
  companyOverrides?: {
    name?: string
    fantasyName?: string
    category?: string
    subcategories?: string[]
  }
}

export interface UnifiedCompanyCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCompanyCreated?: (company: any) => void
  companyType?: 'buyer' | 'supplier'
  initialSearch?: string
  context?: 'dashboard' | 'trip_creation' | 'standalone'
}

export interface NavigationUrls {
  google_maps: string
  apple_maps: string
  waze: string
}