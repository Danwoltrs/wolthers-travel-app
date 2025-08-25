-- Migration: Add guest directory system
-- Created: 2025-08-19
-- Description: Create guest directory for reusable guest profiles across trips

-- Create guest_directory table for storing reusable guest profiles
CREATE TABLE IF NOT EXISTS public.guest_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Guest personal information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Professional information
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    company_website VARCHAR(255),
    
    -- Contact preferences
    preferred_contact_method VARCHAR(50) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')),
    time_zone VARCHAR(100),
    language_preference VARCHAR(10) DEFAULT 'en',
    
    -- Guest type and categorization
    guest_type VARCHAR(50) DEFAULT 'company_guest' CHECK (guest_type IN ('company_guest', 'external_guest', 'vip_guest', 'regular_guest')),
    guest_category VARCHAR(100), -- e.g., 'Coffee Producer', 'Trader', 'Roaster', etc.
    
    -- Relationship and source tracking
    source VARCHAR(100), -- How did we get this guest (referral, conference, etc.)
    relationship_notes TEXT,
    dietary_restrictions TEXT,
    special_requirements TEXT,
    
    -- Activity tracking
    total_trips_invited INTEGER DEFAULT 0,
    total_trips_attended INTEGER DEFAULT 0,
    last_trip_date TIMESTAMP WITH TIME ZONE,
    last_invited_date TIMESTAMP WITH TIME ZONE,
    
    -- Administrative
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    
    -- Search and tagging
    tags TEXT[], -- Array of tags for easy filtering
    internal_notes TEXT -- Private notes for Wolthers staff only
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_directory_email ON public.guest_directory(email);
CREATE INDEX IF NOT EXISTS idx_guest_directory_company ON public.guest_directory(company_name);
CREATE INDEX IF NOT EXISTS idx_guest_directory_name ON public.guest_directory(full_name);
CREATE INDEX IF NOT EXISTS idx_guest_directory_type ON public.guest_directory(guest_type);
CREATE INDEX IF NOT EXISTS idx_guest_directory_active ON public.guest_directory(is_active);
CREATE INDEX IF NOT EXISTS idx_guest_directory_tags ON public.guest_directory USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_guest_directory_created_at ON public.guest_directory(created_at);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_guest_directory_updated_at
    BEFORE UPDATE ON public.guest_directory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Function to automatically add guests to directory when they accept invitations
CREATE OR REPLACE FUNCTION public.add_guest_to_directory()
RETURNS TRIGGER AS $$
BEGIN
    -- Only add if the invitation was accepted and guest is not already in directory
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        -- Check if guest already exists in directory
        IF NOT EXISTS (SELECT 1 FROM public.guest_directory WHERE email = NEW.guest_email) THEN
            INSERT INTO public.guest_directory (
                full_name,
                email,
                phone,
                company_name,
                job_title,
                guest_type,
                created_by,
                total_trips_invited,
                total_trips_attended,
                last_trip_date,
                last_invited_date,
                source
            ) VALUES (
                NEW.guest_name,
                NEW.guest_email,
                NEW.guest_phone,
                NEW.guest_company,
                NEW.guest_title,
                NEW.invitation_type,
                NEW.invited_by,
                1, -- First invitation
                1, -- First attendance (since they accepted)
                (SELECT start_date FROM public.trips WHERE id = NEW.trip_id),
                NEW.sent_at,
                'trip_invitation'
            );
        ELSE
            -- Update existing guest record
            UPDATE public.guest_directory
            SET 
                total_trips_attended = total_trips_attended + 1,
                last_trip_date = (SELECT start_date FROM public.trips WHERE id = NEW.trip_id),
                updated_at = CURRENT_TIMESTAMP,
                -- Update info if it's more complete
                phone = COALESCE(NEW.guest_phone, phone),
                company_name = COALESCE(NEW.guest_company, company_name),
                job_title = COALESCE(NEW.guest_title, job_title)
            WHERE email = NEW.guest_email;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add accepted guests to directory
CREATE TRIGGER guest_invitation_accepted_add_to_directory
    AFTER UPDATE ON public.guest_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.add_guest_to_directory();

-- Function to update guest directory stats when invitations are sent
CREATE OR REPLACE FUNCTION public.update_guest_invitation_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats for existing guests when they're invited again
    IF EXISTS (SELECT 1 FROM public.guest_directory WHERE email = NEW.guest_email) THEN
        UPDATE public.guest_directory
        SET 
            total_trips_invited = total_trips_invited + 1,
            last_invited_date = NEW.sent_at,
            updated_at = CURRENT_TIMESTAMP
        WHERE email = NEW.guest_email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stats when new invitations are sent
CREATE TRIGGER guest_invitation_sent_update_stats
    AFTER INSERT ON public.guest_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_guest_invitation_stats();

-- RLS Policies for guest_directory
ALTER TABLE public.guest_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wolthers staff can view all guest directory entries" ON public.guest_directory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND (
                u.user_type = 'wolthers_staff' OR 
                u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0' OR
                u.is_global_admin = true
            )
        )
    );

CREATE POLICY "Wolthers staff can manage guest directory entries" ON public.guest_directory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND (
                u.user_type = 'wolthers_staff' OR 
                u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0' OR
                u.is_global_admin = true
            )
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_directory TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_guest_to_directory() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_guest_invitation_stats() TO authenticated;

-- Create a view for active guests with recent activity
CREATE OR REPLACE VIEW public.active_guest_directory AS
SELECT 
    gd.*,
    (
        SELECT COUNT(*) 
        FROM public.guest_invitations gi 
        WHERE gi.guest_email = gd.email 
        AND gi.status = 'pending'
    ) as pending_invitations,
    (
        SELECT COUNT(*) 
        FROM public.guest_invitations gi 
        WHERE gi.guest_email = gd.email 
        AND gi.created_at > CURRENT_TIMESTAMP - INTERVAL '1 year'
    ) as invitations_last_year,
    -- Calculate engagement score (0-100)
    LEAST(100, 
        COALESCE(gd.total_trips_attended * 25, 0) + 
        COALESCE(gd.total_trips_invited * 5, 0) +
        CASE 
            WHEN gd.last_trip_date > CURRENT_TIMESTAMP - INTERVAL '6 months' THEN 20
            WHEN gd.last_trip_date > CURRENT_TIMESTAMP - INTERVAL '1 year' THEN 10
            ELSE 0
        END
    ) as engagement_score
FROM public.guest_directory gd
WHERE gd.is_active = true 
AND gd.is_blacklisted = false
ORDER BY 
    gd.last_invited_date DESC NULLS LAST,
    gd.created_at DESC;

GRANT SELECT ON public.active_guest_directory TO authenticated;

-- Add some example guest categories for better organization
INSERT INTO public.guest_directory (
    full_name, email, company_name, job_title, guest_type, guest_category, 
    created_by, source, tags
) VALUES 
-- Only add if they don't exist already
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE public.guest_directory IS 'Reusable guest directory for managing guest profiles across multiple trips';
COMMENT ON FUNCTION public.add_guest_to_directory IS 'Automatically adds guests to directory when they accept invitations';
COMMENT ON FUNCTION public.update_guest_invitation_stats IS 'Updates guest statistics when new invitations are sent';
COMMENT ON VIEW public.active_guest_directory IS 'Active guests with engagement metrics and recent activity';