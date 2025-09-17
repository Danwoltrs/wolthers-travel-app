# gemini.md

## Project Architecture & Strategy

This document provides a summary of the Wolthers Travel App's architecture and a strategic plan for implementing new features.

### 1. Architecture Overview

This is a modern, full-stack web application built on Next.js 15 and React 19, designed for comprehensive travel itinerary management. It uses a robust set of technologies to deliver a feature-rich, real-time experience.

*   **Core Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Database & Backend**: Supabase (PostgreSQL with Realtime)
*   **Styling**: Tailwind CSS with a custom design system (Nordic minimalist aesthetic).
*   **Authentication**: NextAuth.js, supplemented by Azure MSAL for Microsoft SSO.
*   **Email**: Resend (Primary) and Nodemailer.
*   **Key Libraries**:
    *   `react-hook-form` & `zod` for forms and validation.
    *   `shadcn/ui`, `radix-ui` for UI components.
    *   `react-dnd` for drag-and-drop functionality in the calendar.
    *   `swr` and custom hooks for data fetching.

### 2. Key Architectural Patterns

The codebase is well-structured, separating concerns effectively:

*   **/src/app/api/**: Handles server-side API routes and backend logic that requires a service role to interact with Supabase, bypassing RLS where necessary.
*   **/src/hooks/**: Contains client-side logic encapsulated in React hooks. This is the primary mechanism for components to fetch and manage state (e.g., `useCalendarManager`).
*   **/src/lib/**: A central hub for core business logic, server actions (`trip-actions.ts`), Supabase client/server setup, and utility functions. The primary email logic resides in `src/lib/resend.ts`.
*   **/src/types/**: Home to TypeScript definitions, with `database.ts` providing types generated from the Supabase schema.

### 3. Development Commands

*   **Run Development Server**: `npm run dev`
*   **Build for Production**: `npm run build`
*   **Start Production Server**: `npm run start`
*   **Start Supabase (Local)**: `npm run db:start`
*   **Stop Supabase (Local)**: `npm run db:stop`
*   **Reset Database (Local)**: `npm run db:reset`

---

## Feature Guide: Trip Finalization & Notification System

This is the step-by-step plan to implement the automated email notification system.

### **The Goal**

1.  **Host Confirmation**: When a trip schedule is "finalized," email all selected hosts to confirm their availability. The email will contain "Yes" / "No" actions.
2.  **Response Handling**:
    *   **"Yes"**: Confirms the visit in the database.
    *   **"No"**: Notifies the trip creator and directs the host to a page to propose new times.
3.  **Staff Itinerary Notification**: Email all Wolthers staff with the full itinerary two days before the trip starts.
4.  **Daily Change Log**: Email all Wolthers staff at the end of the day with any changes made to the itinerary.

### **Implementation Plan**

#### Step 1: Create the "Finalize Trip" Trigger

The current workflow saves progressively. We need to add an explicit "Finalize" action.

1.  **Add a "Finalize & Notify Hosts" Button**: In the UI where the schedule is managed (likely controlled by `useCalendarManager`), add a new button. This button should only be active when the trip has hosts with valid emails assigned.
2.  **Create a New Server Action**: This button will invoke a new server action, let's call it `finalizeTripAndNotifyHosts`.

    *   **File**: `src/lib/trip-actions.ts`
    *   **Function**: `export async function finalizeTripAndNotifyHosts(tripId: string, userId: string)`
    *   **Logic**:
        1.  Update the trip status in the database: `supabase.from('trips').update({ status: 'finalized' }).eq('id', tripId)`.
        2.  Fetch all necessary data for the emails: trip details, participants (hosts, guests), and company info.
        3.  Call a new email-sending function from `resend.ts`.

#### Step 2: Implement Host Confirmation Email

1.  **Create New Email Function**:
    *   **File**: `src/lib/resend.ts`
    *   **Function**: `sendHostConfirmationRequest(hostData: HostConfirmationData)`
    *   **Data Interface (`HostConfirmationData`)**: Will include `hostName`, `hostEmail`, `tripTitle`, `guestNames`, `visitDate`, `visitTime`, and two generated URLs for the Yes/No responses.
2.  **Create New Email Template**:
    *   Design a new HTML template similar to `createHostInvitationTemplate` but focused on confirming a specific visit.
    *   **"Yes" Link URL**: `https://[YOUR_APP_URL]/api/visit-response?tripId=...&hostId=...&response=confirmed`
    *   **"No" Link URL**: `https://[YOUR_APP_URL]/api/visit-response?tripId=...&hostId=...&response=declined`

#### Step 3: Create the API Route to Handle Host Responses

1.  **Create the API Route**:
    *   **File**: `src/app/api/visit-response/route.ts`
2.  **Implement `GET` Handler**:
    *   The handler will parse `tripId`, `hostId`, and `response` from the URL query parameters.
    *   **If `response === 'confirmed'`**:
        1.  Update the status of the corresponding meeting/activity in the database to `'confirmed'`.
        2.  (Optional) Send a confirmation email to the trip creator saying the host has accepted.
        3.  Redirect the user to a generic "Thank You" page.
    *   **If `response === 'declined'`**:
        1.  Update the meeting/activity status to `'declined'`.
        2.  Send an email notification to the trip creator (`user.id` from the server action) informing them of the declination.
        3.  Redirect the host to a new page (e.g., `/propose-new-time?visitId=...`) where they can see alternative slots or a contact form.

#### Step 4: Implement Scheduled Staff Notifications

We will use Supabase's built-in cron job functionality (`pg_cron`) for scheduled tasks.

1.  **Pre-Trip Itinerary Email (2 Days Prior)**:
    *   **Create a Supabase SQL Function**: Write a new function `send_pre_trip_itinerary_notifications()`.
    *   **Logic**:
        1.  Select all trips where `start_date` is two days from now (`current_date + interval '2 days'`).
        2.  For each trip, gather the full itinerary details.
        3.  Fetch all Wolthers staff emails (`SELECT email FROM users WHERE company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'`).
        4.  Trigger an edge function or an API route on your app to send the actual email via Resend (since `plpgsql` can't directly call Resend).
    *   **Schedule the Function**: `SELECT cron.schedule('daily-pre-trip-check', '0 8 * * *', 'SELECT public.send_pre_trip_itinerary_notifications()');` (This runs at 8:00 AM UTC daily).

2.  **End-of-Day Changes Email**:
    *   This is more complex. A simple approach is to have a `last_changed_at` timestamp on the `trips` table.
    *   **Create a Supabase SQL Function**: `send_daily_change_summary()`.
    *   **Logic**:
        1.  Select trips where `updated_at` was in the last 24 hours.
        2.  For each, generate a summary of what changed (this requires a separate audit log table for better results, or a simpler "This trip was updated" notification).
        3.  Call the email-sending API route.
    *   **Schedule the Function**: `SELECT cron.schedule('daily-change-summary', '0 23 * * *', 'SELECT public.send_daily_change_summary()');` (This runs at 11:00 PM UTC daily).
