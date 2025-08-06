# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Current Project Status

#### Completed Features ✅
1. Main app layout with glassmorphic header
2. Dashboard with uniform trip cards
3. Trip creation wizard (UI complete)
4. Quick view modal for trip details
5. Danish minimalist design implementation
6. Responsive grid layout
7. Date formatting with day names

#### Pending Features 🚧
1. Database integration with Supabase
2. Authentication system (Microsoft OAuth, email OTP)
3. Company management pages
4. User management interface
5. Fleet management system
6. Expense tracking features
7. Itinerary detail editor
8. Meeting confirmation system
9. Real-time updates and notifications
10. API integrations (Hotels.com, Google Maps)

### Development Guidelines
- Maintain Nordic minimalist aesthetic with strategic use of forest green and gold
- Enforce uniform card height (420px) across all trip components
- Apply consistent 16px padding and vertical alignment throughout
- Follow TypeScript strict mode for type safety
- Ensure responsive design across all screen sizes
- Use Lucide icons exclusively for visual consistency
- Keep glassmorphic effects subtle and professional