# Backend API Implementation Summary - Meetings & Agenda Module

## Overview
This document summarizes the comprehensive backend API implementation for the enhanced Meetings & Agenda module, including company location integration, cost tracking system, and progressive save enhancements.

## Database Enhancements

### Migration Created
**File**: `/supabase/migrations/20250814_add_company_locations_and_cost_enhancements.sql`

#### New Tables
1. **`company_locations`** - Physical locations for companies that can host meetings
   - Full address information with geocoding support
   - Meeting facilities metadata (capacity, presentation facilities, catering)
   - Primary location flags and meeting capability flags

#### Enhanced Tables
1. **`trip_meetings`** - Enhanced with cost tracking and company location support
   - `cost_per_person` (JSONB) - Per-person cost breakdowns
   - `cost_breakdown` (JSONB) - Cost categorization and metadata
   - `total_estimated_cost` (DECIMAL) - Auto-calculated total cost
   - `company_location_id` (UUID) - Reference to company locations

2. **`trip_flights`** - Enhanced with detailed cost tracking
   - `cost_per_person` (JSONB) - Per-person flight cost breakdowns
   - `cost_breakdown` (JSONB) - Flight cost categorization

3. **`trip_hotels`** - Enhanced with detailed cost tracking
   - `cost_per_person` (JSONB) - Per-person hotel cost breakdowns
   - `cost_breakdown` (JSONB) - Hotel cost categorization

#### Database Functions
1. **`get_companies_with_locations()`** - Optimized query for company dropdown data
2. **`calculate_meeting_total_cost(JSONB)`** - Auto-calculate total costs from per-person data

#### Triggers & Automation
- Auto-update total cost when per-person costs change
- Standard updated_at triggers for all new tables
- Comprehensive RLS policies for data security

## API Endpoints Implemented

### 1. Company Location APIs

#### GET `/api/companies/with-locations`
**Purpose**: Fetch companies with location counts and primary location details for dropdown selection
**Authentication**: Required (cookie or Bearer token)
**Response**: 
```typescript
{
  companies: CompanyWithLocations[]
  total: number
}
```

#### GET `/api/companies/[companyId]/locations`
**Purpose**: Fetch all locations for a specific company
**Authentication**: Required
**Parameters**: 
- `companyId` (path parameter)
- `meeting_only` (optional query param, default: true)
**Response**:
```typescript
{
  company: CompanyInfo
  locations: CompanyLocation[]
  total: number
  total_all_locations: number
}
```

#### GET `/api/company-locations/[locationId]`
**Purpose**: Fetch detailed information for a specific location (for auto-population)
**Authentication**: Required
**Parameters**: `locationId` (path parameter)
**Response**:
```typescript
{
  location: CompanyLocation & {
    companies: CompanyInfo
    full_address: string
    has_meeting_facilities: boolean
    suitable_for_presentations: boolean
    suitable_for_catering: boolean
  }
}
```

### 2. Cost Calculation API

#### POST `/api/meetings/cost-calculation`
**Purpose**: Calculate meeting costs with per-person breakdowns and validation
**Authentication**: Required
**Request Body**:
```typescript
{
  eventType: 'flight' | 'hotel' | 'meeting' | 'business_meeting' | 'presentation' | 'lunch' | 'dinner'
  participants: Array<{id: string, name: string, type: string}>
  costBreakdown: {[participantId]: {meals?: number, transport?: number, ...}}
  currency?: string
  notes?: string
}
```
**Response**: Complete cost calculation with database-ready format

### 3. Enhanced Progressive Save API

#### POST `/api/trips/progressive-save` (Enhanced)
**Enhancements Made**:
- Support for `costPerPerson`, `costBreakdown`, `costCurrency` in meetings, flights, hotels
- Support for `companyLocationId` in meetings for company location association
- Backward compatibility maintained with existing trip creation flow
- Enhanced error handling and validation for cost data

### 4. Bulk Calendar Operations API

#### POST `/api/calendar-events/bulk`
**Purpose**: Perform bulk operations on calendar events (create/update/delete)
**Authentication**: Required
**Request Body**:
```typescript
{
  operation: 'create' | 'update' | 'delete'
  tripId: string
  events: EnhancedCalendarEvent[]
}
```
**Response**: Detailed results for each event operation

## TypeScript Enhancements

### Database Types Updated
**File**: `/src/types/database.ts`
- Added `company_locations` table types
- Enhanced `trip_meetings`, `trip_flights`, `trip_hotels` with cost tracking fields
- Added `meeting_attendees` table types
- Complete Insert/Update/Row type definitions

### API Response Types Created
**File**: `/src/types/meetings-agenda-api.ts`
- `CompanyWithLocations`, `CompanyLocation` interfaces
- `CostCalculationRequest`, `CostCalculationResponse` interfaces
- `EnhancedCalendarEvent` with cost tracking and company association
- `BulkCalendarEventRequest`, `BulkCalendarEventResponse` interfaces
- Complete type safety for all API interactions

## Key Features Implemented

### Cost Tracking System
1. **Per-Person Cost Breakdowns**: Store individual costs per team member/participant
2. **Multiple Cost Categories**: meals, transport, entertainment, materials, accommodation, other
3. **Multi-Currency Support**: Configurable currency with USD default
4. **Auto-Calculation**: Automatic total cost computation from per-person data
5. **Cost Validation**: Server-side validation and calculation verification

### Company Location Integration
1. **Dropdown Data**: Optimized queries for company selection with location counts
2. **Location Details**: Full location information including meeting facilities
3. **Auto-Population**: Automatic form population when company/location is selected
4. **Meeting Suitability**: Filtering locations suitable for different meeting types
5. **Geocoding Ready**: Latitude/longitude fields for mapping integration

### Enhanced Progressive Save
1. **Cost Data Persistence**: Automatic saving of cost tracking data
2. **Company Associations**: Linking meetings to specific company locations
3. **Backward Compatibility**: Existing trip creation workflow unchanged
4. **Data Integrity**: Validation and error handling for complex nested data

### Performance & Security
1. **Optimized Queries**: Database functions for efficient company location fetching
2. **RLS Policies**: Row-level security for all new tables
3. **Authentication**: Consistent auth handling across all endpoints (cookies + headers)
4. **Error Handling**: Comprehensive error responses with context for debugging
5. **Validation**: Server-side validation for all cost data and company associations

## Integration Points

### Frontend Integration
- APIs expect `EnhancedCalendarEvent` structure with cost and company data
- Progressive save enhanced to handle new data structures automatically
- Company dropdowns populated via `/api/companies/with-locations`
- Location auto-population via `/api/company-locations/[locationId]`

### Database Integration
- All cost data stored as JSONB for flexibility and performance
- Foreign key relationships maintained between meetings and company locations
- Automatic cost calculation triggers keep totals in sync
- Comprehensive indexing for query performance

### Existing System Integration
- Enhanced progressive save maintains full backward compatibility
- Existing trip creation workflow unchanged
- Cost data optional - system works with or without cost tracking
- Company locations optional - meetings work with or without location association

## Testing Recommendations

1. **Authentication Testing**: Verify all endpoints work with both cookie and Bearer token auth
2. **Cost Calculation Testing**: Test various cost scenarios and currency handling
3. **Company Location Testing**: Verify company dropdown and location auto-population
4. **Progressive Save Testing**: Ensure backward compatibility and new cost data handling
5. **Performance Testing**: Test with large numbers of locations and cost breakdowns

## Next Steps for Frontend Integration

1. Update `MeetingAgendaStep` component to use new company location APIs
2. Integrate cost tracking UI with cost calculation API
3. Enhanced calendar event creation with company and cost data
4. Update progressive save calls to include new data structures
5. Add cost summary displays in trip cards and dashboard

## Files Created/Modified

### New Files
- `/supabase/migrations/20250814_add_company_locations_and_cost_enhancements.sql`
- `/src/app/api/companies/with-locations/route.ts`
- `/src/app/api/companies/[companyId]/locations/route.ts`
- `/src/app/api/company-locations/[locationId]/route.ts`
- `/src/app/api/meetings/cost-calculation/route.ts`
- `/src/app/api/calendar-events/bulk/route.ts`
- `/src/types/meetings-agenda-api.ts`

### Modified Files
- `/src/app/api/trips/progressive-save/route.ts` (enhanced with cost tracking)
- `/src/types/database.ts` (added new table types and enhanced existing ones)

All implementations follow the project's existing patterns for authentication, error handling, and data validation while providing comprehensive new functionality for the enhanced Meetings & Agenda module.