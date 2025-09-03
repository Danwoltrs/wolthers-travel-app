-- Storage Buckets Setup Migration
-- This migration ensures all required storage buckets exist with proper configuration

-- Create documents bucket if it doesn't exist
DO $$
BEGIN
  -- Check if documents bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) THEN
    -- Create documents bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'documents',
      'documents',
      true, -- Public bucket for company logos and documents
      52428800, -- 50MB limit
      ARRAY[
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif',
        'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ]
    );
  END IF;
END
$$;

-- Note: RLS policies for storage.objects are typically managed through the Supabase dashboard
-- or require superuser privileges. The bucket creation above is sufficient for basic functionality.
-- For production deployments, configure RLS policies through the Supabase dashboard.

-- Verify bucket setup
DO $$
BEGIN
  -- Log successful bucket creation
  RAISE NOTICE 'Storage bucket setup completed successfully';
  
  -- Verify bucket exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
    RAISE NOTICE 'Documents bucket exists and is configured';
  ELSE
    RAISE EXCEPTION 'Failed to create documents bucket';
  END IF;
END
$$;