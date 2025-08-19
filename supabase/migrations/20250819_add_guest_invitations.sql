-- Migration: Add guest invitation system
-- Created: 2025-08-19
-- Description: Create guest invitation functionality with email invitations and token-based acceptance

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
    accepted_by UUID REFERENCES public.users(id), -- Link to user account if they register
    participant_id UUID, -- Link to trip_participants when accepted
    
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

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_guest_invitations_updated_at
    BEFORE UPDATE ON public.guest_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Create function to automatically expire old invitations
CREATE OR REPLACE FUNCTION public.expire_old_guest_invitations()
RETURNS void AS $$
BEGIN
    UPDATE public.guest_invitations 
    SET status = 'expired', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'pending' 
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle guest invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_guest_invitation(
    invitation_token_param VARCHAR(255),
    user_id_param UUID DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    invitation_id UUID,
    trip_id UUID,
    participant_id UUID
) AS $$
DECLARE
    invitation_record RECORD;
    new_participant_id UUID;
BEGIN
    -- Find the invitation
    SELECT * INTO invitation_record
    FROM public.guest_invitations
    WHERE invitation_token = invitation_token_param
    AND status = 'pending'
    AND expires_at > CURRENT_TIMESTAMP;
    
    -- Check if invitation exists and is valid
    IF invitation_record IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Invalid or expired invitation', NULL::UUID, NULL::UUID, NULL::UUID;
        RETURN;
    END IF;
    
    -- Create trip participant record
    INSERT INTO public.trip_participants (
        trip_id,
        user_id,
        company_id,
        role,
        guest_email,
        guest_name,
        guest_company,
        guest_title,
        guest_phone,
        is_partial,
        invited_by,
        created_at,
        updated_at
    ) VALUES (
        invitation_record.trip_id,
        user_id_param,
        NULL, -- Will be filled if they have a company
        CASE 
            WHEN invitation_record.invitation_type = 'company_guest' THEN 'client_representative'
            WHEN invitation_record.invitation_type = 'external_guest' THEN 'external_guest'
            ELSE 'participant'
        END,
        invitation_record.guest_email,
        invitation_record.guest_name,
        invitation_record.guest_company,
        invitation_record.guest_title,
        invitation_record.guest_phone,
        FALSE,
        invitation_record.invited_by,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO new_participant_id;
    
    -- Update invitation status
    UPDATE public.guest_invitations
    SET 
        status = 'accepted',
        accepted_at = CURRENT_TIMESTAMP,
        accepted_by = user_id_param,
        participant_id = new_participant_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = invitation_record.id;
    
    RETURN QUERY SELECT TRUE, 'Invitation accepted successfully', invitation_record.id, invitation_record.trip_id, new_participant_id;
END;
$$ LANGUAGE plpgsql;

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
GRANT EXECUTE ON FUNCTION public.accept_guest_invitation(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_guest_invitation(VARCHAR, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.expire_old_guest_invitations() TO authenticated;

-- Create a view for active invitations with trip details
CREATE OR REPLACE VIEW public.active_guest_invitations AS
SELECT 
    gi.*,
    t.title as trip_title,
    t.start_date as trip_start_date,
    t.end_date as trip_end_date,
    t.access_code as trip_access_code,
    u.full_name as invited_by_name,
    u.email as invited_by_email
FROM public.guest_invitations gi
JOIN public.trips t ON gi.trip_id = t.id
JOIN public.users u ON gi.invited_by = u.id
WHERE gi.status = 'pending' 
AND gi.expires_at > CURRENT_TIMESTAMP;

GRANT SELECT ON public.active_guest_invitations TO authenticated;
GRANT SELECT ON public.active_guest_invitations TO anon; -- For invitation lookup

COMMENT ON TABLE public.guest_invitations IS 'Guest invitation management with email invitations and token-based acceptance';
COMMENT ON FUNCTION public.accept_guest_invitation IS 'Function to handle guest invitation acceptance and participant creation';
COMMENT ON FUNCTION public.expire_old_guest_invitations IS 'Utility function to mark expired invitations as expired';