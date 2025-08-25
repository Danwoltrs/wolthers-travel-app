-- Migration: Add comprehensive company management features
-- Created: 2025-08-20
-- Description: Enhance company management with types, staff, documents, and statistics

-- Add company type and additional fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS company_type VARCHAR(50) DEFAULT 'roaster_dealer' 
  CHECK (company_type IN ('roaster_dealer', 'exporter_coop', 'service_provider')),
ADD COLUMN IF NOT EXISTS company_subtype VARCHAR(100),
ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(255), -- For MySQL migration reference
ADD COLUMN IF NOT EXISTS trip_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost_usd DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_visit_date DATE,
ADD COLUMN IF NOT EXISTS primary_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS primary_contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS primary_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS tags TEXT[], -- Array of tags for categorization
ADD COLUMN IF NOT EXISTS industry_certifications TEXT[]; -- e.g., ['Fair Trade', 'Organic', 'Rainforest Alliance']

-- Create company_staff table for managing company employees
CREATE TABLE IF NOT EXISTS public.company_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.company_locations(id) ON DELETE SET NULL,
    
    -- Personal information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    position VARCHAR(255),
    department VARCHAR(255),
    
    -- Professional details
    role_type VARCHAR(50) DEFAULT 'staff' CHECK (role_type IN ('owner', 'executive', 'manager', 'staff', 'consultant')),
    is_primary_contact BOOLEAN DEFAULT FALSE,
    is_decision_maker BOOLEAN DEFAULT FALSE,
    
    -- Communication preferences
    preferred_contact_method VARCHAR(50) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp', 'in_person')),
    language_preference VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50),
    
    -- Social and professional networks
    linkedin_url VARCHAR(500),
    twitter_handle VARCHAR(100),
    
    -- Notes and metadata
    notes TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_contact_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Create company_documents table for document management
CREATE TABLE IF NOT EXISTS public.company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES public.trip_meetings(id) ON DELETE CASCADE,
    
    -- Document information
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storage path
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(255),
    
    -- Folder structure
    parent_folder_id UUID REFERENCES public.company_documents(id) ON DELETE CASCADE,
    is_folder BOOLEAN DEFAULT FALSE,
    folder_name VARCHAR(255),
    folder_path TEXT, -- Full path like "Company/2025/Brazil Trip"
    
    -- Document categorization
    document_category VARCHAR(100) DEFAULT 'general' 
      CHECK (document_category IN ('contract', 'presentation', 'report', 'sample', 'price_list', 'certificate', 'correspondence', 'general')),
    document_year INTEGER,
    
    -- Access control
    access_level VARCHAR(50) DEFAULT 'internal' 
      CHECK (access_level IN ('public', 'internal', 'restricted', 'confidential')),
    visible_to_company BOOLEAN DEFAULT FALSE, -- Can company staff see this?
    visible_to_participants BOOLEAN DEFAULT TRUE, -- Can trip participants see this?
    
    -- Metadata
    description TEXT,
    tags TEXT[],
    version_number INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT TRUE,
    previous_version_id UUID REFERENCES public.company_documents(id),
    
    -- Audit
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_by UUID REFERENCES public.users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Create company_statistics table for performance caching
CREATE TABLE IF NOT EXISTS public.company_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Time period
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('month', 'quarter', 'year', 'all_time')),
    period_year INTEGER,
    period_month INTEGER,
    period_quarter INTEGER,
    
    -- Trip statistics
    trip_count INTEGER DEFAULT 0,
    meeting_count INTEGER DEFAULT 0,
    unique_staff_count INTEGER DEFAULT 0, -- Unique Wolthers staff who visited
    
    -- Financial statistics
    total_travel_cost DECIMAL(12,2) DEFAULT 0.00,
    total_meeting_cost DECIMAL(12,2) DEFAULT 0.00,
    total_hotel_cost DECIMAL(12,2) DEFAULT 0.00,
    total_flight_cost DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Engagement metrics
    document_count INTEGER DEFAULT 0,
    note_count INTEGER DEFAULT 0,
    last_interaction_date DATE,
    interaction_score INTEGER DEFAULT 0, -- Calculated engagement score
    
    -- Top contributors (JSON array of {user_id, name, trip_count})
    top_visitors JSONB DEFAULT '[]',
    
    -- Cached heatmap data
    heatmap_data JSONB,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- When to recalculate
    
    UNIQUE(company_id, period_type, period_year, period_month, period_quarter)
);

-- Create company_access_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.company_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.company_documents(id) ON DELETE CASCADE,
    
    -- Action details
    action_type VARCHAR(50) NOT NULL 
      CHECK (action_type IN ('view', 'download', 'upload', 'edit', 'delete', 'share')),
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_type ON public.companies(company_type);
CREATE INDEX IF NOT EXISTS idx_companies_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_legacy_id ON public.companies(legacy_id);

CREATE INDEX IF NOT EXISTS idx_company_staff_company_id ON public.company_staff(company_id);
CREATE INDEX IF NOT EXISTS idx_company_staff_location_id ON public.company_staff(location_id);
CREATE INDEX IF NOT EXISTS idx_company_staff_email ON public.company_staff(email);
CREATE INDEX IF NOT EXISTS idx_company_staff_primary ON public.company_staff(is_primary_contact) WHERE is_primary_contact = TRUE;

CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON public.company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_trip_id ON public.company_documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_parent_folder ON public.company_documents(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_category ON public.company_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_company_documents_year ON public.company_documents(document_year);
CREATE INDEX IF NOT EXISTS idx_company_documents_folder_path ON public.company_documents(folder_path);

CREATE INDEX IF NOT EXISTS idx_company_statistics_company_id ON public.company_statistics(company_id);
CREATE INDEX IF NOT EXISTS idx_company_statistics_period ON public.company_statistics(period_type, period_year);

CREATE INDEX IF NOT EXISTS idx_company_access_logs_company_id ON public.company_access_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_company_access_logs_user_id ON public.company_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_company_access_logs_document_id ON public.company_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_company_access_logs_created_at ON public.company_access_logs(created_at);

-- Add triggers for updated_at
CREATE TRIGGER update_company_staff_updated_at
    BEFORE UPDATE ON public.company_staff
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_company_documents_updated_at
    BEFORE UPDATE ON public.company_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies for company_staff
ALTER TABLE public.company_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wolthers_staff_manage_company_staff" ON public.company_staff
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (is_global_admin = TRUE OR company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0') -- Wolthers company ID
        )
    );

CREATE POLICY "company_view_own_staff" ON public.company_staff
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() 
            AND u.company_id = company_staff.company_id
        )
    );

-- RLS Policies for company_documents
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wolthers_staff_manage_documents" ON public.company_documents
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (is_global_admin = TRUE OR company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0')
        )
    );

CREATE POLICY "company_view_shared_documents" ON public.company_documents
    FOR SELECT TO authenticated
    USING (
        visible_to_company = TRUE AND
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() 
            AND u.company_id = company_documents.company_id
        )
    );

CREATE POLICY "participants_view_trip_documents" ON public.company_documents
    FOR SELECT TO authenticated
    USING (
        visible_to_participants = TRUE AND
        trip_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.trip_participants tp
            WHERE tp.trip_id = company_documents.trip_id
            AND tp.user_id = auth.uid()
        )
    );

-- RLS Policies for company_statistics
ALTER TABLE public.company_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_company_statistics" ON public.company_statistics
    FOR SELECT TO authenticated
    USING (
        -- Wolthers staff can see all
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (is_global_admin = TRUE OR company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0')
        ) OR
        -- Company staff can see their own
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() 
            AND u.company_id = company_statistics.company_id
        )
    );

-- RLS Policies for company_access_logs
ALTER TABLE public.company_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wolthers_view_all_logs" ON public.company_access_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND (is_global_admin = TRUE OR company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0')
        )
    );

CREATE POLICY "users_view_own_logs" ON public.company_access_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Function to calculate company statistics
CREATE OR REPLACE FUNCTION public.calculate_company_statistics(
    p_company_id UUID,
    p_period_type VARCHAR(20),
    p_year INTEGER DEFAULT NULL,
    p_month INTEGER DEFAULT NULL,
    p_quarter INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_stats RECORD;
BEGIN
    -- Determine date range based on period type
    IF p_period_type = 'month' THEN
        v_start_date := DATE(p_year || '-' || p_month || '-01');
        v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;
    ELSIF p_period_type = 'quarter' THEN
        v_start_date := DATE(p_year || '-' || ((p_quarter - 1) * 3 + 1) || '-01');
        v_end_date := (v_start_date + INTERVAL '3 months - 1 day')::DATE;
    ELSIF p_period_type = 'year' THEN
        v_start_date := DATE(p_year || '-01-01');
        v_end_date := DATE(p_year || '-12-31');
    ELSE -- all_time
        v_start_date := '2000-01-01'::DATE;
        v_end_date := '2099-12-31'::DATE;
    END IF;
    
    -- Calculate statistics
    WITH trip_stats AS (
        SELECT 
            COUNT(DISTINCT t.id) as trip_count,
            COUNT(DISTINCT tm.id) as meeting_count,
            COUNT(DISTINCT tp.user_id) as unique_staff_count,
            COALESCE(SUM(tm.total_estimated_cost), 0) as total_meeting_cost,
            COALESCE(SUM(th.cost_amount), 0) as total_hotel_cost,
            COALESCE(SUM(tf.cost_amount), 0) as total_flight_cost
        FROM public.trips t
        LEFT JOIN public.trip_meetings tm ON t.id = tm.trip_id 
            AND tm.company_id = p_company_id
        LEFT JOIN public.trip_participants tp ON t.id = tp.trip_id
            AND tp.user_id IN (SELECT id FROM public.users WHERE company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0')
        LEFT JOIN public.trip_hotels th ON t.id = th.trip_id
        LEFT JOIN public.trip_flights tf ON t.id = tf.trip_id
        WHERE t.start_date >= v_start_date 
            AND t.end_date <= v_end_date
            AND EXISTS (
                SELECT 1 FROM public.trip_meetings tm2 
                WHERE tm2.trip_id = t.id AND tm2.company_id = p_company_id
            )
    ),
    document_stats AS (
        SELECT 
            COUNT(*) as document_count
        FROM public.company_documents
        WHERE company_id = p_company_id
            AND is_folder = FALSE
            AND created_at >= v_start_date
            AND created_at <= v_end_date + INTERVAL '1 day'
    ),
    top_visitors AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'user_id', user_id,
                    'name', full_name,
                    'trip_count', trip_count
                ) ORDER BY trip_count DESC
            ) FILTER (WHERE row_num <= 5) as top_visitors_json
        FROM (
            SELECT 
                tp.user_id,
                u.full_name,
                COUNT(DISTINCT tp.trip_id) as trip_count,
                ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT tp.trip_id) DESC) as row_num
            FROM public.trip_participants tp
            JOIN public.users u ON tp.user_id = u.id
            JOIN public.trips t ON tp.trip_id = t.id
            WHERE u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
                AND t.start_date >= v_start_date
                AND t.end_date <= v_end_date
                AND EXISTS (
                    SELECT 1 FROM public.trip_meetings tm 
                    WHERE tm.trip_id = t.id AND tm.company_id = p_company_id
                )
            GROUP BY tp.user_id, u.full_name
        ) ranked
    )
    SELECT 
        ts.*,
        ds.document_count,
        tv.top_visitors_json
    INTO v_stats
    FROM trip_stats ts
    CROSS JOIN document_stats ds
    CROSS JOIN top_visitors tv;
    
    -- Insert or update statistics
    INSERT INTO public.company_statistics (
        company_id,
        period_type,
        period_year,
        period_month,
        period_quarter,
        trip_count,
        meeting_count,
        unique_staff_count,
        total_travel_cost,
        total_meeting_cost,
        total_hotel_cost,
        total_flight_cost,
        document_count,
        top_visitors,
        calculated_at,
        expires_at
    ) VALUES (
        p_company_id,
        p_period_type,
        p_year,
        p_month,
        p_quarter,
        v_stats.trip_count,
        v_stats.meeting_count,
        v_stats.unique_staff_count,
        v_stats.total_meeting_cost + v_stats.total_hotel_cost + v_stats.total_flight_cost,
        v_stats.total_meeting_cost,
        v_stats.total_hotel_cost,
        v_stats.total_flight_cost,
        v_stats.document_count,
        COALESCE(v_stats.top_visitors_json, '[]'::jsonb),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '1 day'
    )
    ON CONFLICT (company_id, period_type, period_year, period_month, period_quarter)
    DO UPDATE SET
        trip_count = EXCLUDED.trip_count,
        meeting_count = EXCLUDED.meeting_count,
        unique_staff_count = EXCLUDED.unique_staff_count,
        total_travel_cost = EXCLUDED.total_travel_cost,
        total_meeting_cost = EXCLUDED.total_meeting_cost,
        total_hotel_cost = EXCLUDED.total_hotel_cost,
        total_flight_cost = EXCLUDED.total_flight_cost,
        document_count = EXCLUDED.document_count,
        top_visitors = EXCLUDED.top_visitors,
        calculated_at = EXCLUDED.calculated_at,
        expires_at = EXCLUDED.expires_at;
    
    -- Update company summary statistics
    UPDATE public.companies
    SET 
        trip_count = v_stats.trip_count,
        total_cost_usd = v_stats.total_meeting_cost + v_stats.total_hotel_cost + v_stats.total_flight_cost,
        last_visit_date = (
            SELECT MAX(t.end_date)
            FROM public.trips t
            JOIN public.trip_meetings tm ON t.id = tm.trip_id
            WHERE tm.company_id = p_company_id
        )
    WHERE id = p_company_id
        AND p_period_type = 'all_time';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_documents TO authenticated;
GRANT SELECT ON public.company_statistics TO authenticated;
GRANT SELECT, INSERT ON public.company_access_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_company_statistics(UUID, VARCHAR, INTEGER, INTEGER, INTEGER) TO authenticated;

-- Comments
COMMENT ON TABLE public.company_staff IS 'Staff members and contacts for each company';
COMMENT ON TABLE public.company_documents IS 'Document management system with folder structure for companies';
COMMENT ON TABLE public.company_statistics IS 'Cached statistics for company performance and analytics';
COMMENT ON TABLE public.company_access_logs IS 'Audit trail for document access and company interactions';
COMMENT ON FUNCTION public.calculate_company_statistics IS 'Calculate and cache company statistics for a given time period';