# CLAUDE.md

## Agent Organizer Dispatch Protocol

### The Prime Directive: You Are a Dispatcher

**Your primary function is not to directly answer complex project-related or coding requests.** You are an intelligent **Dispatcher**. Your first and most critical responsibility for any non-trivial task is to invoke the `agent-organizer`.

Think of yourself as the central command that receives an incoming request and immediately hands it off to the specialized mission commander (`agent-organizer`) who can assemble the right team and create a plan of attack. **You MUST NOT attempt to solve the user's request on your own.**

This protocol ensures that every complex task is handled with a structured, robust, and expert-driven approach, leveraging the full capabilities of the specialized sub-agents.

### Invocation Triggers

You **MUST** invoke the `agent-organizer` when a user prompt involves any of the following activities:

- **Code Generation:** Writing new files, classes, functions, or significant blocks of code.
- **Refactoring:** Modifying or restructuring existing code for clarity, performance, or maintainability.
- **Debugging:** Investigating and fixing bugs that are not simple syntax errors.
- **Analysis & Explanation:** Being asked to "understand," "analyze," or "explain" a project, file, or codebase.
- **Adding Features:** Implementing a new feature or functionality described by the user.
- **Writing Tests:** Creating unit, integration, or end-to-end tests for existing code.
- **Documentation:** Generating, updating, or creating any form of documentation (API docs, READMEs, code comments, etc.).
- **Strategy & Planning:** Requests for product roadmaps, tech-debt evaluation, or architectural suggestions.

**Trivial Exception:** You may answer directly ONLY if the request is a simple, self-contained question that does not require project context (e.g., "What is the syntax for a dictionary in Python?"). If in doubt, **always delegate.**

### Follow-Up Question Handling Protocol

When users ask follow-up questions after an initial agent-organizer workflow, apply intelligent escalation based on complexity assessment to avoid unnecessary overhead while maintaining quality.

#### Complexity Assessment for Follow-Ups

**Simple Follow-ups** (Handle directly without sub-agents):
- Clarification questions about previous work ("What does this function do?")
- Minor modifications to existing output ("Can you fix this typo?")
- Status updates or explanations ("Why did you choose this approach?")
- Single-step tasks taking <5 minutes

**Moderate Follow-ups** (Use previously identified agents):
- Building on existing work within same domain ("Add error handling to this API")
- Extending or refining previous deliverables ("Make the UI more responsive")
- Related tasks using same technology stack ("Add tests for this feature")
- Tasks requiring 1-3 of the previously selected agents

**Complex Follow-ups** (Re-run agent-organizer):
- New requirements spanning multiple domains ("Now add authentication and deploy to AWS")
- Significant scope changes or pivots ("Actually, let's make this a mobile app instead")
- Tasks requiring different expertise than previously identified
- Multi-phase workflows needing fresh team assembly

### The Context Manager: Project Intelligence System

The **context-manager** serves as the central nervous system for multi-agent coordination, acting as a specialized agent that maintains real-time awareness of your project's structure, purpose, and evolution.

#### Key Capabilities
- **Intelligent Project Mapping**: Creates and maintains a comprehensive JSON knowledge graph (`context-manager.json`)
- **Incremental Updates**: Efficiently tracks changes without unnecessary full scans
- **Context Distribution**: Provides tailored project briefings to other agents
- **Activity Logging**: Maintains an audit trail of all agent activities and file modifications
- **Cross-Agent Communication**: Facilitates seamless information sharing between specialized agents

## Commands

### Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server

### Database
- `npm run db:start` - Start Supabase local development environment
- `npm run db:stop` - Stop Supabase local development environment
- `npm run db:reset` - Reset the database to initial state

### Session Recovery Commands
- See `TOMORROW-SESSION.md` for complete session recovery guide
- Priority testing: Dashboard → Trip → Statistics tab (interactive charts!)
- Database fix: `npx supabase start` then `npx supabase db reset --local`

## Architecture

This is a Next.js 15 application with TypeScript, built for travel itinerary management. Key architectural components:

### Tech Stack
- **Frontend**: Next.js 15.4 with React 19 and TypeScript
- **Styling**: Tailwind CSS 3.4.17 (downgraded from v4 for stability)
- **Database**: Supabase (PostgreSQL with realtime capabilities)
- **Authentication**: Azure MSAL for Microsoft auth integration, NextAuth
- **AI Integration**: Anthropic SDK and OpenAI SDK
- **Maps**: Google Maps API with geocoding and directions services
- **Email**: Nodemailer for email notifications
- **Icons**: Lucide React for consistent iconography
- **Utilities**: clsx and tailwind-merge for className management
- **Drag & Drop**: React DnD with HTML5 backend for calendar interactions
- **Touch Support**: React DnD Touch backend for mobile drag operations

### Project Structure
- `/src/app/` - Next.js App Router pages and layouts
- `/src/components/` - Reusable React components
  - `/dashboard/` - Dashboard-specific components (TripCard, QuickViewModal)
  - `/layout/` - Layout components (Header)
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Utility functions and shared logic
  - `utils.ts` - Common utilities including date formatting with day names
- `/src/services/` - External service integrations (API clients, etc.)
- `/src/types/` - TypeScript type definitions
  - `enhanced-modal.ts` - Enhanced modal types and interfaces
- `/supabase/migrations/` - Database migration files

### Key Features
- Travel itinerary management system for Wolthers & Associates
- Integration with Microsoft authentication via Azure MSAL
- Interactive Google Maps with real-time geocoding and route planning
- AI-powered features using Anthropic Claude and OpenAI
- Real-time database capabilities with Supabase
- Email notification system
- Enhanced Quick View Modal with comprehensive trip editing
- Calendar system with drag-and-drop activity management
- Progressive save functionality with conflict resolution

### Design System

#### Modal Design Standards
All modals throughout the application must follow the QuickView modal design system to ensure visual consistency:

**Standard Modal Container:**
- Background: `bg-white dark:bg-[#1a1a1a]`
- Border: `border border-pearl-200 dark:border-[#2a2a2a]`
- Shadow: `shadow-xl`
- Border radius: `rounded-lg`
- Max width: `max-w-5xl`
- Responsive padding: `p-2 md:p-4` (outer), `p-3 md:p-6` (inner content)

**Enhanced Modal Container (for comprehensive editing):**
- Max width: `max-w-[95vw] xl:max-w-[90vw]` for maximum canvas utilization
- Height: `h-[95vh]` for full-screen editing experience
- Background: `bg-white dark:bg-[#1a1a1a]`
- Border: `border border-pearl-200 dark:border-[#2a2a2a]`
- Shadow: `shadow-2xl`
- Border radius: `rounded-lg`
- Responsive padding: `p-2 md:p-4`

**Modal Header:**
- Background: `bg-golden-400 dark:bg-[#09261d]`
- Text colors: `text-white dark:text-golden-400`
- Border: `border-b border-pearl-200 dark:border-[#0a2e21]`
- Layout: Flex with space-between for title and close button

**Modal Content:**
- Background: `bg-white dark:bg-[#1a1a1a]`
- Cards within content: `border border-pearl-200 dark:border-[#2a2a2a]`
- Section headers: `text-gray-900 dark:text-golden-400`
- Body text: `text-gray-700 dark:text-gray-300`
- Subtle text: `text-gray-500 dark:text-gray-400`

**Interactive Elements:**
- Tabs active: `bg-white dark:bg-emerald-800/80 text-gray-800 dark:text-golden-400`
- Tabs inactive: `text-white/70 dark:text-golden-400/70`
- Close button: `text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300`

**Form Elements:**
- Checkboxes: `dark:bg-[#1a1a1a] dark:border-[#2a2a2a]`
- Borders: `dark:border-[#2a2a2a]` for separators

#### Quick View Modal Light Mode Color Scheme

**Background Colors:**
- Modal background: Mustard Yellow (`#F7B731`)
- Content areas: White (`#FFFFFF`)

**Text Colors:**
- Title text ("Swiss Coffee Dinner"): Dark Teal (`#006D5B`)
- Dates & duration: Charcoal (`#333333`)
- Tab labels: Charcoal (`#333333`) for inactive, Charcoal (`#333333`) for active

**Interactive Elements:**
- Icons: Teal (`#009B77`) or White (`#FFFFFF`) when on darker elements
- "View Mode" button: White text (`#FFFFFF`) on Teal background (`#009B77`)
- "Edit Mode" button: Charcoal text (`#333333`) with hover state Dark Teal (`#006D5B`)
- Close button: Teal (`#009B77`) with hover state Dark Teal (`#006D5B`)

**Design Goals:**
- Improved readability and accessibility
- Professional, clean appearance
- High contrast for better visibility
- Consistent with Nordic minimalist aesthetic

#### Enhanced Quick View Modal System

The Enhanced Quick View Modal provides comprehensive trip editing capabilities with a six-tab navigation system and full-screen editing experience.

**Enhanced Modal Structure:**
- **Dimensions**: `max-w-[95vw] xl:max-w-[90vw]` width, `h-[95vh]` height
- **Navigation**: Six-tab system with Overview, Schedule, Participants, Logistics, Documents, Expenses
- **Progressive Save**: Auto-save functionality with conflict resolution
- **Real-time Validation**: Form validation with error handling
- **Mobile Optimization**: Touch-friendly interface with responsive design

**Tab-Specific Features:**

1. **Overview Tab**
   - Trip details editing with real-time updates
   - Status management and trip information
   - Quick access to essential trip data

2. **Schedule Tab**
   - Full calendar interface with day/week/timeline views
   - Drag-and-drop activity management using React DnD
   - Time conflict detection and resolution
   - Trip date extension (add days before/after)
   - Activity creation, editing, and deletion
   - Mobile-optimized with touch support

3. **Participants Tab**
   - Staff selection and role assignment
   - Real-time participant management
   - Integration with user management system

4. **Logistics Tab**
   - Vehicle and driver assignment
   - Equipment management
   - Accommodation details
   - Resource allocation tracking

5. **Documents Tab**
   - File upload and management
   - Document categorization
   - File sharing capabilities
   - Version control

6. **Expenses Tab**
   - Budget tracking and management
   - Expense categorization
   - Cost analysis and reporting

**Technical Implementation:**
- Enhanced modal types in `/src/types/enhanced-modal.ts`
- State management with `useEnhancedModal` hook
- Supabase integration with real-time updates
- Calendar drag-and-drop with React DnD
- Touch backend for mobile devices
- Progressive save with conflict resolution
- Form validation and error handling

**Accessibility Features:**
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Touch-friendly interface
- Focus management

**Design Compliance:**
- Nordic minimalist design system
- Consistent color palette with forest green and gold accents
- Responsive typography and spacing
- Glass morphic effects where appropriate

#### User Management Module Color Scheme
**Background Colors:**
- Main modal background: `bg-gradient-to-b from-[#F5F1E8] to-[#EDE4D3]`
- Search/controls section: `bg-gradient-to-r from-emerald-800 to-emerald-900` (green gradient with white text)
- Table header: `bg-[#1E293B]` (dark blue with gold column titles)
- Search input: `!bg-[#F5F1E8]` (light crème)

**Table Row Colors:**
- Even rows: `bg-[#FFFDF9]` - Very subtle warm off-white
- Odd rows: `bg-[#FCFAF4]` - Slightly warmer very light crème

**Design Pattern:**
- Yellow modal header remains unchanged for branding
- Green gradient for search/controls section (emerald with white text)
- Dark blue table header with gold column titles (`text-amber-400`)
- Light crème gradient for content areas
- Subtle alternating table rows for better readability

#### Color Palette
- **Primary Green**: Deep forest green for headers and navigation (`#2D5347` range)
- **Gold Accents**: Warm golden tones for card sections and highlights (`#FEF3C7`, `#F3E8A6`)
- **Neutral Grays**: Clean gray scale from light backgrounds to charcoal text
- **Supporting**: Cream backgrounds and sage green for status indicators

#### Component Design

##### Header
- Fixed glassmorphic green navigation bar
- Icon-only design with rounded pill shape
- Semi-transparent background with backdrop blur

##### TripCard  
- Fixed 420px height with three-section layout
- Gold-toned title sections for visual hierarchy
- Consistent spacing and progress indicators
- Clean typography with proper text truncation

##### Search Input Fields
**Standard Search Input Pattern** (to prevent icon/text overlap issues):
```jsx
{/* Container */}
<div className="relative">
  {/* Search Icon */}
  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
    <Search className="w-4 h-4 text-gray-400" />
  </div>
  {/* Input Field */}
  <input
    type="text"
    placeholder="Search name or email"
    value={searchValue}
    onChange={(e) => handleSearch(e.target.value)}
    style={{ paddingLeft: '36px' }}
    className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
  />
</div>
```

**Key Requirements:**
- Search icon positioned at `left-2` (8px from left edge)
- Input field uses inline style `paddingLeft: '36px'` for precise spacing
- Never use Tailwind `pl-` classes for search inputs (causes overlap)
- Icon calculation: 8px position + 16px icon width + 12px spacing = 36px padding

#### Design Philosophy
Nordic minimalism meets corporate travel—professional, trustworthy, and visually clean. The forest green anchors the brand while gold accents add warmth and guide attention.

#### Typography
- Danish minimalist aesthetic with clean, readable fonts
- Consistent use of text sizes: `text-lg` for titles, `text-sm` for content
- Proper text truncation with ellipsis for long content

### TypeScript Configuration
- Strict mode enabled for type safety
- JSX preserve mode for Next.js compatibility
- ES2016 target with DOM libraries
- Module resolution set to Node

### Google Maps Integration
- **Real Location Data**: Integrates with Supabase to fetch actual trip locations and activities
- **Geocoding Service**: Automatically converts address strings to coordinates using Google Maps Geocoding API
- **Route Planning**: Displays driving directions between multiple trip locations with custom markers
- **Calendar Export**: Generates ICS files for individual days or entire trips
- **Error Handling**: Graceful fallback to mock coordinates when geocoding fails
- **Rate Limiting**: Built-in retry logic and exponential backoff for API limits
- **Responsive Design**: Map component adapts to different screen sizes with proper controls

### Calendar System with Drag & Drop
- **React DnD Implementation**: Full drag-and-drop support for activity management
- **Multiple View Modes**: Day, week, and timeline views for different planning perspectives
- **Touch Support**: Mobile-optimized with React DnD Touch backend
- **Time Conflict Detection**: Automatic detection and prevention of scheduling conflicts
- **Activity Management**: Create, edit, delete, and reschedule activities with visual feedback
- **Trip Extension**: Add days before or after trip dates with calendar integration
- **Real-time Updates**: Immediate synchronization with Supabase database
- **Accessibility**: Keyboard navigation and screen reader support
- **Mobile Optimization**: Touch-friendly interface with responsive design

### UI/UX Principles
1. **Consistency**: All cards maintain the same height (420px) for visual uniformity
2. **Visual Hierarchy**: Color-coded sections guide the eye through important information
3. **Minimalism**: Danish-inspired design with purposeful use of white space
4. **Accessibility**: Proper color contrast and hover states for all interactive elements
5. **Responsiveness**: Mobile-first approach with adaptive layouts

### Recent Updates
- Implemented glassmorphic header with icon-only navigation
- Updated TripCard design with color-coded sections (gold title, brown company section)
- Enhanced date formatting to include day names without year
- Removed dashboard title for cleaner interface
- Added thin progress bars between title and company sections
- Implemented Danish minimalist design principles
- Created uniform card height (420px) across all cards
- Added Quick View Modal for trip details
- Built multi-step trip creation wizard
- Downgraded from Tailwind CSS v4 to v3.4.17 for stability
- Implemented left-aligned card grid with add button outside grid
- Enhanced responsive design for mobile to desktop
- **Trip Page Layout**: Adjusted mobile spacing - TripHeader uses `mt-36` on mobile and `mt-6` on desktop for proper clearance from navigation bar
- **Google Maps API Integration**: Complete implementation with geocoding, route planning, and calendar export functionality
- **Fixed Nested Button Hydration Error**: Resolved HTML validation issues in activity components
- **✅ REAL-TIME PARTICIPANT SYNCHRONIZATION**: Implemented complete real-time participant management system
  - **Issue**: Participant changes in edit mode weren't reflected in view mode, causing data inconsistency
  - **Solution**: Created comprehensive data flow from ParticipantsSection → QuickViewModal → OverviewTab with live participant data
  - **Features**: Real-time updates, duplicate prevention, save prompts when switching modes, and instant synchronization across all UI components
  - **Result**: Participants now update instantly across edit mode, view mode, overview tab, and dashboard cards without requiring page refresh
  - **Status**: ✅ WORKING PERFECTLY - Validated with full add/remove participant workflow

### Current Project Status

#### Completed Features ✅
1. Main app layout with glassmorphic header
2. Dashboard with uniform trip cards
3. Authentication system (Microsoft OAuth, email OTP)
4. Enhanced Quick View Modal with comprehensive trip editing capabilities
5. Nordic business minimalist design implementation
6. Responsive grid layout
7. Date formatting with day names
8. **User Management Interface** - Complete user management system with search, filtering, role management, online status, and invite functionality
9. **Supabase Integration** - Real-time trip data with activities and location information
10. **Trip URL Structure** - Access trips via unique codes (e.g., AMS_DCI_QA_0825) not UUIDs
11. **Enhanced Quick View Modal** - Six-tab comprehensive editing system with progressive save
12. **Calendar Drag & Drop System** - Full activity management with time conflict detection
13. **Progressive Save Functionality** - Auto-save with conflict resolution and real-time validation
14. **Mobile-Optimized Calendar** - Touch-friendly drag-and-drop with responsive design

#### Pending Features 🚧
1. Trip creation wizard (backend integration)
2. Company management pages
3. Fleet management system
4. Advanced expense tracking features (basic implemented)
5. Meeting confirmation system
6. Real-time notifications system
7. Document version control system
8. Advanced reporting and analytics

### Development Guidelines

#### Code Restrictions 🚨
- **Do not change the login and authentication** unless explicitly requested
- **Do not change the dashboard trip layouts** unless explicitly requested  
- **Enhanced Quick View Modal is production-ready** - Maintain existing functionality and design patterns
- **NEVER change trip URLs from trip codes to trip IDs** - Always use the unique trip access code (e.g., AMS_DCI_QA_0825) for URLs, not UUIDs

#### Best Practices
- Maintain Nordic minimalist aesthetic with strategic use of forest green and gold
- Enforce uniform card height (420px) across all trip components
- Apply consistent 16px padding and vertical alignment throughout
- Follow TypeScript strict mode for type safety
- Ensure responsive design across all screen sizes
- Use Lucide icons exclusively for visual consistency
- Keep glassmorphic effects subtle and professional
- "Authentication methods fully implemented with oauth and e-mail"
- Any editing from Supabase has to load the current information pre-populated from Supabase if it has data, otherwise use a placeholder text

#### Enhanced Modal Development Guidelines
- **Progressive Save**: Implement auto-save functionality with conflict resolution for all editing interfaces
- **Real-time Validation**: Provide immediate feedback on form validation and data integrity
- **Mobile-First Design**: Ensure touch-friendly interfaces with responsive layouts
- **Accessibility Compliance**: Include keyboard navigation, screen reader support, and high contrast modes
- **Drag & Drop Standards**: Use React DnD with HTML5 backend for desktop and Touch backend for mobile
- **State Management**: Utilize `useEnhancedModal` hook pattern for consistent modal state handling
- **Error Handling**: Implement comprehensive error boundaries and user-friendly error messages
- **Performance Optimization**: Use lazy loading and efficient re-rendering strategies for large datasets

## Important Database Notes

### Trip Draft vs Planning Status
**CRITICAL:** Trip cards shown as "drafts" in the UI are actually stored as regular trips with `status='planning'` in the database. The `trip_drafts` table is separate and may be empty. When implementing deletion:
- Trips with `status='planning'` are considered drafts in the UI
- Delete endpoint should handle actual trip deletion, not draft deletion
- The `trip_drafts` table is for progressive save functionality during trip creation
- Always check if a trip has an associated draft_id before attempting draft deletion

## Trip Creation Workflow Fix - Previous Session Summary

### **Initial Problems Identified**
1. **Staff Loading**: Showing "0 members found" instead of expected 4 Wolthers staff (Daniel, Tom, Svenn, Rasmus)
2. **Progressive Save Errors**: Continuous 500 Internal Server Error preventing auto-save
3. **UI Issues**: Staff picker too small, requiring excessive scrolling
4. **Custom Trip Codes**: Not using provided codes (e.g., SCTA-2025), generating random ones instead
5. **Staff Not Persisting**: Selected staff disappeared from saved trips

### **Root Causes & Solutions**

#### **1. Authentication Issues**
- **Problem**: Trip creation modal using `localStorage.getItem('auth-token')` but app uses httpOnly cookies
- **Solution**: Changed to `credentials: 'include'` and removed localStorage dependency
- **Files**: `TripCreationModal.tsx`, `useWolthersStaff.ts`, progressive-save API, wolthers-staff API

#### **2. Database Enum Constraint Violation** 
- **Problem**: Progressive save setting `status: 'draft'` but database enum only accepts: `planning`, `confirmed`, `ongoing`, `completed`, `cancelled`
- **Error**: `"invalid input value for enum trip_status: \"draft\"" (code 22P02)`
- **Solution**: Changed `status: 'draft'` → `status: 'planning'`
- **File**: `src/app/api/trips/progressive-save/route.ts`

#### **3. Row Level Security (RLS) Blocking Staff Access**
- **Problem**: Client-side queries blocked by RLS policies
- **Solution**: Created secure `/api/users/wolthers-staff` endpoint using service role to bypass RLS
- **Files**: New API route, updated hook, applied RLS policies

#### **4. Missing Database Assignments**
- **Problem**: Daniel missing `company_id` assignment to Wolthers & Associates
- **Solution**: Updated Daniel's user record with correct company_id
- **Database**: Direct SQL update

### **Key Files Modified**
```
src/app/api/trips/progressive-save/route.ts
- Fixed status enum value (draft → planning)
- Added cookie authentication support
- Added trip_participants creation for staff
- Enhanced error logging and debugging

src/app/api/users/wolthers-staff/route.ts  
- New secure endpoint using service role
- Bypasses RLS restrictions
- Supports both header and cookie auth

src/hooks/useWolthersStaff.ts
- API-first approach instead of direct Supabase
- Cookie-based authentication
- Comprehensive fallback logic

src/components/trips/TripCreationModal.tsx
- Fixed authentication (cookies vs localStorage)
- Enhanced error handling and logging
- Fixed access code passing logic

src/components/trips/TeamVehicleStep.tsx
- Removed redundant title (shown in header)
- Two-column layout: team (left), driver/vehicles (right)
- Improved responsive design

src/components/ui/MultiSelectSearch.tsx
- Increased picker height: max-h-[500px] container, max-h-[400px] list
- Better visibility for staff selection
```

### **Database Changes Applied**
```sql
-- Fixed Daniel's company assignment
UPDATE users SET company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0' 
WHERE email = 'daniel@wolthers.com';

-- RLS policies applied for proper staff access
-- (handled via existing migration system)
```

### **Final Status**

#### **✅ Resolved Issues**
- Staff loading: Shows all 4 members (Daniel, Tom, Svenn, Rasmus)
- Progressive save: 500 errors eliminated  
- Authentication: Secure cookie-based system working
- UI: Taller staff picker, better layout
- Database: Proper RLS policies and staff assignments
- Trip codes: Custom codes (SCTA-2025) now used correctly
- Staff persistence: Selected staff saved to trip_participants table

#### **⚠️ Remaining Issues**
- Potential crash when proceeding to next step after staff selection
- Trip status display (may show as regular trip vs planning mode)

### **Key Lessons Learned**
1. **Authentication Flow**: httpOnly cookies require `credentials: 'include'` in fetch requests
2. **Database Constraints**: Always check enum values before inserting data
3. **RLS Policies**: Service role endpoints can bypass restrictive client-side policies
4. **Data Relationships**: Staff assignments require separate `trip_participants` table entries
5. **Debugging Strategy**: Enhanced logging at API entry points reveals root causes quickly

The core trip creation functionality is now working correctly with proper authentication, staff loading, and database persistence.
- Sidebar and blue navy header bradecrumbs always visible for wolthers & associates Brazil staff and admins company id 840783f4-866d-4bdb-9b5d-5d0facf62db0