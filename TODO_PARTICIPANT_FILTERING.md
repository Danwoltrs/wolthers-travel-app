# Participant-Specific Itinerary Filtering

## Business Requirement

Implement filtering system for multi-company trips where different companies have different itineraries within the same trip. Companies can "fork" their schedules, visit different suppliers simultaneously, then rejoin for shared meetings.

### Use Cases
- Company Y visits Supplier B while Company X visits Supplier D at the same time
- Companies rejoin for shared meetings later
- Some companies end their trip early while others continue
- Each company should only see their relevant meetings/activities and counts

## Technical Implementation

### 1. Database Schema Changes

#### New Table: `itinerary_participants`
```sql
CREATE TABLE itinerary_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_item_id UUID NOT NULL REFERENCES itinerary_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  participation_type VARCHAR(20) DEFAULT 'participant', -- 'participant', 'optional', 'observer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT itinerary_participants_user_or_company_check 
    CHECK (user_id IS NOT NULL OR company_id IS NOT NULL),
  UNIQUE(itinerary_item_id, user_id),
  UNIQUE(itinerary_item_id, company_id)
);
```

#### Modify `itinerary_items` table
```sql
ALTER TABLE itinerary_items 
ADD COLUMN is_shared_activity BOOLEAN DEFAULT true,
ADD COLUMN requires_specific_participants BOOLEAN DEFAULT false;
```

### 2. API Enhancements

#### Update `/api/trips/route.ts`
- Add user context to filter itinerary items based on participant assignments
- Include participant-specific counts for visits and meetings
- Filter itinerary data based on logged-in user's company/role

#### New endpoint: `/api/trips/[id]/itinerary-filtered`
- Return filtered itinerary based on user permissions
- Include parallel/concurrent activities visualization data
- Provide company-specific timeline view

### 3. Frontend Components

#### Dashboard Changes
- **TripCard Component**: Show participant-specific visit/meeting counts
- **Quick View Modal**: Filter meetings by user's participation
- **Trip Statistics**: Display counts relevant to user's company only

#### Trip Page Enhancements
- **Filtered Timeline**: Show only relevant activities for logged-in user
- **Concurrent Activities Indicator**: Visual cue when other companies have parallel meetings
- **Shared Activity Markers**: Clearly mark meetings where multiple companies participate
- **Company Schedule Overview**: Optional view showing full trip timeline (admin only)

#### New Admin Features
- **Itinerary Assignment Interface**: Assign specific meetings to companies/participants
- **Schedule Fork Management**: Visual tool to split and merge company schedules
- **Parallel Activity Planner**: Schedule concurrent activities for different companies
- **Trip Timeline Visualization**: Gantt-chart style view of all company schedules

### 4. Data Layer Updates

#### Update `useTrips` hook
```typescript
// Add participant filtering logic
const getFilteredItinerary = (trip: Trip, user: AuthUser) => {
  // Filter based on user's company and explicit assignments
  // Handle shared vs. company-specific activities
}
```

#### Update `useTripDetails` hook
```typescript
// Include participant-specific itinerary loading
// Filter meeting notes and visit data by participation
```

### 5. Business Logic Rules

#### Participation Types
- **Shared Activities**: All trip participants can see (default for existing data)
- **Company-Specific**: Only assigned company members can see
- **User-Specific**: Only assigned individuals can see
- **Optional Activities**: Visible to all but marked as optional for specific companies

#### Access Control Matrix
| User Type | Shared Activities | Company-Specific | Other Company Activities | Admin View |
|-----------|------------------|------------------|-------------------------|------------|
| @wolthers.com | ✅ Full Access | ✅ Full Access | ✅ Read-Only | ✅ Full Admin |
| Company Admin | ✅ Full Access | ✅ Full Access | ❌ Hidden | ❌ No Access |
| Company User | ✅ Full Access | ✅ Read-Only | ❌ Hidden | ❌ No Access |

### 6. Migration Strategy

#### Phase 1: Schema Updates
- Create `itinerary_participants` table
- Add new columns to `itinerary_items`
- Migrate existing data (all activities default to `is_shared_activity = true`)

#### Phase 2: API Layer
- Update existing endpoints to respect participant filtering
- Add new filtered endpoints
- Maintain backward compatibility for current UI

#### Phase 3: Frontend Implementation
- Update trip cards to show filtered counts
- Implement filtered views in modals and trip pages
- Add admin interfaces for participant assignment

#### Phase 4: Advanced Features
- Concurrent activity visualization
- Schedule fork management
- Advanced timeline views

### 7. Database Indexes

```sql
-- Performance optimization for filtered queries
CREATE INDEX idx_itinerary_participants_company_id ON itinerary_participants(company_id);
CREATE INDEX idx_itinerary_participants_user_id ON itinerary_participants(user_id);
CREATE INDEX idx_itinerary_participants_item_id ON itinerary_participants(itinerary_item_id);
CREATE INDEX idx_itinerary_items_shared ON itinerary_items(is_shared_activity);
```

### 8. Testing Requirements

#### Unit Tests
- Participant filtering logic
- Access control rules
- Data transformation functions

#### Integration Tests
- Filtered API responses
- Cross-company data isolation
- Admin assignment functionality

#### User Acceptance Tests
- Company A cannot see Company B's private meetings
- Shared meetings visible to all participants
- Correct counts and statistics per company
- Admin can assign and modify participant access

## Implementation Priority

### High Priority (Core Functionality)
1. Database schema changes and migration
2. Basic participant filtering in API
3. Filtered trip card counts and quick view modal

### Medium Priority (Enhanced UX)
1. Filtered trip page timeline
2. Admin assignment interface
3. Shared activity indicators

### Low Priority (Advanced Features)
1. Concurrent activity visualization
2. Advanced timeline management
3. Schedule fork planning tools

## Notes

- Maintain backward compatibility with existing trip data
- Default all existing itinerary items to shared activities during migration  
- Consider performance impact of additional filtering queries
- May need to cache filtered results for large trips with many participants
- Should integrate with existing access control system (RLS policies or API-level filtering)

## Related Files to Modify

- `/src/app/api/trips/route.ts` - Add participant filtering
- `/src/hooks/useTrips.ts` - Update data transformation
- `/src/hooks/useTripDetails.ts` - Add filtered itinerary loading
- `/src/components/dashboard/TripCard.tsx` - Show filtered counts
- `/src/components/dashboard/QuickViewModal.tsx` - Filter meeting display
- `/src/app/trips/[id]/page.tsx` - Implement filtered timeline view
- `/supabase/migrations/` - Add new migration files

## Estimated Development Time

- **Phase 1 (Schema + Migration)**: 1-2 weeks
- **Phase 2 (API Updates)**: 2-3 weeks  
- **Phase 3 (Frontend Implementation)**: 3-4 weeks
- **Phase 4 (Advanced Features)**: 2-3 weeks
- **Testing + Refinement**: 1-2 weeks

**Total Estimated Time**: 9-14 weeks