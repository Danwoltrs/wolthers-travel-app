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
- `/supabase/migrations/` - Database migration files

### Key Features
- Travel itinerary management system for Wolthers & Associates
- Integration with Microsoft authentication via Azure MSAL
- Interactive Google Maps with real-time geocoding and route planning
- AI-powered features using Anthropic Claude and OpenAI
- Real-time database capabilities with Supabase
- Email notification system

### Design System

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

### Current Project Status

#### Completed Features ✅
1. Main app layout with glassmorphic header
2. Dashboard with uniform trip cards
3. Authentication system (Microsoft OAuth, email OTP)
4. Quick view modal for trip details
5. Nordic business minimalist design implementation
6. Responsive grid layout
7. Date formatting with day names
9. **Supabase Integration** - Real-time trip data with activities and location information
10. **Trip URL Structure** - Access trips via unique codes (e.g., AMS_DCI_QA_0825) not UUIDs

#### Pending Features 🚧
1. Trip creation wizard (UI complete)
2. Company management pages
3. User management interface
4. Fleet management system
5. Expense tracking features
6. Itinerary detail editor
7. Meeting confirmation system
8. Real-time updates and notifications
9. *Google Maps Integration** - Interactive maps with real location data, geocoding, and route planning

### Development Guidelines

#### Code Restrictions 🚨
- **Do not change the login and authentication** unless explicitly requested
- **Do not change the dashboard trip layouts** unless explicitly requested  
- **Do not change the trip quick view modal** unless explicitly requested
- **NEVER change trip URLs from trip codes to trip IDs** - Always use the unique trip access code (e.g., AMS_DCI_QA_0825) for URLs, not UUIDs

#### Best Practices
- Maintain Nordic minimalist aesthetic with strategic use of forest green and gold
- Enforce uniform card height (420px) across all trip components
- Apply consistent 16px padding and vertical alignment throughout
- Follow TypeScript strict mode for type safety
- Ensure responsive design across all screen sizes
- Use Lucide icons exclusively for visual consistency
- Keep glassmorphic effects subtle and professional
- "Authentication methos fully implemented with oauth and e-mail"