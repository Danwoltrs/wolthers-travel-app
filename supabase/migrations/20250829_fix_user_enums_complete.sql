-- CRITICAL DATABASE FIX: Add missing enum values for user registration
-- This resolves both role and user_type enum constraint errors

-- Fix 1: Add 'user' to the role enum (external company users)
ALTER TYPE role ADD VALUE IF NOT EXISTS 'user';

-- Fix 2: Add 'external' to the user_type enum (non-Wolthers users)  
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'external';

-- Add 'admin' as a role option if it doesn't exist (for completeness)
ALTER TYPE role ADD VALUE IF NOT EXISTS 'admin';

-- Add comments for documentation
COMMENT ON TYPE role IS 'User role: staff (Wolthers employees), user (external company users), admin (system administrators)';
COMMENT ON TYPE user_type IS 'User type: admin (internal Wolthers staff with admin privileges), external (external company users)';

-- Show the current enum values for verification
DO $$
BEGIN
    RAISE NOTICE 'Current role enum values: %', (
        SELECT array_agg(unnest ORDER BY unnest) 
        FROM unnest(enum_range(NULL::role))
    );
    RAISE NOTICE 'Current user_type enum values: %', (
        SELECT array_agg(unnest ORDER BY unnest) 
        FROM unnest(enum_range(NULL::user_type))
    );
END $$;