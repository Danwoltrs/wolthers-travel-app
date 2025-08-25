-- Migration: Legacy Clients Setup
-- Created: 2025-08-25
-- Description: Essential setup for legacy client data migration

-- Create basic companies table
CREATE TABLE public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    fantasy_name VARCHAR,
    annual_trip_cost NUMERIC,
    staff_count INTEGER,
    client_type TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create legacy clients table
CREATE TABLE public.legacy_clients (
    id BIGSERIAL PRIMARY KEY,
    legacy_client_id INTEGER NOT NULL UNIQUE,
    company_id UUID REFERENCES public.companies(id),
    
    -- Core company information
    descricao TEXT,
    descricao_fantasia TEXT,
    
    -- Address information
    endereco TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    pais TEXT,
    uf TEXT,
    cep TEXT,
    
    -- Contact information
    telefone1 TEXT,
    telefone2 TEXT,
    telefone3 TEXT,
    telefone4 TEXT,
    email TEXT,
    email_contratos TEXT,
    
    -- Business information
    pessoa TEXT,
    grupo1 TEXT,
    grupo2 TEXT,
    referencias TEXT,
    obs TEXT,
    
    -- Documentation
    documento1 TEXT,
    documento2 TEXT,
    documento3 TEXT,
    
    -- System information
    ativo BOOLEAN DEFAULT true,
    id_usuario INTEGER,
    id_usuario_ultimo INTEGER,
    
    -- Logo information
    logo TEXT,
    logo_altura INTEGER,
    logo_largura INTEGER,
    auto_size BOOLEAN,
    
    -- Audit timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add legacy client linking column to companies table
ALTER TABLE public.companies ADD COLUMN legacy_client_id INTEGER REFERENCES public.legacy_clients(legacy_client_id);

-- Create indexes for performance
CREATE INDEX idx_legacy_clients_legacy_id ON public.legacy_clients(legacy_client_id);
CREATE INDEX idx_legacy_clients_company_id ON public.legacy_clients(company_id);
CREATE INDEX idx_legacy_clients_email ON public.legacy_clients(email);
CREATE INDEX idx_legacy_clients_cidade ON public.legacy_clients(cidade);
CREATE INDEX idx_legacy_clients_ativo ON public.legacy_clients(ativo);
CREATE INDEX idx_companies_legacy_client_id ON public.companies(legacy_client_id);

-- Create client matching table for potential matches
CREATE TABLE public.client_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id),
    legacy_client_id INTEGER REFERENCES public.legacy_clients(legacy_client_id),
    match_confidence DECIMAL(3,2) DEFAULT 0,
    match_reasons TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID
);

-- Create helper view
CREATE VIEW public.companies_with_legacy AS
SELECT 
    c.*,
    lc.descricao as legacy_name,
    lc.descricao_fantasia as legacy_fantasy_name,
    lc.cidade as legacy_city,
    lc.email as legacy_email,
    lc.pessoa as legacy_type,
    lc.grupo1 as legacy_group1,
    lc.grupo2 as legacy_group2,
    lc.ativo as legacy_active
FROM public.companies c
LEFT JOIN public.legacy_clients lc ON c.legacy_client_id = lc.legacy_client_id;

-- Create indexes for client_matches
CREATE INDEX idx_client_matches_company_id ON public.client_matches(company_id);
CREATE INDEX idx_client_matches_legacy_client_id ON public.client_matches(legacy_client_id);
CREATE INDEX idx_client_matches_status ON public.client_matches(status);

-- Insert Wolthers & Associates company
INSERT INTO public.companies (id, name, fantasy_name, staff_count, category)
VALUES ('840783f4-866d-4bdb-9b5d-5d0facf62db0', 'Wolthers & Associates', 'Wolthers', 8, 'importer_roaster');

-- Add comments
COMMENT ON TABLE public.legacy_clients IS 'Legacy client data imported from SQL Server database';
COMMENT ON VIEW public.companies_with_legacy IS 'Companies with their linked legacy client information';
COMMENT ON TABLE public.client_matches IS 'Potential matches between current companies and legacy clients';