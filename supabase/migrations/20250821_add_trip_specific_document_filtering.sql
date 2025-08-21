-- Migration: Add trip-specific document filtering capabilities
-- Created: 2025-08-21
-- Description: Enhance company_documents table with trip associations for context-aware document filtering
--
-- TO APPLY THIS MIGRATION:
-- 1. Ensure Docker Desktop is running
-- 2. Run: npx supabase start
-- 3. Run: npx supabase db reset --local
-- 
-- This migration enables:
-- - Trip-specific document filtering in Document Management system
-- - Context-aware display: trip documents vs all company documents  
-- - Enhanced document organization with trip associations

-- Add trip association columns to company_documents table
ALTER TABLE public.company_documents 
ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS created_during_trip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trip_activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS trip_association_type VARCHAR(50) DEFAULT 'general'
  CHECK (trip_association_type IN ('general', 'activity_note', 'meeting_record', 'trip_report', 'expense_receipt', 'photo_upload'));

-- Create indexes for efficient trip filtering
CREATE INDEX IF NOT EXISTS idx_company_documents_trip_id ON public.company_documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_created_during_trip ON public.company_documents(created_during_trip) WHERE created_during_trip = TRUE;
CREATE INDEX IF NOT EXISTS idx_company_documents_trip_activity ON public.company_documents(trip_activity_id) WHERE trip_activity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_documents_trip_context ON public.company_documents(trip_id, created_during_trip, supplier_id);

-- Update existing documents to mark them as not trip-specific
UPDATE public.company_documents 
SET created_during_trip = FALSE 
WHERE trip_id IS NULL AND created_during_trip IS NULL;

-- Enhanced view for trip-specific document statistics
CREATE OR REPLACE VIEW public.trip_document_stats AS
SELECT 
    t.id as trip_id,
    t.access_code as trip_code,
    t.company_name as trip_destination,
    COUNT(cd.*) as total_documents,
    COUNT(cd.*) FILTER (WHERE cd.created_during_trip = TRUE) as trip_created_docs,
    COUNT(cd.*) FILTER (WHERE cd.trip_activity_id IS NOT NULL) as activity_docs,
    COUNT(cd.*) FILTER (WHERE cd.trip_association_type = 'meeting_record') as meeting_docs,
    COUNT(cd.*) FILTER (WHERE cd.trip_association_type = 'expense_receipt') as expense_docs,
    COUNT(cd.*) FILTER (WHERE cd.trip_association_type = 'photo_upload') as photo_docs,
    COUNT(DISTINCT cd.supplier_id) as suppliers_documented,
    MAX(cd.created_at) as last_document_date,
    SUM(cd.file_size) as total_size,
    -- Recent documents from this trip
    array_agg(
        json_build_object(
            'id', cd.id,
            'name', cd.file_name,
            'type', cd.trip_association_type,
            'created_at', cd.created_at,
            'supplier', c.name
        ) ORDER BY cd.created_at DESC
    ) FILTER (WHERE cd.id IS NOT NULL) LIMIT 10 as recent_documents
FROM public.trips t
LEFT JOIN public.company_documents cd ON t.id = cd.trip_id
LEFT JOIN public.companies c ON cd.supplier_id = c.id
WHERE cd.is_folder = FALSE
GROUP BY t.id, t.access_code, t.company_name;

-- Enhanced supplier document stats view with trip context
CREATE OR REPLACE VIEW public.supplier_document_stats AS
SELECT 
    c.id as supplier_id,
    c.name as supplier_name,
    c.country,
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE cd.document_year = EXTRACT(YEAR FROM CURRENT_DATE)) as current_year_docs,
    COUNT(*) FILTER (WHERE cd.document_year = EXTRACT(YEAR FROM CURRENT_DATE) - 1) as previous_year_docs,
    COUNT(DISTINCT cd.document_year) as years_active,
    COUNT(DISTINCT cd.trip_id) FILTER (WHERE cd.trip_id IS NOT NULL) as trips_documented,
    MAX(cd.created_at) as last_document_date,
    SUM(cd.file_size) as total_size,
    COUNT(*) FILTER (WHERE cd.urgency_level = 'critical') as critical_docs,
    COUNT(*) FILTER (WHERE cd.urgency_level = 'high') as high_priority_docs,
    COUNT(*) FILTER (WHERE cd.document_category = 'crop_forecast') as forecast_docs,
    COUNT(*) FILTER (WHERE cd.document_category = 'quality_analysis') as quality_docs,
    COUNT(*) FILTER (WHERE cd.document_category = 'contract') as contract_docs,
    COUNT(*) FILTER (WHERE cd.created_during_trip = TRUE) as trip_created_docs,
    -- Recent document titles for preview
    array_agg(cd.file_name ORDER BY cd.created_at DESC) 
      FILTER (WHERE cd.created_at >= CURRENT_DATE - INTERVAL '30 days') 
      LIMIT 5 as recent_documents,
    -- Recent trips where documents were created
    array_agg(DISTINCT 
        json_build_object(
            'trip_id', t.id,
            'trip_code', t.access_code,
            'destination', t.company_name,
            'document_count', COUNT(*) FILTER (WHERE cd.trip_id = t.id)
        )
    ) FILTER (WHERE t.id IS NOT NULL) as recent_trips
FROM public.companies c
LEFT JOIN public.company_documents cd ON (c.id = cd.company_id OR c.id = cd.supplier_id)
LEFT JOIN public.trips t ON cd.trip_id = t.id
WHERE c.company_type IN ('roaster_dealer', 'exporter_coop') 
  AND cd.is_folder = FALSE
GROUP BY c.id, c.name, c.country;

-- Function to get documents filtered by trip context
CREATE OR REPLACE FUNCTION public.get_trip_filtered_documents(
    p_trip_id UUID DEFAULT NULL,
    p_supplier_id UUID DEFAULT NULL,
    p_document_year INTEGER DEFAULT NULL,
    p_category VARCHAR DEFAULT NULL,
    p_include_general BOOLEAN DEFAULT FALSE,
    p_sort_by VARCHAR DEFAULT 'created_at',
    p_sort_direction VARCHAR DEFAULT 'desc',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    file_name TEXT,
    file_path TEXT,
    file_size BIGINT,
    file_type VARCHAR,
    mime_type VARCHAR,
    document_category VARCHAR,
    document_year INTEGER,
    harvest_year INTEGER,
    crop_season VARCHAR,
    urgency_level VARCHAR,
    is_shared BOOLEAN,
    shared_date TIMESTAMPTZ,
    tags TEXT[],
    description TEXT,
    download_count INTEGER,
    thumbnail_url TEXT,
    preview_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    created_by UUID,
    trip_id UUID,
    created_during_trip BOOLEAN,
    trip_activity_id UUID,
    trip_association_type VARCHAR,
    supplier_name TEXT,
    supplier_country VARCHAR,
    creator_name TEXT,
    creator_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.id,
        cd.file_name,
        cd.file_path,
        cd.file_size,
        cd.file_type,
        cd.mime_type,
        cd.document_category,
        cd.document_year,
        cd.harvest_year,
        cd.crop_season,
        cd.urgency_level,
        cd.is_shared,
        cd.shared_date,
        cd.tags,
        cd.description,
        cd.download_count,
        cd.thumbnail_url,
        cd.preview_url,
        cd.created_at,
        cd.updated_at,
        cd.created_by,
        cd.trip_id,
        cd.created_during_trip,
        cd.trip_activity_id,
        cd.trip_association_type,
        c.name as supplier_name,
        c.country as supplier_country,
        u.full_name as creator_name,
        u.email as creator_email
    FROM public.company_documents cd
    LEFT JOIN public.companies c ON (cd.supplier_id = c.id OR cd.company_id = c.id)
    LEFT JOIN public.users u ON cd.created_by = u.id
    WHERE cd.is_folder = FALSE
      AND (
          -- Trip-specific filtering
          (p_trip_id IS NOT NULL AND cd.trip_id = p_trip_id) OR
          -- Include general company documents if requested
          (p_include_general = TRUE AND cd.trip_id IS NULL) OR
          -- When no trip filter is specified, show all
          (p_trip_id IS NULL)
      )
      AND (p_supplier_id IS NULL OR cd.supplier_id = p_supplier_id OR cd.company_id = p_supplier_id)
      AND (p_document_year IS NULL OR cd.document_year = p_document_year)
      AND (p_category IS NULL OR cd.document_category = p_category)
    ORDER BY
        CASE 
            WHEN p_sort_by = 'file_name' AND p_sort_direction = 'asc' THEN cd.file_name
        END ASC,
        CASE 
            WHEN p_sort_by = 'file_name' AND p_sort_direction = 'desc' THEN cd.file_name
        END DESC,
        CASE 
            WHEN p_sort_by = 'created_at' AND p_sort_direction = 'asc' THEN cd.created_at
        END ASC,
        CASE 
            WHEN p_sort_by = 'created_at' AND p_sort_direction = 'desc' THEN cd.created_at
        END DESC,
        CASE 
            WHEN p_sort_by = 'file_size' AND p_sort_direction = 'asc' THEN cd.file_size
        END ASC,
        CASE 
            WHEN p_sort_by = 'file_size' AND p_sort_direction = 'desc' THEN cd.file_size
        END DESC,
        -- Default sort
        cd.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get suppliers with trip-specific document counts
CREATE OR REPLACE FUNCTION public.get_trip_suppliers(
    p_trip_id UUID DEFAULT NULL,
    p_include_all BOOLEAN DEFAULT TRUE,
    p_sort_by VARCHAR DEFAULT 'name',
    p_sort_direction VARCHAR DEFAULT 'asc',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    fantasy_name TEXT,
    country VARCHAR,
    company_type VARCHAR,
    created_at TIMESTAMPTZ,
    total_documents BIGINT,
    trip_documents BIGINT,
    has_recent_activity BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.fantasy_name,
        c.country,
        c.company_type,
        c.created_at,
        COUNT(cd.*) as total_documents,
        COUNT(cd.*) FILTER (WHERE cd.trip_id = p_trip_id) as trip_documents,
        (COUNT(cd.*) FILTER (WHERE cd.created_at >= CURRENT_DATE - INTERVAL '30 days') > 0) as has_recent_activity
    FROM public.companies c
    LEFT JOIN public.company_documents cd ON (c.id = cd.company_id OR c.id = cd.supplier_id)
    WHERE c.company_type IN ('roaster_dealer', 'exporter_coop')
      AND cd.is_folder = FALSE
      AND (
          -- When trip filtering, only show suppliers with trip documents or all if include_all
          (p_trip_id IS NULL) OR
          (p_trip_id IS NOT NULL AND cd.trip_id = p_trip_id) OR
          (p_trip_id IS NOT NULL AND p_include_all = TRUE)
      )
    GROUP BY c.id, c.name, c.fantasy_name, c.country, c.company_type, c.created_at
    HAVING 
        -- When filtering by trip, only show suppliers with documents or include all
        (p_trip_id IS NULL) OR 
        (p_include_all = TRUE) OR
        (COUNT(cd.*) FILTER (WHERE cd.trip_id = p_trip_id) > 0)
    ORDER BY
        CASE 
            WHEN p_sort_by = 'name' AND p_sort_direction = 'asc' THEN c.name
        END ASC,
        CASE 
            WHEN p_sort_by = 'name' AND p_sort_direction = 'desc' THEN c.name
        END DESC,
        CASE 
            WHEN p_sort_by = 'total_documents' AND p_sort_direction = 'asc' THEN COUNT(cd.*)
        END ASC,
        CASE 
            WHEN p_sort_by = 'total_documents' AND p_sort_direction = 'desc' THEN COUNT(cd.*)
        END DESC,
        -- Default sort
        c.name ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced auto-organize function with trip context
CREATE OR REPLACE FUNCTION public.auto_organize_document(
    p_document_id UUID,
    p_supplier_id UUID DEFAULT NULL,
    p_trip_id UUID DEFAULT NULL,
    p_auto_year BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
DECLARE
    v_doc RECORD;
    v_supplier_name TEXT;
    v_year INTEGER;
    v_supplier_folder_id UUID;
    v_year_folder_id UUID;
    v_folder_path TEXT;
    v_trip_code TEXT;
BEGIN
    -- Get document details
    SELECT * INTO v_doc FROM public.company_documents WHERE id = p_document_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found: %', p_document_id;
    END IF;

    -- Get trip information if provided
    IF p_trip_id IS NOT NULL THEN
        SELECT access_code INTO v_trip_code FROM public.trips WHERE id = p_trip_id;
    END IF;

    -- Determine supplier
    IF p_supplier_id IS NOT NULL THEN
        SELECT name INTO v_supplier_name FROM public.companies WHERE id = p_supplier_id;
    ELSIF v_doc.supplier_id IS NOT NULL THEN
        SELECT name INTO v_supplier_name FROM public.companies WHERE id = v_doc.supplier_id;
    ELSIF v_doc.company_id IS NOT NULL THEN
        SELECT name INTO v_supplier_name FROM public.companies WHERE id = v_doc.company_id;
    ELSE
        RAISE EXCEPTION 'No supplier found for document: %', p_document_id;
    END IF;

    -- Determine year
    IF p_auto_year THEN
        v_year := COALESCE(v_doc.harvest_year, v_doc.document_year, EXTRACT(YEAR FROM v_doc.created_at));
    ELSE
        v_year := v_doc.document_year;
    END IF;

    -- Update the document with trip association
    UPDATE public.company_documents
    SET 
        supplier_id = p_supplier_id,
        trip_id = p_trip_id,
        created_during_trip = (p_trip_id IS NOT NULL),
        document_year = v_year,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_document_id;

    -- Log the organization action with trip context
    INSERT INTO public.company_access_logs (
        company_id, user_id, document_id, action_type, action_details
    )
    VALUES (
        v_doc.company_id, v_doc.updated_by, p_document_id, 'auto_organize',
        jsonb_build_object(
            'supplier_name', v_supplier_name,
            'year', v_year,
            'trip_id', p_trip_id,
            'trip_code', v_trip_code,
            'created_during_trip', (p_trip_id IS NOT NULL)
        )
    );

EXCEPTION WHEN unique_violation THEN
    -- Handle constraint violations gracefully
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for new functions
GRANT SELECT ON public.trip_document_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_filtered_documents TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trip_suppliers TO authenticated;

-- Comments for documentation
COMMENT ON COLUMN public.company_documents.trip_id IS 'Associates document with a specific trip';
COMMENT ON COLUMN public.company_documents.created_during_trip IS 'Indicates if document was created during a trip';
COMMENT ON COLUMN public.company_documents.trip_activity_id IS 'Associates document with a specific trip activity';
COMMENT ON COLUMN public.company_documents.trip_association_type IS 'Type of trip association (general, activity_note, meeting_record, etc.)';

COMMENT ON VIEW public.trip_document_stats IS 'Statistics for documents associated with specific trips';
COMMENT ON FUNCTION public.get_trip_filtered_documents IS 'Get documents filtered by trip context with optional general document inclusion';
COMMENT ON FUNCTION public.get_trip_suppliers IS 'Get suppliers with trip-specific document counts and filtering';