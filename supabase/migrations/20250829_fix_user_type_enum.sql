-- Fix user_type enum to allow 'external' value for user registration
-- This resolves the enum constraint error preventing user creation

-- Add 'external' as a valid user_type enum value
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'external';

-- Comment for documentation
COMMENT ON TYPE user_type IS 'User type classification: admin (internal Wolthers staff), external (company users)';

-- Verify the enum values by showing current enum values (for debugging)
SELECT unnest(enum_range(NULL::user_type)) as valid_user_types;