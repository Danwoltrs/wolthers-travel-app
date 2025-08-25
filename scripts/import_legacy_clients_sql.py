#!/usr/bin/env python3
"""
Legacy Clients Import Script - SQL Generation Version
Generates SQL INSERT statements from CSV for manual execution
"""

import csv
import os

def clean_value(value):
    """Clean and prepare value for SQL insertion"""
    if not value or value.strip() == '':
        return 'NULL'
    # Escape single quotes for SQL
    escaped = value.strip().replace("'", "''")
    return f"'{escaped}'"

def parse_boolean(value):
    """Convert string boolean to SQL boolean"""
    if not value or value.strip() == '':
        return 'NULL'
    return 'true' if value.upper() == 'T' else 'false'

def parse_integer(value):
    """Convert string to integer for SQL, handling empty values"""
    if not value or value.strip() == '':
        return 'NULL'
    try:
        return str(int(value))
    except ValueError:
        return 'NULL'

def generate_sql_from_csv(csv_file_path, output_sql_file):
    """Generate SQL INSERT statements from CSV file"""
    
    sql_statements = []
    sql_statements.append("-- Legacy Clients Import SQL")
    sql_statements.append("-- Generated from CSV data")
    sql_statements.append("BEGIN;")
    sql_statements.append("")
    
    processed_count = 0
    skipped_count = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                try:
                    # Skip rows without legacy_client_id
                    legacy_id = parse_integer(row.get('idCLIENTES'))
                    if legacy_id == 'NULL':
                        skipped_count += 1
                        continue
                    
                    # Build INSERT statement
                    insert_sql = f"""INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES (
    {legacy_id},
    {clean_value(row.get('DESCRICAO'))},
    {clean_value(row.get('DESCRICAOFANTASIA'))},
    {clean_value(row.get('ENDERECO'))},
    {clean_value(row.get('NUMERO'))},
    {clean_value(row.get('COMPLEMENTO'))},
    {clean_value(row.get('BAIRRO'))},
    {clean_value(row.get('CIDADE'))},
    {clean_value(row.get('PAIS'))},
    {clean_value(row.get('UF'))},
    {clean_value(row.get('CEP'))},
    {clean_value(row.get('TELEFONE1'))},
    {clean_value(row.get('TELEFONE2'))},
    {clean_value(row.get('TELEFONE3'))},
    {clean_value(row.get('TELEFONE4'))},
    {clean_value(row.get('EMAIL'))},
    {clean_value(row.get('EMAILCONTRATOS'))},
    {clean_value(row.get('PESSOA'))},
    {clean_value(row.get('GRUPO1'))},
    {clean_value(row.get('GRUPO2'))},
    {clean_value(row.get('REFERENCIAS'))},
    {clean_value(row.get('OBS'))},
    {clean_value(row.get('DOCUMENTO1'))},
    {clean_value(row.get('DOCUMENTO2'))},
    {clean_value(row.get('DOCUMENTO3'))},
    {parse_boolean(row.get('ATIVO'))},
    {parse_integer(row.get('IDUSUARIO'))},
    {parse_integer(row.get('IDUSUARIOULTIMO'))},
    {clean_value(row.get('LOGO'))},
    {parse_integer(row.get('LOGOALTURA'))},
    {parse_integer(row.get('LOGOLARGURA'))},
    {parse_boolean(row.get('AUTOSIZE'))}
);"""
                    
                    sql_statements.append(insert_sql)
                    processed_count += 1
                    
                    if processed_count % 100 == 0:
                        sql_statements.append(f"-- Processed {processed_count} clients...")
                
                except Exception as e:
                    skipped_count += 1
                    sql_statements.append(f"-- Error processing client {row.get('idCLIENTES', 'unknown')}: {str(e)}")
                    continue
    
    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_file_path}")
        return False
    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")
        return False
    
    # Add final statements
    sql_statements.append("")
    sql_statements.append("COMMIT;")
    sql_statements.append("")
    sql_statements.append(f"-- Import Summary:")
    sql_statements.append(f"-- Processed: {processed_count} clients")
    sql_statements.append(f"-- Skipped: {skipped_count} clients")
    sql_statements.append(f"-- Total: {processed_count + skipped_count} rows")
    
    # Write SQL file
    with open(output_sql_file, 'w', encoding='utf-8') as output:
        output.write('\n'.join(sql_statements))
    
    print(f"SQL file generated: {output_sql_file}")
    print(f"Processed: {processed_count} clients")
    print(f"Skipped: {skipped_count} clients (missing ID)")
    print(f"Total: {processed_count + skipped_count} rows processed")
    
    return True

if __name__ == "__main__":
    csv_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/clients.csv"
    sql_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/migrations/import_legacy_clients.sql"
    
    if generate_sql_from_csv(csv_file, sql_file):
        print(f"\nNext steps:")
        print(f"1. Review the generated SQL file: {sql_file}")
        print(f"2. Execute via Supabase CLI: npx supabase db reset --local")
        print(f"3. Or run the SQL directly in your database client")
    else:
        print("Failed to generate SQL file")