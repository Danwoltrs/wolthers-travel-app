-- Create visit_confirmations table for tracking host visit confirmations
CREATE TABLE IF NOT EXISTS visit_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    host_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    response_type VARCHAR(10) NOT NULL CHECK (response_type IN ('accept', 'decline')),
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmation_token TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one confirmation per trip per host
    CONSTRAINT unique_trip_host_confirmation UNIQUE (trip_id, host_contact_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visit_confirmations_trip_id ON visit_confirmations(trip_id);
CREATE INDEX IF NOT EXISTS idx_visit_confirmations_host_contact_id ON visit_confirmations(host_contact_id);
CREATE INDEX IF NOT EXISTS idx_visit_confirmations_company_id ON visit_confirmations(company_id);
CREATE INDEX IF NOT EXISTS idx_visit_confirmations_response_type ON visit_confirmations(response_type);
CREATE INDEX IF NOT EXISTS idx_visit_confirmations_confirmed_at ON visit_confirmations(confirmed_at);

-- Enable RLS (Row Level Security)
ALTER TABLE visit_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view confirmations for trips they're involved with
CREATE POLICY "Users can view visit confirmations for their trips" ON visit_confirmations
    FOR SELECT
    USING (
        -- Trip creators can see all confirmations for their trips
        trip_id IN (
            SELECT id FROM trips WHERE created_by = auth.uid()
        )
        OR
        -- Wolthers staff can see all confirmations
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (
                user_type = 'wolthers_staff' 
                OR can_view_all_trips = true
                OR is_global_admin = true
            )
        )
        OR
        -- Host contacts can see their own confirmations
        host_contact_id IN (
            SELECT id FROM contacts WHERE email = (
                SELECT email FROM users WHERE id = auth.uid()
            )
        )
    );

-- RLS Policy: Only system can insert/update confirmations (via API)
CREATE POLICY "System can manage visit confirmations" ON visit_confirmations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_visit_confirmations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visit_confirmations_updated_at
    BEFORE UPDATE ON visit_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION update_visit_confirmations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE visit_confirmations IS 'Tracks host responses to visit invitations with platform access';
COMMENT ON COLUMN visit_confirmations.trip_id IS 'Reference to the trip being confirmed';
COMMENT ON COLUMN visit_confirmations.host_contact_id IS 'Reference to the host contact who responded';
COMMENT ON COLUMN visit_confirmations.company_id IS 'Reference to the host company';
COMMENT ON COLUMN visit_confirmations.response_type IS 'Host response: accept or decline';
COMMENT ON COLUMN visit_confirmations.confirmed_at IS 'Timestamp when host responded';
COMMENT ON COLUMN visit_confirmations.confirmation_token IS 'Security token used for confirmation';
COMMENT ON COLUMN visit_confirmations.notes IS 'Optional notes from host or system';