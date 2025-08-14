-- Migration: Add unified activities table for schedule management
-- Created: 2025-08-14
-- Description: Create a unified activities table that complements the existing trip_meetings, trip_hotels, and trip_flights tables

-- Create activities table for unified schedule management
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    
    -- Basic activity information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- Activity classification
    type VARCHAR(50) NOT NULL DEFAULT 'meeting' CHECK (type IN (
        'meeting', 'meal', 'travel', 'flight', 'accommodation', 
        'event', 'conference_session', 'networking_event', 
        'presentation', 'break', 'other'
    )),
    
    -- Location and logistics
    location VARCHAR(500),
    host VARCHAR(255), -- Meeting host or organizer
    
    -- Cost tracking
    cost DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'BRL',
    
    -- Status and confirmation
    is_confirmed BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'cancelled', 'completed', 'in_progress'
    )),
    
    -- Additional information
    notes TEXT,
    priority_level VARCHAR(10) DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high')),
    
    -- References to other tables (optional links)
    meeting_id UUID REFERENCES public.trip_meetings(id) ON DELETE SET NULL,
    hotel_id UUID REFERENCES public.trip_hotels(id) ON DELETE SET NULL,
    flight_id UUID REFERENCES public.trip_flights(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON public.activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_date_time ON public.activities(activity_date, start_time);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_confirmed ON public.activities(is_confirmed);

-- Add updated_at trigger
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities table

-- Policy for viewing activities - authenticated users can view activities for trips they have access to
CREATE POLICY "authenticated_users_view_activities" ON public.activities
    FOR SELECT TO authenticated
    USING (
        -- Global admins can view all activities
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        ) OR
        -- Wolthers staff can view all activities
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND user_type = 'wolthers_staff'
        ) OR
        -- Trip participants can view activities for their trips
        EXISTS (
            SELECT 1 FROM public.trip_participants tp
            WHERE tp.trip_id = activities.trip_id AND tp.user_id = auth.uid()
        ) OR
        -- Trip creators can view their trip activities
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = activities.trip_id AND t.created_by = auth.uid()
        ) OR
        -- Company admins can view activities for trips involving their company
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.trip_companies tc ON u.company_id = tc.company_id
            WHERE u.id = auth.uid() 
            AND u.user_type = 'admin'
            AND tc.trip_id = activities.trip_id
        )
    );

-- Policy for creating activities
CREATE POLICY "authenticated_users_create_activities" ON public.activities
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Global admins can create activities
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        ) OR
        -- Wolthers staff can create activities
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND user_type = 'wolthers_staff'
        ) OR
        -- Trip creators can create activities for their trips
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = activities.trip_id AND t.created_by = auth.uid()
        ) OR
        -- Trip participants with edit permissions can create activities
        EXISTS (
            SELECT 1 FROM public.trip_participants tp
            WHERE tp.trip_id = activities.trip_id 
            AND tp.user_id = auth.uid()
            AND tp.can_edit_itinerary = TRUE
        )
    );

-- Policy for updating activities
CREATE POLICY "authenticated_users_update_activities" ON public.activities
    FOR UPDATE TO authenticated
    USING (
        -- Global admins can update all activities
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        ) OR
        -- Wolthers staff can update all activities
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND user_type = 'wolthers_staff'
        ) OR
        -- Activity creator can update their activities
        created_by = auth.uid() OR
        -- Trip creators can update activities for their trips
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = activities.trip_id AND t.created_by = auth.uid()
        ) OR
        -- Trip participants with edit permissions can update activities
        EXISTS (
            SELECT 1 FROM public.trip_participants tp
            WHERE tp.trip_id = activities.trip_id 
            AND tp.user_id = auth.uid()
            AND tp.can_edit_itinerary = TRUE
        )
    );

-- Policy for deleting activities
CREATE POLICY "authenticated_users_delete_activities" ON public.activities
    FOR DELETE TO authenticated
    USING (
        -- Global admins can delete all activities
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_global_admin = TRUE
        ) OR
        -- Wolthers staff can delete all activities
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND user_type = 'wolthers_staff'
        ) OR
        -- Activity creator can delete their activities
        created_by = auth.uid() OR
        -- Trip creators can delete activities for their trips
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = activities.trip_id AND t.created_by = auth.uid()
        )
    );

-- Function to sync activities with existing trip_meetings, trip_hotels, trip_flights
CREATE OR REPLACE FUNCTION public.sync_activities_from_existing_data()
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- Insert activities from trip_meetings
    INSERT INTO public.activities (
        trip_id, title, description, activity_date, start_time, end_time,
        type, location, host, cost, currency, is_confirmed, status,
        notes, priority_level, meeting_id, created_at, updated_at, created_by
    )
    SELECT 
        trip_id,
        title,
        COALESCE(description, agenda),
        meeting_date,
        start_time,
        end_time,
        CASE 
            WHEN meeting_type = 'conference_session' THEN 'conference_session'
            WHEN meeting_type = 'networking' THEN 'networking_event'
            WHEN meeting_type = 'presentation' THEN 'presentation'
            ELSE 'meeting'
        END,
        location,
        COALESCE(supplier_company_name, 'Meeting Host'),
        COALESCE(deal_value, 0),
        'USD',
        meeting_status = 'confirmed',
        CASE meeting_status
            WHEN 'scheduled' THEN 'scheduled'
            WHEN 'confirmed' THEN 'confirmed'
            WHEN 'cancelled' THEN 'cancelled'
            WHEN 'completed' THEN 'completed'
            ELSE 'scheduled'
        END,
        meeting_notes,
        priority_level,
        id, -- reference to meeting_id
        created_at,
        updated_at,
        created_by
    FROM public.trip_meetings tm
    WHERE NOT EXISTS (
        SELECT 1 FROM public.activities a 
        WHERE a.meeting_id = tm.id
    );
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    -- Insert activities from trip_hotels
    INSERT INTO public.activities (
        trip_id, title, description, activity_date, start_time, end_time,
        type, location, cost, currency, is_confirmed, status,
        notes, hotel_id, created_at, updated_at, created_by
    )
    SELECT 
        trip_id,
        'Hotel: ' || hotel_name,
        'Hotel accommodation at ' || hotel_name,
        check_in_date,
        '15:00'::TIME, -- Standard check-in time
        NULL, -- No end time for multi-day stays
        'accommodation',
        hotel_address,
        COALESCE(cost_amount, 0),
        COALESCE(cost_currency, 'USD'),
        booking_status = 'confirmed',
        CASE booking_status
            WHEN 'pending' THEN 'scheduled'
            WHEN 'confirmed' THEN 'confirmed'
            ELSE 'scheduled'
        END,
        COALESCE(special_requests, ''),
        id, -- reference to hotel_id
        created_at,
        updated_at,
        created_by
    FROM public.trip_hotels th
    WHERE NOT EXISTS (
        SELECT 1 FROM public.activities a 
        WHERE a.hotel_id = th.id
    );
    
    GET DIAGNOSTICS inserted_count = inserted_count + ROW_COUNT;
    
    -- Insert activities from trip_flights
    INSERT INTO public.activities (
        trip_id, title, description, activity_date, start_time, end_time,
        type, location, cost, currency, is_confirmed, status,
        notes, flight_id, created_at, updated_at, created_by
    )
    SELECT 
        trip_id,
        flight_type || ' Flight: ' || airline || ' ' || flight_number,
        'Flight from ' || departure_city || ' to ' || arrival_city,
        departure_date,
        departure_time,
        CASE 
            WHEN arrival_date = departure_date THEN arrival_time
            ELSE NULL -- Different day arrival
        END,
        'flight',
        departure_airport || ' → ' || arrival_airport,
        COALESCE(cost_amount, 0),
        COALESCE(cost_currency, 'USD'),
        booking_status = 'confirmed',
        CASE booking_status
            WHEN 'pending' THEN 'scheduled'
            WHEN 'confirmed' THEN 'confirmed'
            ELSE 'scheduled'
        END,
        COALESCE(seat_preferences, '') || 
        CASE WHEN meal_preferences IS NOT NULL THEN ' | ' || meal_preferences ELSE '' END,
        id, -- reference to flight_id
        created_at,
        updated_at,
        created_by
    FROM public.trip_flights tf
    WHERE NOT EXISTS (
        SELECT 1 FROM public.activities a 
        WHERE a.flight_id = tf.id
    );
    
    GET DIAGNOSTICS inserted_count = inserted_count + ROW_COUNT;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_activities_from_existing_data() TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Run the sync function to populate activities from existing data
-- SELECT public.sync_activities_from_existing_data();

-- Comments
COMMENT ON TABLE public.activities IS 'Unified activities table for trip schedule management and calendar views';
COMMENT ON COLUMN public.activities.type IS 'Type of activity: meeting, meal, travel, flight, accommodation, event, etc.';
COMMENT ON COLUMN public.activities.meeting_id IS 'Optional reference to trip_meetings table for detailed meeting data';
COMMENT ON COLUMN public.activities.hotel_id IS 'Optional reference to trip_hotels table for detailed hotel data';
COMMENT ON COLUMN public.activities.flight_id IS 'Optional reference to trip_flights table for detailed flight data';
COMMENT ON FUNCTION public.sync_activities_from_existing_data() IS 'Syncs existing trip_meetings, trip_hotels, and trip_flights data into the activities table';