-- Migration: Add expanded trip features (hotels, flights, meetings, notes)
-- Created: 2025-08-13
-- Description: Comprehensive database structure for conference/event trips with hotels, flights, meetings, and note-taking capabilities

-- First, let's extend the activity_type enum to include new types
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'conference_session';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'networking_event';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'presentation';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'hotel_stay';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'flight_travel';

-- Create trip_hotels table
CREATE TABLE IF NOT EXISTS public.trip_hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    hotel_name VARCHAR(255) NOT NULL,
    hotel_address TEXT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights_count INTEGER GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,
    cost_amount DECIMAL(10,2),
    cost_currency VARCHAR(3) DEFAULT 'USD',
    booking_reference VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    special_requests TEXT,
    room_type VARCHAR(100),
    guest_names TEXT[], -- Array of guest names for the booking
    booking_status VARCHAR(50) DEFAULT 'pending',
    booking_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Create trip_flights table
CREATE TABLE IF NOT EXISTS public.trip_flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    flight_type VARCHAR(20) NOT NULL CHECK (flight_type IN ('outbound', 'return', 'connecting')),
    airline VARCHAR(100) NOT NULL,
    flight_number VARCHAR(20) NOT NULL,
    
    -- Departure information
    departure_airport VARCHAR(10) NOT NULL, -- IATA code (e.g., 'AMS')
    departure_city VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    
    -- Arrival information
    arrival_airport VARCHAR(10) NOT NULL, -- IATA code (e.g., 'ZUR')
    arrival_city VARCHAR(100) NOT NULL,
    arrival_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    
    -- Cost and booking details
    cost_amount DECIMAL(10,2),
    cost_currency VARCHAR(3) DEFAULT 'USD',
    booking_reference VARCHAR(100),
    seat_preferences VARCHAR(100),
    meal_preferences VARCHAR(100),
    passenger_names TEXT[], -- Array of passenger names
    booking_status VARCHAR(50) DEFAULT 'pending',
    booking_date DATE,
    
    -- Additional flight details
    aircraft_type VARCHAR(100),
    flight_duration_minutes INTEGER,
    baggage_allowance VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Create trip_meetings table
CREATE TABLE IF NOT EXISTS public.trip_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    meeting_type VARCHAR(50) NOT NULL CHECK (meeting_type IN ('conference_session', 'networking', 'presentation', 'meeting', 'other')),
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    location VARCHAR(500),
    company_location_id UUID, -- For future company locations integration
    description TEXT,
    agenda TEXT,
    priority_level VARCHAR(10) DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high')),
    meeting_status VARCHAR(50) DEFAULT 'scheduled' CHECK (meeting_status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
    is_supplier_meeting BOOLEAN DEFAULT FALSE,
    supplier_company_name VARCHAR(255),
    meeting_notes TEXT, -- Basic notes field
    
    -- CRM Integration fields
    lead_status VARCHAR(50),
    follow_up_date DATE,
    deal_value DECIMAL(12,2),
    deal_currency VARCHAR(3) DEFAULT 'USD',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Create meeting_attendees table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.meeting_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.trip_meetings(id) ON DELETE CASCADE,
    attendee_name VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255),
    attendee_company VARCHAR(255),
    attendee_title VARCHAR(255),
    attendee_phone VARCHAR(50),
    is_external BOOLEAN DEFAULT TRUE, -- TRUE for external attendees, FALSE for Wolthers staff
    user_id UUID REFERENCES public.users(id), -- Link to users table for Wolthers staff
    attendance_status VARCHAR(20) DEFAULT 'invited' CHECK (attendance_status IN ('invited', 'confirmed', 'declined', 'attended', 'no_show')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create rich meeting notes table
CREATE TABLE IF NOT EXISTS public.meeting_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.trip_meetings(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content JSONB NOT NULL DEFAULT '{}', -- Rich text content stored as structured JSON
    content_html TEXT, -- Rendered HTML version for display
    content_plain TEXT, -- Plain text version for search
    note_type VARCHAR(50) DEFAULT 'general' CHECK (note_type IN ('general', 'agenda', 'action_items', 'decisions', 'follow_up')),
    
    -- OCR and handwriting recognition
    has_handwritten_content BOOLEAN DEFAULT FALSE,
    has_charts BOOLEAN DEFAULT FALSE,
    has_images BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    estimated_read_time INTEGER DEFAULT 0, -- In minutes
    
    -- AI Summary
    ai_summary TEXT,
    ai_key_points TEXT[],
    ai_action_items TEXT[],
    ai_generated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Create meeting files/attachments table
CREATE TABLE IF NOT EXISTS public.meeting_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.trip_meetings(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storage path
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(255),
    
    -- File categories
    file_category VARCHAR(50) DEFAULT 'document' CHECK (file_category IN ('document', 'presentation', 'spreadsheet', 'image', 'pdf', 'handwritten_note', 'chart', 'other')),
    
    -- OCR and processing status
    ocr_status VARCHAR(20) DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'not_applicable')),
    ocr_text TEXT, -- Extracted text from OCR
    ocr_confidence DECIMAL(5,2), -- OCR confidence score (0-100)
    
    -- File versioning
    version INTEGER DEFAULT 1,
    parent_file_id UUID REFERENCES public.meeting_files(id),
    is_latest_version BOOLEAN DEFAULT TRUE,
    
    -- Processing metadata
    thumbnail_path TEXT, -- Path to thumbnail image
    preview_path TEXT, -- Path to preview/converted version
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_error TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES public.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_hotels_trip_id ON public.trip_hotels(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_hotels_dates ON public.trip_hotels(check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_trip_flights_trip_id ON public.trip_flights(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_flights_departure ON public.trip_flights(departure_date, departure_time);
CREATE INDEX IF NOT EXISTS idx_trip_flights_type ON public.trip_flights(flight_type);

CREATE INDEX IF NOT EXISTS idx_trip_meetings_trip_id ON public.trip_meetings(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_meetings_date ON public.trip_meetings(meeting_date, start_time);
CREATE INDEX IF NOT EXISTS idx_trip_meetings_type ON public.trip_meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_trip_meetings_supplier ON public.trip_meetings(is_supplier_meeting) WHERE is_supplier_meeting = TRUE;

CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON public.meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user_id ON public.meeting_attendees(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON public.meeting_notes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_search ON public.meeting_notes USING GIN (content_plain);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_type ON public.meeting_notes(note_type);

CREATE INDEX IF NOT EXISTS idx_meeting_files_meeting_id ON public.meeting_files(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_files_category ON public.meeting_files(file_category);
CREATE INDEX IF NOT EXISTS idx_meeting_files_latest ON public.meeting_files(is_latest_version) WHERE is_latest_version = TRUE;

-- Add trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all new tables
CREATE TRIGGER update_trip_hotels_updated_at
    BEFORE UPDATE ON public.trip_hotels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_trip_flights_updated_at
    BEFORE UPDATE ON public.trip_flights
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_trip_meetings_updated_at
    BEFORE UPDATE ON public.trip_meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_meeting_attendees_updated_at
    BEFORE UPDATE ON public.meeting_attendees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_meeting_notes_updated_at
    BEFORE UPDATE ON public.meeting_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_meeting_files_updated_at
    BEFORE UPDATE ON public.meeting_files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Function to automatically update word count and character count for meeting notes
CREATE OR REPLACE FUNCTION public.update_meeting_notes_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update content_plain from content_html if available
    IF NEW.content_html IS NOT NULL THEN
        NEW.content_plain = regexp_replace(NEW.content_html, '<[^>]*>', '', 'g');
    END IF;
    
    -- Calculate counts
    IF NEW.content_plain IS NOT NULL THEN
        NEW.character_count = length(NEW.content_plain);
        NEW.word_count = array_length(string_to_array(trim(NEW.content_plain), ' '), 1);
        NEW.estimated_read_time = GREATEST(1, ROUND(NEW.word_count::numeric / 200)); -- 200 WPM reading speed
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meeting_notes_counts_trigger
    BEFORE INSERT OR UPDATE OF content, content_html, content_plain ON public.meeting_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_meeting_notes_counts();

-- Function to update file versioning
CREATE OR REPLACE FUNCTION public.handle_file_versioning()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new version is uploaded, mark previous versions as not latest
    IF NEW.parent_file_id IS NOT NULL THEN
        UPDATE public.meeting_files 
        SET is_latest_version = FALSE 
        WHERE parent_file_id = NEW.parent_file_id OR id = NEW.parent_file_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_file_versioning_trigger
    BEFORE INSERT ON public.meeting_files
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_file_versioning();

-- RLS Policies for all new tables

-- trip_hotels policies
ALTER TABLE public.trip_hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hotels for trips they have access to" ON public.trip_hotels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = trip_hotels.trip_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('view', 'edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can manage hotels for trips they can edit" ON public.trip_hotels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = trip_hotels.trip_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

-- trip_flights policies
ALTER TABLE public.trip_flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view flights for trips they have access to" ON public.trip_flights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = trip_flights.trip_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('view', 'edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can manage flights for trips they can edit" ON public.trip_flights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = trip_flights.trip_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

-- trip_meetings policies
ALTER TABLE public.trip_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meetings for trips they have access to" ON public.trip_meetings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = trip_meetings.trip_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('view', 'edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can manage meetings for trips they can edit" ON public.trip_meetings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = trip_meetings.trip_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

-- meeting_attendees policies (inherit from meetings)
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attendees for meetings they have access to" ON public.meeting_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trip_meetings tm
            JOIN public.trips t ON t.id = tm.trip_id
            WHERE tm.id = meeting_attendees.meeting_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('view', 'edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can manage attendees for meetings they can edit" ON public.meeting_attendees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trip_meetings tm
            JOIN public.trips t ON t.id = tm.trip_id
            WHERE tm.id = meeting_attendees.meeting_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

-- meeting_notes policies (inherit from meetings)
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes for meetings they have access to" ON public.meeting_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trip_meetings tm
            JOIN public.trips t ON t.id = tm.trip_id
            WHERE tm.id = meeting_notes.meeting_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('view', 'edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can manage notes for meetings they can edit" ON public.meeting_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trip_meetings tm
            JOIN public.trips t ON t.id = tm.trip_id
            WHERE tm.id = meeting_notes.meeting_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

-- meeting_files policies (inherit from meetings)
ALTER TABLE public.meeting_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files for meetings they have access to" ON public.meeting_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trip_meetings tm
            JOIN public.trips t ON t.id = tm.trip_id
            WHERE tm.id = meeting_files.meeting_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('view', 'edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can manage files for meetings they can edit" ON public.meeting_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trip_meetings tm
            JOIN public.trips t ON t.id = tm.trip_id
            WHERE tm.id = meeting_files.meeting_id
            AND (
                t.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

-- Create a view for trip summary with counts
CREATE OR REPLACE VIEW public.trip_summary_extended AS
SELECT 
    t.*,
    COALESCE(hotel_count, 0) as hotel_count,
    COALESCE(flight_count, 0) as flight_count,
    COALESCE(meeting_count, 0) as meeting_count,
    COALESCE(notes_count, 0) as notes_count,
    COALESCE(file_count, 0) as file_count
FROM public.trips t
LEFT JOIN (
    SELECT trip_id, COUNT(*) as hotel_count
    FROM public.trip_hotels
    GROUP BY trip_id
) h ON t.id = h.trip_id
LEFT JOIN (
    SELECT trip_id, COUNT(*) as flight_count
    FROM public.trip_flights
    GROUP BY trip_id
) f ON t.id = f.trip_id
LEFT JOIN (
    SELECT trip_id, COUNT(*) as meeting_count
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_hotels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_flights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_attendees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_files TO authenticated;
GRANT SELECT ON public.trip_summary_extended TO authenticated;

-- Grant sequence permissions for UUID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE public.trip_hotels IS 'Hotel bookings and accommodations for trips';
COMMENT ON TABLE public.trip_flights IS 'Flight information and bookings for trips';
COMMENT ON TABLE public.trip_meetings IS 'Meetings, conferences, and events scheduled during trips';
COMMENT ON TABLE public.meeting_attendees IS 'Attendees and participants for meetings';
COMMENT ON TABLE public.meeting_notes IS 'Rich text notes and documentation for meetings';
COMMENT ON TABLE public.meeting_files IS 'File attachments and documents for meetings';