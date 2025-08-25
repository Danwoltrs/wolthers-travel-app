#!/usr/bin/env python3
"""
Create SQL migration file for importing all legacy clients via Supabase migrations
"""
import csv

def create_sql_migration():
    """Create a SQL migration file with all legacy client data"""
    
    csv_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/clients.csv"
    
    def clean_value(value):
        if not value or value.strip() == '':
            return 'NULL'
        escaped = value.strip().replace("'", "''")
        return f"'{escaped}'"
    
    def parse_boolean(value):
        if not value or value.strip() == '':
            return 'NULL'
        return 'true' if value.upper() == 'T' else 'false'
    
    def parse_integer(value):
        if not value or value.strip() == '':
            return 'NULL'
        try:
            return str(int(value))
        except ValueError:
            return 'NULL'
    
    migration_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/migrations/20250825_import_all_legacy_clients.sql"
    
    records_processed = 0
    
    try:
        with open(migration_file, 'w', encoding='utf-8') as f:
            f.write("-- Migration: Import All Legacy Clients\n")
            f.write("-- Created: 2025-08-25\n")
            f.write("-- Description: Complete import of 1866 legacy client records\n\n")
            
            f.write("-- Clear any existing partial data\n")
            f.write("DELETE FROM public.legacy_clients;\n\n")
            
            f.write("-- Reset the sequence to start from 1\n")
            f.write("ALTER SEQUENCE public.legacy_clients_id_seq RESTART WITH 1;\n\n")
            
            f.write("-- Import all legacy client records\n")
            
            with open(csv_file, 'r', encoding='utf-8') as csv_file_handle:
                reader = csv.DictReader(csv_file_handle)
                
                batch_size = 100
                batch_count = 0
                values = []
                
                for row in reader:
                    try:
                        legacy_id = parse_integer(row.get('idCLIENTES'))
                        if legacy_id == 'NULL':
                            continue
                        
                        # Create VALUES entry
                        value_entry = f"""    ({legacy_id}, {clean_value(row.get('DESCRICAO'))}, {clean_value(row.get('DESCRICAOFANTASIA'))}, 
        {clean_value(row.get('ENDERECO'))}, {clean_value(row.get('NUMERO'))}, {clean_value(row.get('COMPLEMENTO'))}, 
        {clean_value(row.get('BAIRRO'))}, {clean_value(row.get('CIDADE'))}, {clean_value(row.get('PAIS'))}, 
        {clean_value(row.get('UF'))}, {clean_value(row.get('CEP'))}, {clean_value(row.get('TELEFONE1'))}, 
        {clean_value(row.get('TELEFONE2'))}, {clean_value(row.get('TELEFONE3'))}, {clean_value(row.get('TELEFONE4'))}, 
        {clean_value(row.get('EMAIL'))}, {clean_value(row.get('EMAILCONTRATOS'))}, {clean_value(row.get('PESSOA'))}, 
        {clean_value(row.get('GRUPO1'))}, {clean_value(row.get('GRUPO2'))}, {clean_value(row.get('REFERENCIAS'))}, 
        {clean_value(row.get('OBS'))}, {clean_value(row.get('DOCUMENTO1'))}, {clean_value(row.get('DOCUMENTO2'))}, 
        {clean_value(row.get('DOCUMENTO3'))}, {parse_boolean(row.get('ATIVO'))}, {parse_integer(row.get('IDUSUARIO'))}, 
        {parse_integer(row.get('IDUSUARIOULTIMO'))}, {clean_value(row.get('LOGO'))}, {parse_integer(row.get('LOGOALTURA'))}, 
        {parse_integer(row.get('LOGOLARGURA'))}, {parse_boolean(row.get('AUTOSIZE'))})"""
                        
                        values.append(value_entry)
                        records_processed += 1
                        
                        # Write batch when we reach batch_size or end of file
                        if len(values) >= batch_size:
                            batch_count += 1
                            
                            f.write(f"-- Batch {batch_count} ({len(values)} records)\n")
                            f.write("INSERT INTO public.legacy_clients (\n")
                            f.write("    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,\n")
                            f.write("    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,\n")
                            f.write("    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,\n")
                            f.write("    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,\n")
                            f.write("    logo, logo_altura, logo_largura, auto_size\n")
                            f.write(") VALUES\n")
                            f.write(",\n".join(values))
                            f.write(";\n\n")
                            
                            values = []  # Clear for next batch
                    
                    except Exception as e:
                        print(f"Error processing row: {e}")
                        continue
                
                # Write final batch if there are remaining values
                if values:
                    batch_count += 1
                    
                    f.write(f"-- Final batch {batch_count} ({len(values)} records)\n")
                    f.write("INSERT INTO public.legacy_clients (\n")
                    f.write("    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,\n")
                    f.write("    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,\n")
                    f.write("    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,\n")
                    f.write("    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,\n")
                    f.write("    logo, logo_altura, logo_largura, auto_size\n")
                    f.write(") VALUES\n")
                    f.write(",\n".join(values))
                    f.write(";\n\n")
            
            f.write("-- Verify import\n")
            f.write("SELECT COUNT(*) as total_imported FROM public.legacy_clients;\n")
            
            print(f"✅ Created SQL migration with {records_processed} records in {batch_count} batches")
            print(f"📄 Migration file: {migration_file}")
            
            return migration_file
    
    except Exception as e:
        print(f"❌ Error creating migration: {e}")
        return None

if __name__ == "__main__":
    print("Creating Supabase SQL migration for legacy clients...")
    migration_file = create_sql_migration()
    
    if migration_file:
        print(f"\n🎯 Next step: Apply the migration using:")
        print(f"npx supabase db reset --local")
        print("This will apply all migrations including the new import.")
    else:
        print("❌ Failed to create migration file")