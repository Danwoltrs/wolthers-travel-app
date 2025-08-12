-- Fix RLS policies to allow proper access to Wolthers staff data
-- This migration addresses the issue where client-side queries fail due to overly restrictive RLS policies

-- Create a more permissive policy for viewing Wolthers staff members
-- Allow authenticated users to view admin users from the Wolthers company
CREATE POLICY "users_view_wolthers_staff" ON "public"."users"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  user_type = 'wolthers_staff' OR 
  (user_type = 'admin' AND company_id IN (
    SELECT id FROM companies WHERE name ILIKE '%Wolthers%'
  ))
);

-- Also allow viewing basic user info for trip participants and staff assignment
-- This is needed for trip creation workflows
CREATE POLICY "users_view_for_trips" ON "public"."users"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  user_type IN ('wolthers_staff', 'driver', 'client') OR
  (user_type = 'admin' AND company_id IN (
    SELECT id FROM companies WHERE name ILIKE '%Wolthers%'
  )) OR
  -- Allow viewing own profile
  id = auth.uid() OR
  -- Allow global admins to view all
  (auth.jwt() ->> 'email') = ANY (ARRAY['daniel@wolthers.com', 'admin@wolthers.com'])
);

-- Comment explaining the policies
COMMENT ON POLICY "users_view_wolthers_staff" ON "public"."users" IS 
'Allows authenticated users to view Wolthers staff members (wolthers_staff type or admin type from Wolthers company) for trip creation workflows';

COMMENT ON POLICY "users_view_for_trips" ON "public"."users" IS 
'Allows authenticated users to view basic user info needed for trip creation and management workflows';