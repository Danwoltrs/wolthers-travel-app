-- Add participant email tracking table
-- This table tracks all emails sent to participants when they are added to trips

-- Create email status enum
CREATE TYPE email_status AS ENUM ('sent', 'failed', 'pending');

-- Create email type enum for participant emails
CREATE TYPE participant_email_type AS ENUM (
  'host_invitation',
  'meeting_request', 
  'guest_itinerary',
  'staff_notification',
  'general_notification'
);

-- Create participant email tracking table
CREATE TABLE IF NOT EXISTS trip_participant_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type participant_email_type NOT NULL,
  status email_status DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_participant_emails_trip_id ON trip_participant_emails(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participant_emails_participant_id ON trip_participant_emails(participant_id);
CREATE INDEX IF NOT EXISTS idx_trip_participant_emails_status ON trip_participant_emails(status);
CREATE INDEX IF NOT EXISTS idx_trip_participant_emails_email_type ON trip_participant_emails(email_type);

-- Enable RLS
ALTER TABLE trip_participant_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_participant_emails
CREATE POLICY "trip_participant_emails_wolthers_staff_all" ON trip_participant_emails
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u 
      WHERE u.role IN ('wolthers_staff', 'global_admin')
      AND u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    )
  );

CREATE POLICY "trip_participant_emails_own_emails" ON trip_participant_emails
  FOR SELECT USING (auth.uid() = participant_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trip_participant_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER trigger_update_trip_participant_emails_updated_at
  BEFORE UPDATE ON trip_participant_emails
  FOR EACH ROW EXECUTE FUNCTION update_trip_participant_emails_updated_at();

-- Add email_notifications column to trip_participants table to track if emails were sent
ALTER TABLE trip_participants 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_type participant_email_type,
ADD COLUMN IF NOT EXISTS email_error TEXT;

-- Add comments for documentation
COMMENT ON TABLE trip_participant_emails IS 'Tracks all emails sent to participants when they are added to trips';
COMMENT ON COLUMN trip_participant_emails.email_type IS 'Type of email sent based on participant role';
COMMENT ON COLUMN trip_participant_emails.status IS 'Current status of the email (sent, failed, pending)';
COMMENT ON COLUMN trip_participant_emails.retry_count IS 'Number of times email sending was retried';
COMMENT ON COLUMN trip_participants.email_sent IS 'Whether notification email was successfully sent to this participant';
COMMENT ON COLUMN trip_participants.email_type IS 'Type of email sent to this participant based on their role';