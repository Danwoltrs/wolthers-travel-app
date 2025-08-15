# Wolthers Travel App - Development Memory

## 🧠 Project Context & Knowledge Base

This document serves as the development memory for the Wolthers Travel App, tracking key insights, solutions, and architectural decisions made during development.

---

## 📋 Current Project Status

### Core Application Info
- **Framework**: Next.js 15.4 with React 19 and TypeScript
- **Database**: Supabase (PostgreSQL with realtime capabilities)
- **Authentication**: Azure MSAL + NextAuth with httpOnly cookies
- **Styling**: Tailwind CSS 3.4.17 (downgraded from v4 for stability)
- **Design System**: Nordic minimalist with forest green (#2D5347) and gold accents

### Key Features Implemented
- ✅ Main app with glassmorphic header and uniform trip cards (420px height)
- ✅ Authentication system (Microsoft OAuth + email OTP)
- ✅ Dashboard with responsive trip grid layout
- ✅ Quick view modal for trip details
- ✅ User management interface with search/filtering
- ✅ **Trip draft creation and management system**
- ✅ **Draft deletion functionality** (Fixed 2025-01-13)
- ✅ **Activity management system with API integration** (Fixed 2025-01-14)
- ✅ **Drag-to-resize functionality for activity cards** (Added 2025-01-14)

---

## 🔧 Recent Major Fixes & Solutions

### Activity Management & Drag-to-Resize Implementation (2025-01-14)
**Problem**: User requested ability to resize activity durations by dragging activity card edges
**Requirement**: "be able to drag a meeting like extending it up and down, to increase the time, with a up down arrow, so we can have a meeting changed from 09-10:00 to say 09-11:30"
**Solution**:
- Added visual resize handles (top/bottom edges) that appear on hover
- Implemented mouse event handling to track resize operations
- Added time constraint logic (minimum 1 hour, 6 AM - 10 PM bounds)
- Connected resize functionality through component prop chain
- Integrated with existing updateActivity API for real-time persistence
- Prevented drag conflicts during resize operations

**Key Technical Details**:
- Resize handles use `cursor-ns-resize` with opacity transitions
- Mouse delta calculations (60px = 1 hour) for intuitive resizing
- State management prevents simultaneous drag and resize operations
- Full integration with existing drag-and-drop calendar system

### Draft Deletion Issue (2025-01-13)
**Problem**: 500 Internal Server Error when deleting trip drafts
**Root Cause**: Next.js development server was in hung state, all API endpoints timing out
**Solution**: 
- Restarted development server to resolve hanging issue
- Rebuilt DELETE endpoint with comprehensive error handling
- Added dual authentication support (Bearer token + cookies)
- Implemented proper database cleanup for both trip_drafts and trips tables
- Added permission checks (creator or company admin only)

**Key Learning**: Server state issues can manifest as API errors. Always check server logs first.

### Authentication Architecture
- **Cookie-based**: Uses httpOnly cookies for web requests (`credentials: 'include'`)
- **Token-based**: Supports Bearer tokens for API clients
- **Fallback Logic**: JWT verification with Supabase session fallback
- **Service Role**: Used for bypassing RLS in specific admin operations

### Database Schema Evolution
- **trip_drafts**: Stores draft data with progressive save functionality
- **trips**: Final trips with is_draft flag for drafts stored directly
- **trip_participants**: Links staff to trips
- **Extended tables**: trip_hotels, trip_flights, trip_meetings for comprehensive trip data

---

## ⚠️ Critical Technical Constraints

### Do Not Change (Unless Explicitly Requested)
1. **Login and authentication system**
2. **Dashboard trip layouts and card designs**  
3. **Trip quick view modal structure**
4. **Trip URL structure** (ALWAYS use access codes like `AMS_DCI_QA_0825`, never UUIDs)

### Development Server Issues
- **Hanging State**: Next.js dev server can enter hung state, causing API timeouts
- **Solution**: Restart server with `pkill -f "next dev"` then `npm run dev`
- **Cache Issues**: Webpack cache corruption warnings are normal, don't affect functionality

---

## 🏗️ Architecture Patterns

### API Route Structure
```
/api/trips/
├── route.ts (GET all trips)
├── drafts/
│   ├── route.ts (GET/DELETE drafts)
│   └── [id]/route.ts (individual draft operations)
├── progressive-save/route.ts (draft autosave)
└── finalize/route.ts (convert draft to trip)
```

### Authentication Flow
1. Check Authorization header for Bearer token
2. Fallback to auth-token cookie
3. Verify JWT or validate Supabase session
4. Query users table for full user data
5. Apply RLS policies or use service role when needed

### Trip Creation Workflow
1. **Progressive Save**: Auto-saves draft data as user progresses
2. **Staff Assignment**: Creates trip_participants entries
3. **Status Management**: Uses `planning` status (not `draft` - enum constraint!)
4. **Finalization**: Migrates data from step_data to normalized tables

---

## 🐛 Known Issues & Gotchas

### Database Constraints
- **trip_status enum**: Only accepts `planning`, `confirmed`, `ongoing`, `completed`, `cancelled` (NOT `draft`)
- **RLS Policies**: Can block client-side queries - use service role for admin operations
- **Foreign Keys**: Ensure proper cascade deletion setup

### Next.js 15 Specifics
- **Async Params**: Route params must be awaited in Next.js 15
- **Route Conflicts**: Be careful with `/api/route.ts` vs `/api/[id]/route.ts` patterns
- **Compilation Issues**: Server restart often resolves hanging compilation

### Frontend State Management
- **Authentication**: Uses httpOnly cookies, not localStorage tokens
- **Draft Management**: Real-time updates require proper state synchronization
- **Trip Cards**: Fixed 420px height constraint for visual uniformity

---

## 📚 Development Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled
- **Authentication**: Always support both Bearer and cookie auth
- **Error Handling**: Comprehensive try/catch with detailed logging
- **Database**: Use service role for admin operations, respect RLS for user operations

### Testing Approach
- **API Testing**: Use curl for direct endpoint testing
- **Authentication**: Test both token types
- **Database**: Verify both draft tables (trip_drafts and trips)
- **Permissions**: Test creator vs admin access levels

---

## 🔄 Recurring Solutions

### Server Hangs
```bash
pkill -f "next dev"
npm run dev
```

### Authentication Debug
```javascript
console.log('Auth header exists:', !!authHeader)
console.log('Cookie token exists:', !!cookieToken)
console.log('User authenticated:', user?.email)
```

### Database Query Patterns
```javascript
// Dual table draft lookup
const { data: draftFromDrafts } = await supabase
  .from('trip_drafts').select('*').eq('id', draftId).single()
  
if (!draftFromDrafts) {
  const { data: draftFromTrips } = await supabase
    .from('trips').select('*').eq('id', draftId).eq('is_draft', true).single()
}
```

---

## 📈 Performance Insights

### Optimization Patterns
- **Database**: Use RLS policies for security, service role for admin efficiency
- **Caching**: Webpack cache issues are cosmetic, don't affect runtime
- **API Routes**: Prefer query parameters over path parameters for simple operations

### Monitoring Points
- Server log patterns for hanging detection
- Authentication failure rates
- Database query performance on large datasets

---

*Last Updated: 2025-01-14*  
*Next Review: When major features are added or issues discovered*