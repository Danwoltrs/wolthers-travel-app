#!/usr/bin/env python3
"""
Legacy Clients Import Script
Imports client data from CSV into Supabase legacy_clients table
"""

import csv
import os
from supabase import create_client, Client
from datetime import datetime
import sys

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'http://127.0.0.1:54321')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

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

def import_legacy_clients(csv_file_path):
    """Import legacy clients from CSV file"""
    
    if not SUPABASE_SERVICE_ROLE_KEY:
        print("Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required")
        sys.exit(1)
    
    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    imported_count = 0
    skipped_count = 0
    error_count = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                try:
                    # Prepare data for insertion
                    client_data = {
                        'legacy_client_id': parse_integer(row.get('idCLIENTES')),
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
                    
                    # Skip rows without legacy_client_id
                    if not client_data['legacy_client_id']:
                        skipped_count += 1
                        continue
                    
                    # Insert into Supabase
                    result = supabase.table('legacy_clients').insert(client_data).execute()
                    
                    if result.data:
                        imported_count += 1
                        if imported_count % 100 == 0:
                            print(f"Imported {imported_count} clients...")
                    else:
                        print(f"Warning: No data returned for client ID {client_data['legacy_client_id']}")
                        error_count += 1
                
                except Exception as e:
                    error_count += 1
                    print(f"Error importing client {row.get('idCLIENTES', 'unknown')}: {str(e)}")
                    continue
    
    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")
        sys.exit(1)
    
    print(f"\nImport completed:")
    print(f"  Imported: {imported_count} clients")
    print(f"  Skipped: {skipped_count} clients (missing ID)")
    print(f"  Errors: {error_count} clients")
    print(f"  Total processed: {imported_count + skipped_count + error_count}")

if __name__ == "__main__":
    csv_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/clients.csv"
    import_legacy_clients(csv_file)