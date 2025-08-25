#!/usr/bin/env python3
"""
Batch import legacy clients using direct SQL execution
"""
import csv
import os
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = 'http://127.0.0.1:54321'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qeW9ueHBscG1odmNnYXljem5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTcwMjQsImV4cCI6MjA2OTI3MzAyNH0.yw_s7ydtABkUJiK_2HqDI2ewbC8tSIW5MJuD_Vwxpak'

def clean_value(value):
    """Clean and normalize CSV values"""
    if not value or value.strip() == '':
        return None
    return value.strip()

def parse_boolean(value):
    """Convert string boolean to Python boolean"""
    if not value:
        return None
    return value.upper() == 'T'

def parse_integer(value):
    """Convert string to integer, handling empty values"""
    if not value or value.strip() == '':
        return None
    try:
        return int(value)
    except ValueError:
        return None

def batch_import_clients(csv_file_path, batch_size=50):
    """Import legacy clients in batches"""
    
    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    imported_count = 0
    skipped_count = 0
    error_count = 0
    batch_data = []
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                try:
                    # Skip rows without legacy_client_id or if already exists
                    legacy_id = parse_integer(row.get('idCLIENTES'))
                    if not legacy_id:
                        skipped_count += 1
                        continue
                    
                    # Check if already exists (skip first 3 from sample)
                    if legacy_id in [1742, 1860, 1567]:
                        skipped_count += 1
                        continue
                    
                    # Prepare data for insertion
                    client_data = {
                        'legacy_client_id': legacy_id,
                        'descricao': clean_value(row.get('DESCRICAO')),
                        'descricao_fantasia': clean_value(row.get('DESCRICAOFANTASIA')),
                        'endereco': clean_value(row.get('ENDERECO')),
                        'numero': clean_value(row.get('NUMERO')),
                        'complemento': clean_value(row.get('COMPLEMENTO')),
                        'bairro': clean_value(row.get('BAIRRO')),
                        'cidade': clean_value(row.get('CIDADE')),
                        'pais': clean_value(row.get('PAIS')),
                        'uf': clean_value(row.get('UF')),
                        'cep': clean_value(row.get('CEP')),
                        'telefone1': clean_value(row.get('TELEFONE1')),
                        'telefone2': clean_value(row.get('TELEFONE2')),
                        'telefone3': clean_value(row.get('TELEFONE3')),
                        'telefone4': clean_value(row.get('TELEFONE4')),
                        'email': clean_value(row.get('EMAIL')),
                        'email_contratos': clean_value(row.get('EMAILCONTRATOS')),
                        'pessoa': clean_value(row.get('PESSOA')),
                        'grupo1': clean_value(row.get('GRUPO1')),
                        'grupo2': clean_value(row.get('GRUPO2')),
                        'referencias': clean_value(row.get('REFERENCIAS')),
                        'obs': clean_value(row.get('OBS')),
                        'documento1': clean_value(row.get('DOCUMENTO1')),
                        'documento2': clean_value(row.get('DOCUMENTO2')),
                        'documento3': clean_value(row.get('DOCUMENTO3')),
                        'ativo': parse_boolean(row.get('ATIVO')),
                        'id_usuario': parse_integer(row.get('IDUSUARIO')),
                        'id_usuario_ultimo': parse_integer(row.get('IDUSUARIOULTIMO')),
                        'logo': clean_value(row.get('LOGO')),
                        'logo_altura': parse_integer(row.get('LOGOALTURA')),
                        'logo_largura': parse_integer(row.get('LOGOLARGURA')),
                        'auto_size': parse_boolean(row.get('AUTOSIZE'))
                    }
                    
                    batch_data.append(client_data)
                    
                    # Insert batch when full
                    if len(batch_data) >= batch_size:
                        result = supabase.table('legacy_clients').insert(batch_data).execute()
                        if result.data:
                            imported_count += len(batch_data)
                            print(f"Imported batch: {imported_count} clients total")
                        else:
                            error_count += len(batch_data)
                            print(f"Error importing batch at {imported_count}")
                        batch_data = []
                
                except Exception as e:
                    error_count += 1
                    print(f"Error processing client {row.get('idCLIENTES', 'unknown')}: {str(e)}")
                    continue
        
        # Insert final batch
        if batch_data:
            result = supabase.table('legacy_clients').insert(batch_data).execute()
            if result.data:
                imported_count += len(batch_data)
                print(f"Imported final batch: {imported_count} clients total")
            else:
                error_count += len(batch_data)
                print(f"Error importing final batch")
    
    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_file_path}")
        return False
    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")
        return False
    
    print(f"\nBatch import completed:")
    print(f"  Imported: {imported_count} clients")
    print(f"  Skipped: {skipped_count} clients")
    print(f"  Errors: {error_count} clients")
    print(f"  Total processed: {imported_count + skipped_count + error_count}")
    
    return True

if __name__ == "__main__":
    csv_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/clients.csv"
    batch_import_clients(csv_file, batch_size=50)