#!/usr/bin/env python3
"""
Complete import of all legacy clients using direct SQL execution
"""
import csv
import time

def create_complete_insert_statements():
    """Create individual INSERT statements for all remaining records"""
    
    csv_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/clients.csv"
    
    # Get already imported IDs - check what we have so far
    imported_ids = {1742, 1860, 1567, 1781, 1354, 1717, 1564, 1221, 1246, 1223, 1330, 1198, 1196}
    
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
    
    statements = []
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
                    
                    # Create individual INSERT statement
                    insert_stmt = f"""INSERT INTO public.legacy_clients (
    legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
    bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
    email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
    documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
    logo, logo_altura, logo_largura, auto_size
) VALUES (
    {legacy_id}, {clean_value(row.get('DESCRICAO'))}, {clean_value(row.get('DESCRICAOFANTASIA'))}, 
    {clean_value(row.get('ENDERECO'))}, {clean_value(row.get('NUMERO'))}, {clean_value(row.get('COMPLEMENTO'))}, 
    {clean_value(row.get('BAIRRO'))}, {clean_value(row.get('CIDADE'))}, {clean_value(row.get('PAIS'))}, 
    {clean_value(row.get('UF'))}, {clean_value(row.get('CEP'))}, {clean_value(row.get('TELEFONE1'))}, 
    {clean_value(row.get('TELEFONE2'))}, {clean_value(row.get('TELEFONE3'))}, {clean_value(row.get('TELEFONE4'))}, 
    {clean_value(row.get('EMAIL'))}, {clean_value(row.get('EMAILCONTRATOS'))}, {clean_value(row.get('PESSOA'))}, 
    {clean_value(row.get('GRUPO1'))}, {clean_value(row.get('GRUPO2'))}, {clean_value(row.get('REFERENCIAS'))}, 
    {clean_value(row.get('OBS'))}, {clean_value(row.get('DOCUMENTO1'))}, {clean_value(row.get('DOCUMENTO2'))}, 
    {clean_value(row.get('DOCUMENTO3'))}, {parse_boolean(row.get('ATIVO'))}, {parse_integer(row.get('IDUSUARIO'))}, 
    {parse_integer(row.get('IDUSUARIOULTIMO'))}, {clean_value(row.get('LOGO'))}, {parse_integer(row.get('LOGOALTURA'))}, 
    {parse_integer(row.get('LOGOLARGURA'))}, {parse_boolean(row.get('AUTOSIZE'))}
);"""
                    
                    statements.append((int(legacy_id), insert_stmt))
                    processed += 1
                
                except Exception as e:
                    print(f"Error processing row: {e}")
                    continue
        
        # Sort by ID for consistent ordering
        statements.sort(key=lambda x: x[0])
        
        # Save to file for reference
        output_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/individual_inserts.sql"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("-- Individual INSERT statements for all remaining legacy clients\n\n")
            for _, stmt in statements:
                f.write(stmt + "\n\n")
        
        print(f"Created {processed} individual INSERT statements")
        print(f"SQL file saved: {output_file}")
        
        return [stmt for _, stmt in statements]
    
    except Exception as e:
        print(f"Error: {e}")
        return []

def show_sample_records():
    """Show first 10 records to be imported"""
    statements = create_complete_insert_statements()
    
    if statements:
        print(f"\nTotal statements to execute: {len(statements)}")
        print("\nFirst few records to be imported:")
        
        for i, stmt in enumerate(statements[:5]):
            # Extract client name from statement
            start = stmt.find("VALUES (\n    ") + 14
            end = stmt.find(",", start)
            client_id = stmt[start:end]
            
            name_start = stmt.find("'", end) + 1
            name_end = stmt.find("'", name_start)
            client_name = stmt[name_start:name_end] if name_start > 0 else "Unknown"
            
            print(f"{i+1}. ID {client_id}: {client_name}")
        
        print(f"... and {len(statements) - 5} more records")
    
    return statements

if __name__ == "__main__":
    statements = show_sample_records()
    print(f"\nReady to import {len(statements)} records")
    print("Statements saved to individual_inserts.sql")