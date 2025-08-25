#!/usr/bin/env python3
"""
Bulk import all remaining legacy clients with duplicate handling
"""
import csv

def generate_bulk_insert():
    """Generate a single bulk INSERT with all remaining records"""
    
    csv_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/clients.csv"
    
    # Get already imported IDs
    imported_ids = {1742, 1860, 1567, 1781, 1354, 1717, 1564, 1221}
    
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
    
    records = []
    processed = 0
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                try:
                    legacy_id = parse_integer(row.get('idCLIENTES'))
                    if legacy_id == 'NULL':
                        continue
                    
                    # Skip already imported IDs
                    if int(legacy_id) in imported_ids:
                        continue
                    
                    # Build value tuple
                    values = f"""({legacy_id}, {clean_value(row.get('DESCRICAO'))}, {clean_value(row.get('DESCRICAOFANTASIA'))}, {clean_value(row.get('ENDERECO'))}, {clean_value(row.get('NUMERO'))}, {clean_value(row.get('COMPLEMENTO'))}, {clean_value(row.get('BAIRRO'))}, {clean_value(row.get('CIDADE'))}, {clean_value(row.get('PAIS'))}, {clean_value(row.get('UF'))}, {clean_value(row.get('CEP'))}, {clean_value(row.get('TELEFONE1'))}, {clean_value(row.get('TELEFONE2'))}, {clean_value(row.get('TELEFONE3'))}, {clean_value(row.get('TELEFONE4'))}, {clean_value(row.get('EMAIL'))}, {clean_value(row.get('EMAILCONTRATOS'))}, {clean_value(row.get('PESSOA'))}, {clean_value(row.get('GRUPO1'))}, {clean_value(row.get('GRUPO2'))}, {clean_value(row.get('REFERENCIAS'))}, {clean_value(row.get('OBS'))}, {clean_value(row.get('DOCUMENTO1'))}, {clean_value(row.get('DOCUMENTO2'))}, {clean_value(row.get('DOCUMENTO3'))}, {parse_boolean(row.get('ATIVO'))}, {parse_integer(row.get('IDUSUARIO'))}, {parse_integer(row.get('IDUSUARIOULTIMO'))}, {clean_value(row.get('LOGO'))}, {parse_integer(row.get('LOGOALTURA'))}, {parse_integer(row.get('LOGOLARGURA'))}, {parse_boolean(row.get('AUTOSIZE'))})"""
                    
                    records.append(values)
                    processed += 1
                
                except Exception as e:
                    print(f"Error processing row: {e}")
                    continue
        
        # Create SQL file
        output_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/bulk_import.sql"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("-- Bulk import of all remaining legacy clients\n")
            f.write("INSERT INTO public.legacy_clients (\n")
            f.write("    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,\n")
            f.write("    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,\n")
            f.write("    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,\n")
            f.write("    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,\n")
            f.write("    logo, logo_altura, logo_largura, auto_size\n")
            f.write(") VALUES\n")
            
            # Write records in chunks to avoid SQL length limits
            chunk_size = 100
            for i in range(0, len(records), chunk_size):
                chunk = records[i:i+chunk_size]
                f.write(",\n".join(chunk))
                
                if i + chunk_size < len(records):
                    f.write(",\n")
                else:
                    f.write(";\n")
        
        print(f"Created bulk import SQL with {processed} new records")
        return output_file, processed
    
    except Exception as e:
        print(f"Error: {e}")
        return None, 0

if __name__ == "__main__":
    output_file, count = generate_bulk_insert()
    if output_file:
        print(f"Bulk import SQL created: {output_file}")
        print(f"Records to import: {count}")
    else:
        print("Failed to create bulk import SQL")