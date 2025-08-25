#!/usr/bin/env python3
"""
Create smaller SQL batches for importing
"""
import csv

def create_batch_inserts(csv_file_path, batch_size=100):
    """Create SQL batches from CSV"""
    
    batch_files = []
    current_batch = []
    batch_num = 1
    processed = 0
    skipped_ids = {1742, 1860, 1567}  # Already imported in sample
    
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
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                try:
                    legacy_id = parse_integer(row.get('idCLIENTES'))
                    if legacy_id == 'NULL':
                        continue
                    
                    # Skip already imported IDs
                    if int(legacy_id) in skipped_ids:
                        continue
                    
                    # Build value tuple
                    values = f"""({legacy_id}, {clean_value(row.get('DESCRICAO'))}, {clean_value(row.get('DESCRICAOFANTASIA'))}, 
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
                    
                    current_batch.append(values)
                    processed += 1
                    
                    # Create batch file when full
                    if len(current_batch) >= batch_size:
                        batch_file = f"/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/batch_{batch_num:03d}.sql"
                        
                        with open(batch_file, 'w', encoding='utf-8') as batch:
                            batch.write("INSERT INTO public.legacy_clients (\n")
                            batch.write("    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,\n")
                            batch.write("    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,\n")
                            batch.write("    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,\n")
                            batch.write("    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,\n")
                            batch.write("    logo, logo_altura, logo_largura, auto_size\n")
                            batch.write(") VALUES\n")
                            batch.write(",\n".join(current_batch))
                            batch.write(";\n")
                        
                        batch_files.append(batch_file)
                        print(f"Created batch {batch_num}: {len(current_batch)} records")
                        current_batch = []
                        batch_num += 1
                
                except Exception as e:
                    print(f"Error processing row: {e}")
                    continue
        
        # Create final batch
        if current_batch:
            batch_file = f"/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/batch_{batch_num:03d}.sql"
            
            with open(batch_file, 'w', encoding='utf-8') as batch:
                batch.write("INSERT INTO public.legacy_clients (\n")
                batch.write("    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,\n")
                batch.write("    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,\n")
                batch.write("    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,\n")
                batch.write("    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,\n")
                batch.write("    logo, logo_altura, logo_largura, auto_size\n")
                batch.write(") VALUES\n")
                batch.write(",\n".join(current_batch))
                batch.write(";\n")
            
            batch_files.append(batch_file)
            print(f"Created final batch {batch_num}: {len(current_batch)} records")
    
    except Exception as e:
        print(f"Error: {e}")
        return []
    
    print(f"\nCreated {len(batch_files)} batch files with {processed} total records")
    return batch_files

if __name__ == "__main__":
    csv_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/clients.csv"
    batches = create_batch_inserts(csv_file, 100)
    print(f"Batch files: {batches}")