# Fix Supabase Service Role Key Issue

## Problem
The service role key in your `.env.local` file is invalid. This is causing the "Invalid API key" error when trying to create users during Microsoft OAuth authentication.

## Solution

1. **Get the correct Service Role Key from Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/ojyonxplpmhvcgaycznc/settings/api
   - Look for the **service_role** secret key (it will start with `eyJ...`)
   - Copy the entire key

2. **Update your `.env.local` file**:
   Replace the current `SUPABASE_SERVICE_ROLE_KEY` value with the correct one from the dashboard.

3. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart it
   npm run dev
   ```

## Current Status
- ✅ Supabase URL is correct
- ✅ Anon key is working
- ❌ Service role key is invalid (needs replacement)
- ✅ Database connection via MCP is working
- ✅ Microsoft OAuth flow is working up to user creation

## What the Service Role Key Does
The service role key is used for server-side operations that need to bypass Row Level Security (RLS). In your case, it's needed to:
- Create new users during OAuth authentication
- Update user login information
- Access protected database operations

## Security Note
The service role key should NEVER be exposed in client-side code or public repositories. It should only be used in server-side API routes and backend operations.