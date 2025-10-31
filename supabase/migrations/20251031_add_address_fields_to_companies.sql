-- Migration: Add Address Fields to Companies Table
-- Created: 2025-10-31
-- Description: Adds detailed address fields to companies table for better location management

-- Add address fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS street_number TEXT,
ADD COLUMN IF NOT EXISTS neighbourhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brazil',
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Create indexes for better query performance on location fields
CREATE INDEX IF NOT EXISTS idx_companies_city ON public.companies(city);
CREATE INDEX IF NOT EXISTS idx_companies_state ON public.companies(state);
CREATE INDEX IF NOT EXISTS idx_companies_region ON public.companies(region);
CREATE INDEX IF NOT EXISTS idx_companies_country ON public.companies(country);

-- Add comments for documentation
COMMENT ON COLUMN public.companies.address IS 'Full address text for display and geocoding';
COMMENT ON COLUMN public.companies.street IS 'Street name (e.g., Rua das Flores, Avenida Paulista)';
COMMENT ON COLUMN public.companies.street_number IS 'Street number or S/N for unnumbered addresses';
COMMENT ON COLUMN public.companies.neighbourhood IS 'Neighbourhood or district name (optional)';
COMMENT ON COLUMN public.companies.city IS 'City name';
COMMENT ON COLUMN public.companies.state IS 'State or province name';
COMMENT ON COLUMN public.companies.region IS 'Geographic or coffee region (e.g., Sul de Minas, Cerrado Mineiro)';
COMMENT ON COLUMN public.companies.country IS 'Country name, defaults to Brazil';
COMMENT ON COLUMN public.companies.zip_code IS 'Postal/ZIP code';
