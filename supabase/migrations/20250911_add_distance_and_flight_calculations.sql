-- Add distance calculation and flight information fields to activities table
-- This migration enhances the activities table to store:
-- 1. Google Maps distance calculations for travel activities
-- 2. Flight information and landing time calculations
-- 3. Cached distance/time data to reduce API calls

-- Add distance and travel calculation fields to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS distance_meters INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS travel_mode VARCHAR CHECK (travel_mode IN ('driving', 'walking', 'transit', 'bicycling'));
ALTER TABLE activities ADD COLUMN IF NOT EXISTS origin_address TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS destination_address TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS distance_calculated_at TIMESTAMP WITH TIME ZONE;

-- Add flight information fields for flight/travel activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS flight_info JSONB;

-- Add landing time calculation fields
ALTER TABLE activities ADD COLUMN IF NOT EXISTS scheduled_arrival_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS estimated_landing_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recommended_pickup_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS landing_time_calculated_at TIMESTAMP WITH TIME ZONE;

-- Add route calculation metadata
ALTER TABLE activities ADD COLUMN IF NOT EXISTS route_metadata JSONB;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_distance_calculated ON activities(distance_calculated_at) WHERE distance_calculated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_flight_arrival ON activities(scheduled_arrival_time) WHERE scheduled_arrival_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_travel_mode ON activities(travel_mode) WHERE travel_mode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_landing_calculated ON activities(landing_time_calculated_at) WHERE landing_time_calculated_at IS NOT NULL;

-- Add a comment to document the new fields
COMMENT ON COLUMN activities.distance_meters IS 'Calculated distance in meters from Google Maps Distance Matrix API';
COMMENT ON COLUMN activities.duration_seconds IS 'Calculated travel duration in seconds from Google Maps Distance Matrix API';
COMMENT ON COLUMN activities.travel_mode IS 'Travel mode used for distance calculation (driving, walking, transit, bicycling)';
COMMENT ON COLUMN activities.origin_address IS 'Starting point address for distance calculation';
COMMENT ON COLUMN activities.destination_address IS 'Destination address for distance calculation';
COMMENT ON COLUMN activities.distance_calculated_at IS 'Timestamp when distance was last calculated';
COMMENT ON COLUMN activities.flight_info IS 'Flight details including airline, flight number, departure airport, etc.';
COMMENT ON COLUMN activities.scheduled_arrival_time IS 'Original scheduled flight arrival time';
COMMENT ON COLUMN activities.estimated_landing_time IS 'Calculated landing time with airport buffer';
COMMENT ON COLUMN activities.recommended_pickup_time IS 'Recommended pickup time with additional coordination buffer';
COMMENT ON COLUMN activities.buffer_minutes IS 'Total buffer minutes applied for landing/pickup calculation';
COMMENT ON COLUMN activities.landing_time_calculated_at IS 'Timestamp when landing time was calculated';
COMMENT ON COLUMN activities.route_metadata IS 'Additional route calculation metadata (waypoints, traffic, etc.)';

-- Create a function to automatically update the updated_at timestamp when distance/flight fields change
CREATE OR REPLACE FUNCTION update_activity_calculation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the main updated_at timestamp if calculation fields change
  IF (OLD.distance_meters IS DISTINCT FROM NEW.distance_meters OR 
      OLD.duration_seconds IS DISTINCT FROM NEW.duration_seconds OR
      OLD.flight_info IS DISTINCT FROM NEW.flight_info OR
      OLD.estimated_landing_time IS DISTINCT FROM NEW.estimated_landing_time) THEN
    NEW.updated_at = CURRENT_TIMESTAMP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update timestamps
DROP TRIGGER IF EXISTS trigger_update_activity_calculation_timestamp ON activities;
CREATE TRIGGER trigger_update_activity_calculation_timestamp
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_calculation_timestamp();

-- Create a view for activities with calculated travel information
CREATE OR REPLACE VIEW activities_with_travel_info AS
SELECT 
  a.*,
  CASE 
    WHEN a.distance_meters IS NOT NULL THEN
      CASE 
        WHEN a.distance_meters < 1000 THEN a.distance_meters || 'm'
        ELSE ROUND(a.distance_meters / 1000.0, 1) || 'km'
      END
    ELSE NULL
  END AS formatted_distance,
  CASE 
    WHEN a.duration_seconds IS NOT NULL THEN
      CASE 
        WHEN a.duration_seconds < 3600 THEN ROUND(a.duration_seconds / 60.0) || 'min'
        ELSE FLOOR(a.duration_seconds / 3600.0) || 'h ' || ROUND((a.duration_seconds % 3600) / 60.0) || 'min'
      END
    ELSE NULL
  END AS formatted_duration,
  CASE 
    WHEN a.scheduled_arrival_time IS NOT NULL AND a.recommended_pickup_time IS NOT NULL THEN
      EXTRACT(EPOCH FROM (a.recommended_pickup_time - a.scheduled_arrival_time)) / 60
    ELSE NULL
  END AS total_buffer_minutes,
  CASE 
    WHEN a.distance_calculated_at IS NOT NULL THEN
      CASE 
        WHEN a.distance_calculated_at > CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN 'fresh'
        WHEN a.distance_calculated_at > CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 'recent'
        ELSE 'stale'
      END
    ELSE 'not_calculated'
  END AS distance_calculation_status,
  CASE 
    WHEN a.landing_time_calculated_at IS NOT NULL THEN
      CASE 
        WHEN a.landing_time_calculated_at > CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 'fresh'
        WHEN a.landing_time_calculated_at > CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 'recent'
        ELSE 'stale'
      END
    ELSE 'not_calculated'
  END AS landing_time_calculation_status
FROM activities a;

-- Create a function to clean up old calculation data (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_stale_calculations(older_than_days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Clear distance calculations older than specified days
  UPDATE activities 
  SET 
    distance_meters = NULL,
    duration_seconds = NULL,
    distance_calculated_at = NULL,
    route_metadata = NULL
  WHERE distance_calculated_at < CURRENT_TIMESTAMP - (older_than_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Clear landing time calculations older than specified days
  UPDATE activities 
  SET 
    estimated_landing_time = NULL,
    recommended_pickup_time = NULL,
    buffer_minutes = NULL,
    landing_time_calculated_at = NULL
  WHERE landing_time_calculated_at < CURRENT_TIMESTAMP - (older_than_days || ' days')::INTERVAL;
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Add sample data documentation
COMMENT ON TABLE activities IS 'Enhanced activities table with Google Maps distance calculations and flight landing time calculations';

-- Add a helper function to format flight info for display
CREATE OR REPLACE FUNCTION format_flight_info(flight_info_json JSONB)
RETURNS TEXT AS $$
BEGIN
  IF flight_info_json IS NULL OR flight_info_json = '{}'::jsonb THEN
    RETURN NULL;
  END IF;
  
  RETURN CONCAT(
    COALESCE(flight_info_json->>'airline', 'Unknown Airline'),
    ' ',
    COALESCE(flight_info_json->>'flightNumber', 'Unknown Flight'),
    ' from ',
    COALESCE(flight_info_json->>'departureCity', COALESCE(flight_info_json->>'departureAirport', 'Unknown Origin')),
    ' arriving at ',
    COALESCE(flight_info_json->>'arrivalTime', 'Unknown Time'),
    ' on ',
    COALESCE(flight_info_json->>'arrivalDate', 'Unknown Date')
  );
END;
$$ LANGUAGE plpgsql;