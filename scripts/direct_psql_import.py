#!/usr/bin/env python3
"""
Direct PostgreSQL import using psycopg2
"""
import csv
import psycopg2
import psycopg2.extras

# Database connection details from Supabase startup
DB_CONNECTION = {
    'host': '127.0.0.1',
    'port': '54322',
    'database': 'postgres',
    'user': 'postgres',
    'password': 'postgres'
}

def clean_value(value):
    if not value or value.strip() == '':
        return None
    return value.strip()

def parse_boolean(value):
    if not value or value.strip() == '':
        return None
    return value.upper() == 'T'

def parse_integer(value):
    if not value or value.strip() == '':
        return None
    try:
        return int(value)
    except ValueError:
        return None

def import_via_postgres():
    """Import directly via PostgreSQL connection"""
    
    csv_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/clients.csv"
    
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONNECTION)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        print("Connected to PostgreSQL successfully")
        
        # Check current count
        cursor.execute("SELECT COUNT(*) as count FROM legacy_clients")
        start_count = cursor.fetchone()['count']
        print(f"Starting with {start_count} records in database")
        
        # Prepare batch insert
        records_to_insert = []
        processed_count = 0
        
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                try:
                    legacy_id = parse_integer(row.get('idCLIENTES'))
                    if not legacy_id:
                        continue
                    
                    record = (
                        legacy_id,
                        clean_value(row.get('DESCRICAO')),
                        clean_value(row.get('DESCRICAOFANTASIA')),
                        clean_value(row.get('ENDERECO')),
                        clean_value(row.get('NUMERO')),
                        clean_value(row.get('COMPLEMENTO')),
                        clean_value(row.get('BAIRRO')),
                        clean_value(row.get('CIDADE')),
                        clean_value(row.get('PAIS')),
                        clean_value(row.get('UF')),
                        clean_value(row.get('CEP')),
                        clean_value(row.get('TELEFONE1')),
                        clean_value(row.get('TELEFONE2')),
                        clean_value(row.get('TELEFONE3')),
                        clean_value(row.get('TELEFONE4')),
                        clean_value(row.get('EMAIL')),
                        clean_value(row.get('EMAILCONTRATOS')),
                        clean_value(row.get('PESSOA')),
                        clean_value(row.get('GRUPO1')),
                        clean_value(row.get('GRUPO2')),
                        clean_value(row.get('REFERENCIAS')),
                        clean_value(row.get('OBS')),
                        clean_value(row.get('DOCUMENTO1')),
                        clean_value(row.get('DOCUMENTO2')),
                        clean_value(row.get('DOCUMENTO3')),
                        parse_boolean(row.get('ATIVO')),
                        parse_integer(row.get('IDUSUARIO')),
                        parse_integer(row.get('IDUSUARIOULTIMO')),
                        clean_value(row.get('LOGO')),
                        parse_integer(row.get('LOGOALTURA')),
                        parse_integer(row.get('LOGOLARGURA')),
                        parse_boolean(row.get('AUTOSIZE'))
                    )
                    
                    records_to_insert.append(record)
                    processed_count += 1
                    
                    if processed_count % 100 == 0:
                        print(f"Processed {processed_count} records...")
                
                except Exception as e:
                    print(f"Error processing record {row.get('idCLIENTES', 'unknown')}: {e}")
                    continue
        
        print(f"Total records prepared for import: {len(records_to_insert)}")
        
        # Perform batch insert
        insert_sql = """
            INSERT INTO legacy_clients (
                legacy_client_id, descricao, descricao_fantasia, endereco, numero, complemento,
                bairro, cidade, pais, uf, cep, telefone1, telefone2, telefone3, telefone4,
                email, email_contratos, pessoa, grupo1, grupo2, referencias, obs,
                documento1, documento2, documento3, ativo, id_usuario, id_usuario_ultimo,
                logo, logo_altura, logo_largura, auto_size
            ) VALUES %s
            ON CONFLICT (legacy_client_id) DO NOTHING
        """
        
        # Insert in batches of 100
        batch_size = 100
        successful_batches = 0
        failed_batches = 0
        
        for i in range(0, len(records_to_insert), batch_size):
            batch = records_to_insert[i:i+batch_size]
            try:
                psycopg2.extras.execute_values(cursor, insert_sql, batch)
                conn.commit()
                successful_batches += 1
                print(f"✅ Imported batch {successful_batches} ({len(batch)} records)")
            except Exception as e:
                print(f"❌ Error importing batch starting at {i}: {e}")
                conn.rollback()
                failed_batches += 1
        
        # Final count
        cursor.execute("SELECT COUNT(*) as count FROM legacy_clients")
        final_count = cursor.fetchone()['count']
        
        print(f"\n=== Import Summary ===")
        print(f"📊 Records processed: {processed_count}")
        print(f"✅ Successful batches: {successful_batches}")
        print(f"❌ Failed batches: {failed_batches}")
        print(f"📈 Database count: {start_count} → {final_count}")
        print(f"🎯 Net imported: {final_count - start_count}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"Database connection error: {e}")
        return False

if __name__ == "__main__":
    print("Starting direct PostgreSQL import...")
    if import_via_postgres():
        print("🎉 Import completed successfully!")
    else:
        print("💥 Import failed!")