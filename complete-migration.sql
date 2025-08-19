-- Complete migration for guest_invitations system
-- Run this in Supabase Dashboard SQL Editor

-- Create guest_invitations table
CREATE TABLE IF NOT EXISTS public.guest_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Guest information
    guest_email VARCHAR(255) NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_company VARCHAR(255),
    guest_title VARCHAR(255),
    guest_phone VARCHAR(50),
    
    -- Invitation details
    invitation_token VARCHAR(255) NOT NULL UNIQUE,
    invitation_message TEXT,
    invitation_type VARCHAR(50) DEFAULT 'company_guest' CHECK (invitation_type IN ('company_guest', 'external_guest', 'meeting_attendee')),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    
    -- Acceptance details
    accepted_by UUID REFERENCES public.users(id),
    participant_id UUID,
    
    -- Email tracking
    email_sent_count INTEGER DEFAULT 1,
    last_email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_invitations_trip_id ON public.guest_invitations(trip_id);
CREATE INDEX IF NOT EXISTS idx_guest_invitations_token ON public.guest_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_guest_invitations_email ON public.guest_invitations(guest_email);
CREATE INDEX IF NOT EXISTS idx_guest_invitations_status ON public.guest_invitations(status);
CREATE INDEX IF NOT EXISTS idx_guest_invitations_expires ON public.guest_invitations(expires_at);

-- Add trigger for updated_at timestamp (assuming update_updated_at function exists)
CREATE TRIGGER update_guest_invitations_updated_at
    BEFORE UPDATE ON public.guest_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies for guest_invitations
ALTER TABLE public.guest_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations for trips they have access to" ON public.guest_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = guest_invitations.trip_id
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

CREATE POLICY "Users can manage invitations for trips they can edit" ON public.guest_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trips t
            WHERE t.id = guest_invitations.trip_id
            AND (
                t.creator_id = auth.uid() OR
                invited_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_access_permissions tap
                    WHERE tap.trip_id = t.id AND tap.user_id = auth.uid()
                    AND tap.permission_type IN ('edit', 'admin')
                    AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
                )
            )
        )
    );

-- Allow public access to accept invitations by token (no auth required)
CREATE POLICY "Anyone can accept invitations with valid token" ON public.guest_invitations
    FOR UPDATE USING (status = 'pending' AND expires_at > CURRENT_TIMESTAMP);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_invitations TO authenticated;
GRANT SELECT, UPDATE ON public.guest_invitations TO anon; -- For invitation acceptance

-- Add guest fields to trip_participants if they don't exist
DO $$
BEGIN
    -- Add guest-specific fields to trip_participants
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_participants' AND column_name = 'guest_email') THEN
        ALTER TABLE public.trip_participants ADD COLUMN guest_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_participants' AND column_name = 'guest_name') THEN
        ALTER TABLE public.trip_participants ADD COLUMN guest_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_participants' AND column_name = 'guest_company') THEN
        ALTER TABLE public.trip_participants ADD COLUMN guest_company VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_participants' AND column_name = 'guest_title') THEN
        ALTER TABLE public.trip_participants ADD COLUMN guest_title VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_participants' AND column_name = 'guest_phone') THEN
        ALTER TABLE public.trip_participants ADD COLUMN guest_phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_participants' AND column_name = 'invited_by') THEN
        ALTER TABLE public.trip_participants ADD COLUMN invited_by UUID REFERENCES public.users(id);
    END IF;
END
$$;