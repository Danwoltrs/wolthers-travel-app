-- Trip Vehicle Assignments Migration
-- Creates tables and relationships for vehicle allocation to trips

-- Create trip_vehicles table for vehicle assignments
CREATE TABLE IF NOT EXISTS trip_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assignment_type TEXT CHECK (assignment_type IN ('company_vehicle', 'rental_request', 'rental_assigned')) DEFAULT 'company_vehicle',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Rental specific fields
  rental_company TEXT,
  rental_contact_info JSONB,
  rental_cost_per_day DECIMAL(10,2),
  rental_location TEXT,
  rental_pickup_time TIME,
  rental_return_time TIME,
  
  -- Assignment details
  assigned_participants UUID[] DEFAULT '{}',
  vehicle_requirements JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('assigned', 'confirmed', 'cancelled', 'completed')) DEFAULT 'assigned',
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(trip_id, vehicle_id, start_date, end_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_vehicles_trip_id ON trip_vehicles(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_vehicles_vehicle_id ON trip_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trip_vehicles_driver_id ON trip_vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_vehicles_dates ON trip_vehicles(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trip_vehicles_assignment_type ON trip_vehicles(assignment_type);
CREATE INDEX IF NOT EXISTS idx_trip_vehicles_status ON trip_vehicles(status);

-- Add starting_point to trips table to support location-based vehicle allocation
ALTER TABLE trips ADD COLUMN IF NOT EXISTS starting_point TEXT 
CHECK (starting_point IN ('santos', 'cerrado', 'uberlandia', 'sao_paulo', 'other'));

-- Add location-based fields to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS base_location TEXT 
CHECK (base_location IN ('santos', 'cerrado', 'uberlandia', 'sao_paulo', 'other'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_suitable_for_terrain JSONB DEFAULT '{"city": true, "highway": true, "rural": false, "port": false}';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS availability_status TEXT 
CHECK (availability_status IN ('available', 'in_use', 'maintenance', 'reserved')) DEFAULT 'available';

-- Create vehicle requirements enum for better typing
CREATE TYPE vehicle_requirement_type AS ENUM (
  'seating_capacity',
  'cargo_space', 
  'terrain_capability',
  'fuel_type',
  'special_equipment'
);

-- Create trip_vehicle_requirements table for detailed requirements
CREATE TABLE IF NOT EXISTS trip_vehicle_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  requirement_type vehicle_requirement_type NOT NULL,
  requirement_value JSONB NOT NULL,
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trip_vehicle_requirements_trip_id ON trip_vehicle_requirements(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_vehicle_requirements_type ON trip_vehicle_requirements(requirement_type);

-- Create updated_at trigger for trip_vehicles
CREATE OR REPLACE FUNCTION update_trip_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_trip_vehicles_updated_at
  BEFORE UPDATE ON trip_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_trip_vehicles_updated_at();

-- Insert some sample vehicle requirements for testing
INSERT INTO trip_vehicle_requirements (trip_id, requirement_type, requirement_value, priority, is_mandatory)
SELECT 
  t.id,
  'seating_capacity'::vehicle_requirement_type,
  '{"min_capacity": 4}'::jsonb,
  2,
  true
FROM trips t
WHERE t.status = 'planning'
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE trip_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_vehicle_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_vehicles
CREATE POLICY "trip_vehicles_wolthers_staff_all" ON trip_vehicles
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u 
      WHERE u.role IN ('wolthers_staff', 'global_admin')
      AND u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    )
  );

CREATE POLICY "trip_vehicles_company_participants" ON trip_vehicles
  FOR SELECT USING (
    trip_id IN (
      SELECT tp.trip_id FROM trip_participants tp 
      WHERE tp.user_id = auth.uid() OR tp.company_id IN (
        SELECT u.company_id FROM users u WHERE u.id = auth.uid()
      )
    )
  );

-- RLS Policies for trip_vehicle_requirements  
CREATE POLICY "trip_vehicle_requirements_wolthers_staff_all" ON trip_vehicle_requirements
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u 
      WHERE u.role IN ('wolthers_staff', 'global_admin')
      AND u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    )
  );

CREATE POLICY "trip_vehicle_requirements_trip_participants" ON trip_vehicle_requirements
  FOR SELECT USING (
    trip_id IN (
      SELECT tp.trip_id FROM trip_participants tp 
      WHERE tp.user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE trip_vehicles IS 'Vehicle assignments for trips, supporting both company vehicles and rental requests';
COMMENT ON TABLE trip_vehicle_requirements IS 'Detailed vehicle requirements for trips to enable smart matching';
COMMENT ON COLUMN trip_vehicles.assignment_type IS 'Type of vehicle assignment: company_vehicle, rental_request, rental_assigned';
COMMENT ON COLUMN trip_vehicles.assigned_participants IS 'Array of user IDs assigned to this vehicle';
COMMENT ON COLUMN vehicles.base_location IS 'Primary location where vehicle is stationed';
COMMENT ON COLUMN vehicles.is_suitable_for_terrain IS 'JSON object indicating terrain suitability';
COMMENT ON COLUMN trips.starting_point IS 'Starting location for trip to enable location-based vehicle allocation';