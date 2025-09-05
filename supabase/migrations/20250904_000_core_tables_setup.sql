-- Core Tables Setup Migration
-- Creates the fundamental tables needed for the trip management system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE user_role AS ENUM (
  'global_admin',
  'wolthers_staff', 
  'wolthers_finance',
  'car_manager',
  'company_admin',
  'visitor',
  'visitor_admin',
  'host',
  'driver',
  'guest'
);

-- Create trip status enum
CREATE TYPE trip_status AS ENUM (
  'planning',
  'confirmed', 
  'ongoing',
  'completed',
  'cancelled'
);

-- Create vehicle status enum  
CREATE TYPE vehicle_status AS ENUM (
  'active',
  'maintenance',
  'inactive'
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  company_id UUID REFERENCES companies(id),
  role user_role DEFAULT 'guest',
  permissions JSONB DEFAULT '{}',
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  subject VARCHAR,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status trip_status DEFAULT 'planning',
  created_by UUID REFERENCES users(id),
  estimated_budget DECIMAL(12,2),
  actual_cost DECIMAL(12,2) DEFAULT 0,
  trip_code VARCHAR,
  is_convention BOOLEAN DEFAULT false,
  parent_trip_id UUID REFERENCES trips(id),
  branch_date DATE,
  metadata JSONB DEFAULT '{}',
  access_code VARCHAR,
  starting_point VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make VARCHAR,
  model VARCHAR NOT NULL,
  year INTEGER,
  color VARCHAR,
  license_plate VARCHAR UNIQUE NOT NULL,
  vin VARCHAR,
  current_mileage INTEGER DEFAULT 0,
  last_maintenance_date DATE,
  last_maintenance_mileage INTEGER,
  insurance_expiry_date DATE,
  vehicle_type VARCHAR,
  seating_capacity INTEGER DEFAULT 5,
  fuel_capacity_liters INTEGER,
  renavam_number VARCHAR,
  notes TEXT,
  is_rental BOOLEAN DEFAULT false,
  rental_company VARCHAR,
  rental_contact_info JSONB,
  rental_cost_per_day DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  availability_status VARCHAR CHECK (availability_status IN ('available', 'in_use', 'maintenance', 'reserved')) DEFAULT 'available',
  base_location VARCHAR CHECK (base_location IN ('santos', 'cerrado', 'uberlandia', 'sao_paulo', 'other')),
  is_suitable_for_terrain JSONB DEFAULT '{"city": true, "highway": true, "rural": false, "port": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trip_participants table
CREATE TABLE IF NOT EXISTS trip_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  role VARCHAR DEFAULT 'participant',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create itinerary_days table
CREATE TABLE IF NOT EXISTS itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, date)
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  type VARCHAR CHECK (type IN ('meeting', 'visit', 'travel', 'meal', 'hotel', 'conference', 'convention')) DEFAULT 'meeting',
  title VARCHAR NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  location_id UUID,
  duration_minutes INTEGER,
  attendees UUID[] DEFAULT '{}',
  status VARCHAR DEFAULT 'pending',
  confirmation_status VARCHAR DEFAULT 'pending',
  notes TEXT,
  external_source JSONB,
  location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trips_access_code ON trips(access_code);

CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_availability ON vehicles(is_available, availability_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_base_location ON vehicles(base_location);

CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON trip_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_company_id ON trip_participants(company_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_days_trip_id ON itinerary_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_date ON itinerary_days(date);

CREATE INDEX IF NOT EXISTS idx_activities_itinerary_day_id ON activities(itinerary_day_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "users_wolthers_staff_all" ON users
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u 
      WHERE u.role IN ('wolthers_staff', 'global_admin')
      AND u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    )
  );

CREATE POLICY "users_own_profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- RLS Policies for trips
CREATE POLICY "trips_wolthers_staff_all" ON trips
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u 
      WHERE u.role IN ('wolthers_staff', 'global_admin')
      AND u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    )
  );

CREATE POLICY "trips_participants_read" ON trips
  FOR SELECT USING (
    id IN (
      SELECT tp.trip_id FROM trip_participants tp 
      WHERE tp.user_id = auth.uid()
    )
  );

-- RLS Policies for vehicles
CREATE POLICY "vehicles_wolthers_staff_all" ON vehicles
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u 
      WHERE u.role IN ('wolthers_staff', 'global_admin', 'car_manager')
      AND u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    )
  );

-- RLS Policies for trip_participants
CREATE POLICY "trip_participants_wolthers_staff_all" ON trip_participants
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u 
      WHERE u.role IN ('wolthers_staff', 'global_admin')
      AND u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    )
  );

CREATE POLICY "trip_participants_own_participation" ON trip_participants
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for itinerary_days
CREATE POLICY "itinerary_days_wolthers_staff_all" ON itinerary_days
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u 
      WHERE u.role IN ('wolthers_staff', 'global_admin')
      AND u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    )
  );

CREATE POLICY "itinerary_days_trip_participants" ON itinerary_days
  FOR SELECT USING (
    trip_id IN (
      SELECT tp.trip_id FROM trip_participants tp 
      WHERE tp.user_id = auth.uid()
    )
  );

-- RLS Policies for activities
CREATE POLICY "activities_wolthers_staff_all" ON activities
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u 
      WHERE u.role IN ('wolthers_staff', 'global_admin')
      AND u.company_id = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    )
  );

CREATE POLICY "activities_trip_participants" ON activities
  FOR SELECT USING (
    itinerary_day_id IN (
      SELECT id.id FROM itinerary_days id
      JOIN trip_participants tp ON tp.trip_id = id.trip_id 
      WHERE tp.user_id = auth.uid()
    )
  );

-- Insert Wolthers & Associates company if it doesn't exist
INSERT INTO companies (id, name, fantasy_name, client_type, created_at, updated_at)
VALUES (
  '840783f4-866d-4bdb-9b5d-5d0facf62db0',
  'Wolthers & Associates Brazil',
  'Wolthers & Associates',
  'service_providers',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample users for Wolthers staff
INSERT INTO users (id, email, full_name, company_id, role, is_active, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'daniel@wolthers.com', 'Daniel Wolthers', '840783f4-866d-4bdb-9b5d-5d0facf62db0', 'global_admin', true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'tom@wolthers.com', 'Tom Wolthers', '840783f4-866d-4bdb-9b5d-5d0facf62db0', 'wolthers_staff', true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'svenn@wolthers.com', 'Svenn Wolthers', '840783f4-866d-4bdb-9b5d-5d0facf62db0', 'wolthers_staff', true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'rasmus@wolthers.com', 'Rasmus Wolthers', '840783f4-866d-4bdb-9b5d-5d0facf62db0', 'wolthers_staff', true, NOW())
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  company_id = EXCLUDED.company_id,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Insert sample vehicles
INSERT INTO vehicles (id, make, model, year, color, license_plate, seating_capacity, vehicle_type, base_location, is_suitable_for_terrain)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', 'Toyota', 'Hilux', 2023, 'White', 'ABC-1234', 5, 'Pickup', 'santos', '{"city": true, "highway": true, "rural": true, "port": true}'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Honda', 'Civic', 2022, 'Silver', 'DEF-5678', 5, 'Sedan', 'sao_paulo', '{"city": true, "highway": true, "rural": false, "port": false}'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Chevrolet', 'S10', 2021, 'Black', 'GHI-9012', 5, 'Pickup', 'cerrado', '{"city": true, "highway": true, "rural": true, "port": false}')
ON CONFLICT (license_plate) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE users IS 'System users including staff, drivers, and company users';
COMMENT ON TABLE trips IS 'Main trips table containing trip information and metadata';
COMMENT ON TABLE vehicles IS 'Fleet management table for company vehicles and rental information';
COMMENT ON TABLE trip_participants IS 'Junction table linking users and companies to trips';
COMMENT ON TABLE itinerary_days IS 'Daily itinerary structure for trips';
COMMENT ON TABLE activities IS 'Individual activities within itinerary days';

COMMENT ON COLUMN trips.starting_point IS 'Starting location for trip to enable location-based vehicle allocation';
COMMENT ON COLUMN vehicles.base_location IS 'Primary location where vehicle is stationed';
COMMENT ON COLUMN vehicles.is_suitable_for_terrain IS 'JSON object indicating terrain suitability';