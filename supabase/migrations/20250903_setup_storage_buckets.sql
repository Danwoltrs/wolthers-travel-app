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

-- Create RLS policies for documents bucket
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can view public documents" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

  -- Enable RLS on storage.objects if not already enabled
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- Policy: Anyone can view documents in public bucket
  CREATE POLICY "Anyone can view public documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents');

  -- Policy: Authenticated users can upload to documents bucket
  CREATE POLICY "Authenticated users can upload documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'documents' 
      AND auth.role() = 'authenticated'
    );

  -- Policy: Authenticated users can update documents they have access to
  CREATE POLICY "Authenticated users can update documents"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'documents'
      AND auth.role() = 'authenticated'
    );

  -- Policy: Authenticated users can delete documents they have access to  
  CREATE POLICY "Authenticated users can delete documents"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'documents'
      AND auth.role() = 'authenticated'
    );

EXCEPTION
  WHEN duplicate_object THEN
    -- Policies already exist, ignore
    NULL;
END
$$;

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