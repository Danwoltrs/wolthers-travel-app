-- Migration: Enhance document management for coffee supply chain finder interface
-- Created: 2025-08-21
-- Description: Add coffee-specific document management features for Finder-style interface

-- Add coffee supply chain specific columns to company_documents
ALTER TABLE public.company_documents 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS crop_season VARCHAR(20), -- e.g., '2024-2025'
ADD COLUMN IF NOT EXISTS harvest_year INTEGER,
ADD COLUMN IF NOT EXISTS crop_types TEXT[], -- ['arabica', 'robusta']
ADD COLUMN IF NOT EXISTS regions TEXT[], -- Geographic regions
ADD COLUMN IF NOT EXISTS certifications TEXT[], -- ['organic', 'fairtrade', 'rainforest-alliance']
ADD COLUMN IF NOT EXISTS quality_grade VARCHAR(50), -- 'specialty', 'premium', 'commercial'
ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'medium' 
  CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shared_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS shared_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS preview_url TEXT,

-- Enhanced crop-specific metadata
ADD COLUMN IF NOT EXISTS crop_metadata JSONB DEFAULT '{}', -- Flexible crop data storage
ADD COLUMN IF NOT EXISTS contract_metadata JSONB DEFAULT '{}', -- Contract-specific fields
ADD COLUMN IF NOT EXISTS quality_metadata JSONB DEFAULT '{}'; -- Quality report fields

-- Update document categories for coffee supply chain
ALTER TABLE public.company_documents 
DROP CONSTRAINT IF EXISTS company_documents_document_category_check,
ADD CONSTRAINT company_documents_document_category_check 
  CHECK (document_category IN (
    'contract', 'presentation', 'report', 'sample', 'price_list', 
    'certificate', 'correspondence', 'general',
    -- Coffee-specific categories
    'crop_forecast', 'harvest_report', 'quality_analysis', 'market_update',
    'cupping_notes', 'shipping_docs', 'lab_results', 'farm_visit_report'
  ));

-- Create supplier document statistics view
CREATE OR REPLACE VIEW public.supplier_document_stats AS
SELECT 
    c.id as supplier_id,
    c.name as supplier_name,
    c.country,
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE cd.document_year = EXTRACT(YEAR FROM CURRENT_DATE)) as current_year_docs,
    COUNT(*) FILTER (WHERE cd.document_year = EXTRACT(YEAR FROM CURRENT_DATE) - 1) as previous_year_docs,
    COUNT(DISTINCT cd.document_year) as years_active,
    MAX(cd.created_at) as last_document_date,
    SUM(cd.file_size) as total_size,
    COUNT(*) FILTER (WHERE cd.urgency_level = 'critical') as critical_docs,
    COUNT(*) FILTER (WHERE cd.urgency_level = 'high') as high_priority_docs,
    COUNT(*) FILTER (WHERE cd.document_category = 'crop_forecast') as forecast_docs,
    COUNT(*) FILTER (WHERE cd.document_category = 'quality_analysis') as quality_docs,
    COUNT(*) FILTER (WHERE cd.document_category = 'contract') as contract_docs,
    -- Recent document titles for preview
    array_agg(cd.file_name ORDER BY cd.created_at DESC) 
      FILTER (WHERE cd.created_at >= CURRENT_DATE - INTERVAL '30 days') 
      LIMIT 5 as recent_documents
FROM public.companies c
LEFT JOIN public.company_documents cd ON c.id = cd.company_id OR c.id = cd.supplier_id
WHERE c.company_type IN ('roaster_dealer', 'exporter_coop') 
  AND cd.is_folder = FALSE
GROUP BY c.id, c.name, c.country;

-- Create document folder hierarchy view for efficient navigation
CREATE OR REPLACE VIEW public.document_folder_hierarchy AS
WITH RECURSIVE folder_tree AS (
    -- Root suppliers (top level)
    SELECT 
        cd.id,
        cd.company_id,
        cd.supplier_id,
        cd.file_name as name,
        cd.folder_path,
        cd.is_folder,
        cd.document_year,
        0 as level,
        cd.folder_path as full_path,
        c.name as supplier_name
    FROM public.company_documents cd
    JOIN public.companies c ON (c.id = cd.company_id OR c.id = cd.supplier_id)
    WHERE cd.parent_folder_id IS NULL
    
    UNION ALL
    
    -- Child folders and documents
    SELECT 
        cd.id,
        cd.company_id,
        cd.supplier_id,
        cd.file_name as name,
        cd.folder_path,
        cd.is_folder,
        cd.document_year,
        ft.level + 1,
        ft.full_path || '/' || cd.file_name as full_path,
        ft.supplier_name
    FROM public.company_documents cd
    JOIN folder_tree ft ON ft.id = cd.parent_folder_id
)
SELECT 
    ft.*,
    COUNT(*) FILTER (WHERE level = ft.level + 1) as direct_children,
    COUNT(*) FILTER (WHERE NOT is_folder) as document_count,
    SUM(CASE WHEN NOT is_folder THEN 1 ELSE 0 END) as total_documents
FROM folder_tree ft
LEFT JOIN folder_tree child ON child.full_path LIKE ft.full_path || '%'
GROUP BY ft.id, ft.company_id, ft.supplier_id, ft.name, ft.folder_path, 
         ft.is_folder, ft.document_year, ft.level, ft.full_path, ft.supplier_name;

-- Create crop information dashboard view
CREATE OR REPLACE VIEW public.crop_information_dashboard AS
SELECT 
    cd.id,
    cd.file_name as title,
    cd.file_name as filename,
    c.name as supplier,
    cd.supplier_id,
    u.full_name as shared_by,
    cd.shared_by as shared_by_id,
    cd.shared_date,
    cd.file_size as size,
    cd.file_type,
    cd.document_category as category,
    cd.urgency_level as urgency,
    cd.last_accessed_at IS NOT NULL as is_read,
    CASE 
        WHEN cd.document_category = 'crop_forecast' THEN cd.crop_metadata
        WHEN cd.document_category = 'quality_analysis' THEN cd.quality_metadata
        ELSE '{}'::jsonb
    END as preview_data,
    '/api/documents/coffee-supply/' || cd.id || '/download' as download_url,
    cd.thumbnail_url,
    cd.created_at,
    cd.updated_at
FROM public.company_documents cd
LEFT JOIN public.companies c ON (c.id = cd.company_id OR c.id = cd.supplier_id)
LEFT JOIN public.users u ON u.id = cd.shared_by
WHERE cd.document_category IN ('crop_forecast', 'harvest_report', 'quality_analysis', 'market_update')
  AND cd.is_folder = FALSE
ORDER BY cd.urgency_level DESC, cd.created_at DESC;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_company_documents_supplier_id ON public.company_documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_harvest_year ON public.company_documents(harvest_year);
CREATE INDEX IF NOT EXISTS idx_company_documents_crop_season ON public.company_documents(crop_season);
CREATE INDEX IF NOT EXISTS idx_company_documents_urgency ON public.company_documents(urgency_level);
CREATE INDEX IF NOT EXISTS idx_company_documents_shared ON public.company_documents(is_shared) WHERE is_shared = TRUE;
CREATE INDEX IF NOT EXISTS idx_company_documents_crop_metadata ON public.company_documents USING GIN(crop_metadata);
CREATE INDEX IF NOT EXISTS idx_company_documents_quality_metadata ON public.company_documents USING GIN(quality_metadata);
CREATE INDEX IF NOT EXISTS idx_company_documents_full_text ON public.company_documents USING GIN(to_tsvector('english', file_name || ' ' || COALESCE(description, '')));

-- Function to auto-organize documents into Supplier > Year > Files structure
CREATE OR REPLACE FUNCTION public.auto_organize_document(
    p_document_id UUID,
    p_supplier_id UUID DEFAULT NULL,
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
BEGIN
    -- Get document details
    SELECT * INTO v_doc FROM public.company_documents WHERE id = p_document_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found: %', p_document_id;
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

    -- Create or find supplier folder
    INSERT INTO public.company_documents (
        company_id, supplier_id, file_name, folder_name, folder_path, 
        is_folder, file_path, file_size, file_type, mime_type,
        created_by, updated_by
    )
    VALUES (
        v_doc.company_id, p_supplier_id, v_supplier_name, v_supplier_name, 
        v_supplier_name, TRUE, '/', 0, 'folder', 'application/x-folder',
        v_doc.created_by, v_doc.updated_by
    )
    ON CONFLICT ON CONSTRAINT unique_supplier_folder 
    DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_supplier_folder_id;

    -- Create constraint for unique supplier folders if not exists
    ALTER TABLE public.company_documents 
    ADD CONSTRAINT unique_supplier_folder 
    UNIQUE (supplier_id, folder_name) 
    WHERE is_folder = TRUE AND parent_folder_id IS NULL;

    -- Create or find year folder within supplier
    v_folder_path := v_supplier_name || '/' || v_year::text;
    
    INSERT INTO public.company_documents (
        company_id, supplier_id, parent_folder_id, file_name, folder_name, 
        folder_path, document_year, is_folder, file_path, file_size, 
        file_type, mime_type, created_by, updated_by
    )
    VALUES (
        v_doc.company_id, p_supplier_id, v_supplier_folder_id, v_year::text, 
        v_year::text, v_folder_path, v_year, TRUE, '/', 0, 
        'folder', 'application/x-folder', v_doc.created_by, v_doc.updated_by
    )
    ON CONFLICT ON CONSTRAINT unique_year_folder 
    DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_year_folder_id;

    -- Create constraint for unique year folders if not exists
    ALTER TABLE public.company_documents 
    ADD CONSTRAINT unique_year_folder 
    UNIQUE (supplier_id, parent_folder_id, document_year) 
    WHERE is_folder = TRUE AND document_year IS NOT NULL;

    -- Update the document to be in the year folder
    UPDATE public.company_documents
    SET 
        parent_folder_id = v_year_folder_id,
        supplier_id = p_supplier_id,
        document_year = v_year,
        folder_path = v_folder_path || '/' || file_name,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_document_id;

    -- Log the organization action
    INSERT INTO public.company_access_logs (
        company_id, user_id, document_id, action_type, action_details
    )
    VALUES (
        v_doc.company_id, v_doc.updated_by, p_document_id, 'auto_organize',
        jsonb_build_object(
            'supplier_name', v_supplier_name,
            'year', v_year,
            'folder_path', v_folder_path
        )
    );

EXCEPTION WHEN unique_violation THEN
    -- Handle constraint violations gracefully
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for automatic file categorization based on filename and content
CREATE OR REPLACE FUNCTION public.categorize_document(
    p_document_id UUID
)
RETURNS VARCHAR(100) AS $$
DECLARE
    v_doc RECORD;
    v_filename TEXT;
    v_category VARCHAR(100) := 'general';
BEGIN
    -- Get document details
    SELECT file_name, file_type INTO v_doc FROM public.company_documents WHERE id = p_document_id;
    IF NOT FOUND THEN
        RETURN 'general';
    END IF;
    
    v_filename := LOWER(v_doc.file_name);
    
    -- Categorization rules based on filename patterns
    IF v_filename LIKE '%forecast%' OR v_filename LIKE '%prediction%' THEN
        v_category := 'crop_forecast';
    ELSIF v_filename LIKE '%harvest%' OR v_filename LIKE '%yield%' THEN
        v_category := 'harvest_report';
    ELSIF v_filename LIKE '%quality%' OR v_filename LIKE '%cupping%' OR v_filename LIKE '%grade%' THEN
        v_category := 'quality_analysis';
    ELSIF v_filename LIKE '%contract%' OR v_filename LIKE '%agreement%' THEN
        v_category := 'contract';
    ELSIF v_filename LIKE '%price%' OR v_filename LIKE '%cost%' OR v_filename LIKE '%market%' THEN
        v_category := 'market_update';
    ELSIF v_filename LIKE '%certificate%' OR v_filename LIKE '%cert%' OR v_filename LIKE '%organic%' OR v_filename LIKE '%fairtrade%' THEN
        v_category := 'certificate';
    ELSIF v_filename LIKE '%lab%' OR v_filename LIKE '%test%' OR v_filename LIKE '%analysis%' THEN
        v_category := 'lab_results';
    ELSIF v_filename LIKE '%visit%' OR v_filename LIKE '%farm%' OR v_filename LIKE '%inspection%' THEN
        v_category := 'farm_visit_report';
    ELSIF v_filename LIKE '%ship%' OR v_filename LIKE '%export%' OR v_filename LIKE '%import%' THEN
        v_category := 'shipping_docs';
    ELSIF v_doc.file_type IN ('application/pdf') AND (v_filename LIKE '%presentation%' OR v_filename LIKE '%slide%') THEN
        v_category := 'presentation';
    ELSIF v_doc.file_type LIKE 'application/vnd.ms-excel%' OR v_doc.file_type = 'text/csv' THEN
        v_category := 'report';
    END IF;
    
    -- Update the document category
    UPDATE public.company_documents 
    SET document_category = v_category, updated_at = CURRENT_TIMESTAMP 
    WHERE id = p_document_id;
    
    RETURN v_category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-categorize and organize documents on insert/update
CREATE OR REPLACE FUNCTION public.trigger_document_processing()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process actual documents, not folders
    IF NEW.is_folder = FALSE THEN
        -- Auto-categorize if category is 'general'
        IF NEW.document_category = 'general' OR NEW.document_category IS NULL THEN
            NEW.document_category := public.categorize_document(NEW.id);
        END IF;
        
        -- Auto-organize into folder structure if not already organized
        IF NEW.parent_folder_id IS NULL AND NEW.supplier_id IS NOT NULL THEN
            PERFORM public.auto_organize_document(NEW.id, NEW.supplier_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_document_auto_processing ON public.company_documents;
CREATE TRIGGER trigger_document_auto_processing
    AFTER INSERT OR UPDATE ON public.company_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_document_processing();

-- Grant permissions
GRANT SELECT ON public.supplier_document_stats TO authenticated;
GRANT SELECT ON public.document_folder_hierarchy TO authenticated;
GRANT SELECT ON public.crop_information_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_organize_document(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.categorize_document(UUID) TO authenticated;

-- Comments
COMMENT ON VIEW public.supplier_document_stats IS 'Statistics view for supplier document management with coffee-specific metrics';
COMMENT ON VIEW public.document_folder_hierarchy IS 'Hierarchical view of document folder structure for efficient navigation';
COMMENT ON VIEW public.crop_information_dashboard IS 'Specialized view for crop-related documents with urgency and preview data';
COMMENT ON FUNCTION public.auto_organize_document IS 'Automatically organize documents into Supplier > Year > Files structure';
COMMENT ON FUNCTION public.categorize_document IS 'Automatically categorize documents based on filename patterns and content';