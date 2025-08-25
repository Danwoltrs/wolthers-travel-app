-- Migration: Add multi-day activities support
-- Created: 2025-08-15
-- Description: Add end_date field to activities table to support multi-day events like flights and hotel stays

-- Add end_date column to activities table
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Update existing single-day activities to have end_date = activity_date
UPDATE public.activities 
SET end_date = activity_date 
WHERE end_date IS NULL;

-- Add index for multi-day activities queries
CREATE INDEX IF NOT EXISTS idx_activities_date_range ON public.activities(activity_date, end_date);

-- Add constraint to ensure end_date is >= activity_date
ALTER TABLE public.activities 
ADD CONSTRAINT activities_end_date_check 
CHECK (end_date >= activity_date);

-- Function to calculate activity duration in days
CREATE OR REPLACE FUNCTION public.get_activity_duration_days(activity_date DATE, end_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(end_date - activity_date + 1, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comments
COMMENT ON COLUMN public.activities.end_date IS 'End date for multi-day activities (flights, hotels). For single-day activities, this equals activity_date';
COMMENT ON FUNCTION public.get_activity_duration_days(DATE, DATE) IS 'Calculate the duration of an activity in days (inclusive)';