-- CRITICAL FIX: Add missing INSERT policy for users table
-- This fixes the user registration 500 error by allowing user creation operations

-- Allow service role and authorized operations to create users
CREATE POLICY "users_allow_registration_insert" ON "public"."users"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow service role operations (bypasses RLS anyway, but explicit for clarity)
  current_setting('role') = 'service_role' OR
  -- Allow global admins to create users
  (auth.jwt() ->> 'email') = ANY (ARRAY['daniel@wolthers.com', 'admin@wolthers.com']) OR
  -- Allow users with proper admin permissions
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (is_global_admin = true OR role = 'admin')
  )
);

-- Allow service role to update users during registration process
CREATE POLICY "users_allow_system_updates" ON "public"."users"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  -- Allow service role operations
  current_setting('role') = 'service_role' OR
  -- Allow users to update their own profile
  id = auth.uid() OR
  -- Allow global admins to update any user
  (auth.jwt() ->> 'email') = ANY (ARRAY['daniel@wolthers.com', 'admin@wolthers.com']) OR
  -- Allow users with proper admin permissions
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (is_global_admin = true OR role = 'admin')
  )
)
WITH CHECK (
  -- Same conditions as USING clause
  current_setting('role') = 'service_role' OR
  id = auth.uid() OR
  (auth.jwt() ->> 'email') = ANY (ARRAY['daniel@wolthers.com', 'admin@wolthers.com']) OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (is_global_admin = true OR role = 'admin')
  )
);

-- Add comments for documentation
COMMENT ON POLICY "users_allow_registration_insert" ON "public"."users" IS 
'CRITICAL: Allows user creation during registration process. Service role and admin users can insert new users.';

COMMENT ON POLICY "users_allow_system_updates" ON "public"."users" IS 
'Allows user updates during registration and profile management. Service role, self-updates, and admin users permitted.';

-- Verify RLS is enabled (should already be enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;