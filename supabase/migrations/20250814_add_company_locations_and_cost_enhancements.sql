-- Migration: Add company locations and enhance cost tracking
-- Created: 2025-08-14
-- Description: Add company_locations table and enhance cost tracking with per-person breakdowns

-- Create company_locations table
CREATE TABLE IF NOT EXISTS public.company_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    
    -- Location details
    location_type VARCHAR(50) DEFAULT 'office' CHECK (location_type IN ('office', 'warehouse', 'store', 'factory', 'headquarters', 'branch', 'other')),
    is_primary_location BOOLEAN DEFAULT FALSE,
    is_meeting_location BOOLEAN DEFAULT TRUE, -- Can this location host meetings?
    
    -- Contact information
    phone VARCHAR(50),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    
    -- Meeting facilities
    meeting_room_capacity INTEGER,
    has_presentation_facilities BOOLEAN DEFAULT FALSE,
    has_catering BOOLEAN DEFAULT FALSE,
    parking_availability VARCHAR(100),
    accessibility_notes TEXT,
    
    -- Coordinates for mapping
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Add foreign key constraint to trip_meetings table
ALTER TABLE public.trip_meetings 
ADD CONSTRAINT fk_trip_meetings_company_location 
FOREIGN KEY (company_location_id) REFERENCES public.company_locations(id) ON DELETE SET NULL;

-- Enhance trip_meetings table with cost tracking
ALTER TABLE public.trip_meetings ADD COLUMN IF NOT EXISTS cost_per_person JSONB DEFAULT '{}';
ALTER TABLE public.trip_meetings ADD COLUMN IF NOT EXISTS total_estimated_cost DECIMAL(12,2);
ALTER TABLE public.trip_meetings ADD COLUMN IF NOT EXISTS cost_currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE public.trip_meetings ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '{}';

-- Enhance trip_flights table with cost tracking
ALTER TABLE public.trip_flights ADD COLUMN IF NOT EXISTS cost_per_person JSONB DEFAULT '{}';
ALTER TABLE public.trip_flights ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '{}';

-- Enhance trip_hotels table with cost tracking  
ALTER TABLE public.trip_hotels ADD COLUMN IF NOT EXISTS cost_per_person JSONB DEFAULT '{}';
ALTER TABLE public.trip_hotels ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_locations_company_id ON public.company_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_locations_primary ON public.company_locations(is_primary_location) WHERE is_primary_location = TRUE;
CREATE INDEX IF NOT EXISTS idx_company_locations_meeting ON public.company_locations(is_meeting_location) WHERE is_meeting_location = TRUE;
CREATE INDEX IF NOT EXISTS idx_company_locations_type ON public.company_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_company_locations_coords ON public.company_locations(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add updated_at trigger
CREATE TRIGGER update_company_locations_updated_at
    BEFORE UPDATE ON public.company_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies for company_locations
ALTER TABLE public.company_locations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view company locations for meeting planning
CREATE POLICY "authenticated_users_view_company_locations" ON public.company_locations
    FOR SELECT TO authenticated
    USING (TRUE); -- All authenticated users can view company locations

-- Allow authenticated users to manage company locations if they have proper permissions
CREATE POLICY "authenticated_users_manage_company_locations" ON public.company_locations
    FOR ALL TO authenticated
    USING (
        -- Global admins can manage all locations
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        ) OR
        -- Company admins can manage their company's locations
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.companies c ON u.company_id = c.id
            WHERE u.id = auth.uid() 
            AND u.user_type = 'admin'
            AND c.id = company_locations.company_id
        ) OR
        -- Creator can manage their created locations
        created_by = auth.uid()
    );

-- Function to calculate total meeting costs based on cost_per_person
CREATE OR REPLACE FUNCTION public.calculate_meeting_total_cost(meeting_costs JSONB)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    total_cost DECIMAL(12,2) := 0.00;
    person_key TEXT;
    person_cost JSONB;
BEGIN
    -- Iterate through each person's costs
    FOR person_key IN SELECT jsonb_object_keys(meeting_costs)
    LOOP
        person_cost := meeting_costs -> person_key;
        
        -- Sum up all cost categories for this person
        IF person_cost ? 'meals' THEN
            total_cost := total_cost + COALESCE((person_cost ->> 'meals')::DECIMAL(12,2), 0);
        END IF;
        
        IF person_cost ? 'transport' THEN
            total_cost := total_cost + COALESCE((person_cost ->> 'transport')::DECIMAL(12,2), 0);
        END IF;
        
        IF person_cost ? 'entertainment' THEN
            total_cost := total_cost + COALESCE((person_cost ->> 'entertainment')::DECIMAL(12,2), 0);
        END IF;
        
        IF person_cost ? 'materials' THEN
            total_cost := total_cost + COALESCE((person_cost ->> 'materials')::DECIMAL(12,2), 0);
        END IF;
        
        IF person_cost ? 'other' THEN
            total_cost := total_cost + COALESCE((person_cost ->> 'other')::DECIMAL(12,2), 0);
        END IF;
    END LOOP;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically update total_estimated_cost when cost_per_person changes
CREATE OR REPLACE FUNCTION public.update_meeting_cost_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total estimated cost based on cost_per_person data
    IF NEW.cost_per_person IS NOT NULL AND NEW.cost_per_person != '{}' THEN
        NEW.total_estimated_cost := public.calculate_meeting_total_cost(NEW.cost_per_person);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meeting_cost_totals_trigger
    BEFORE INSERT OR UPDATE OF cost_per_person ON public.trip_meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_meeting_cost_totals();

-- Function to get companies with their locations for dropdowns
CREATE OR REPLACE FUNCTION public.get_companies_with_locations()
RETURNS TABLE (
    company_id UUID,
    company_name VARCHAR(255),
    company_email VARCHAR(255),
    company_phone VARCHAR(50),
    location_count BIGINT,
    primary_location_id UUID,
    primary_location_name VARCHAR(255),
    primary_location_address TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        COALESCE(loc_count.location_count, 0) as location_count,
        primary_loc.id as primary_location_id,
        primary_loc.location_name as primary_location_name,
        CASE 
            WHEN primary_loc.address_line_2 IS NOT NULL THEN 
                primary_loc.address_line_1 || ', ' || primary_loc.address_line_2 || ', ' || primary_loc.city
            ELSE 
                primary_loc.address_line_1 || ', ' || primary_loc.city
        END as primary_location_address
    FROM public.companies c
    LEFT JOIN (
        SELECT company_id, COUNT(*) as location_count
        FROM public.company_locations
        WHERE is_meeting_location = TRUE
        GROUP BY company_id
    ) loc_count ON c.id = loc_count.company_id
    LEFT JOIN public.company_locations primary_loc ON c.id = primary_loc.company_id 
        AND primary_loc.is_primary_location = TRUE
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced view for trip summary with cost information
DROP VIEW IF EXISTS public.trip_summary_extended;
CREATE OR REPLACE VIEW public.trip_summary_extended AS
SELECT 
    t.*,
    COALESCE(hotel_count, 0) as hotel_count,
    COALESCE(flight_count, 0) as flight_count,
    COALESCE(meeting_count, 0) as meeting_count,
    COALESCE(notes_count, 0) as notes_count,
    COALESCE(file_count, 0) as file_count,
    COALESCE(total_hotel_costs, 0) as total_hotel_costs,
    COALESCE(total_flight_costs, 0) as total_flight_costs,
    COALESCE(total_meeting_costs, 0) as total_meeting_costs,
    COALESCE(total_hotel_costs, 0) + COALESCE(total_flight_costs, 0) + COALESCE(total_meeting_costs, 0) as total_trip_costs
FROM public.trips t
LEFT JOIN (
    SELECT trip_id, COUNT(*) as hotel_count, SUM(cost_amount) as total_hotel_costs
    FROM public.trip_hotels
    GROUP BY trip_id
) h ON t.id = h.trip_id
LEFT JOIN (
    SELECT trip_id, COUNT(*) as flight_count, SUM(cost_amount) as total_flight_costs
    FROM public.trip_flights
    GROUP BY trip_id
) f ON t.id = f.trip_id
LEFT JOIN (
    SELECT trip_id, COUNT(*) as meeting_count, SUM(total_estimated_cost) as total_meeting_costs
    FROM public.trip_meetings
    GROUP BY trip_id
) m ON t.id = m.trip_id
LEFT JOIN (
    SELECT tm.trip_id, COUNT(mn.*) as notes_count
    FROM public.trip_meetings tm
    LEFT JOIN public.meeting_notes mn ON tm.id = mn.meeting_id
    GROUP BY tm.trip_id
) n ON t.id = n.trip_id
LEFT JOIN (
    SELECT tm.trip_id, COUNT(mf.*) as file_count
    FROM public.trip_meetings tm
    LEFT JOIN public.meeting_files mf ON tm.id = mf.meeting_id
    GROUP BY tm.trip_id
) file_counts ON t.id = file_counts.trip_id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_locations TO authenticated;
GRANT SELECT ON public.trip_summary_extended TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_companies_with_locations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_meeting_total_cost(JSONB) TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments
COMMENT ON TABLE public.company_locations IS 'Physical locations for companies that can host meetings and events';
COMMENT ON COLUMN public.trip_meetings.cost_per_person IS 'JSONB object storing per-person cost breakdowns: {person_id: {meals: 100, transport: 50, ...}}';
COMMENT ON COLUMN public.trip_meetings.total_estimated_cost IS 'Automatically calculated total cost from cost_per_person data';
COMMENT ON COLUMN public.trip_meetings.cost_breakdown IS 'JSONB object for additional cost categorization and notes';
COMMENT ON FUNCTION public.get_companies_with_locations() IS 'Returns companies with location counts and primary location details for dropdown selection';
COMMENT ON FUNCTION public.calculate_meeting_total_cost(JSONB) IS 'Calculates total cost from per-person cost breakdown JSONB';