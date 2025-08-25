#!/usr/bin/env python3
"""
Split the bulk import into manageable chunks
"""

def chunk_bulk_import():
    """Split bulk import into smaller files"""
    
    input_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/bulk_import.sql"
    chunk_size = 50  # Records per chunk
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the VALUES section
        values_start = content.find(") VALUES\n") + len(") VALUES\n")
        header = content[:values_start]
        values_section = content[values_start:content.rfind(';')]
        
        # Split into individual records
        records = [r.strip() for r in values_section.split(',\n(')]
        
        # Fix formatting - add opening parenthesis back
        for i in range(1, len(records)):
            records[i] = '(' + records[i]
        
        print(f"Total records to split: {len(records)}")
        
        # Create chunks
        chunk_files = []
        for i in range(0, len(records), chunk_size):
            chunk_num = (i // chunk_size) + 1
            chunk = records[i:i+chunk_size]
            
            chunk_file = f"/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/chunk_{chunk_num:03d}.sql"
            
            with open(chunk_file, 'w', encoding='utf-8') as f:
                f.write(header)
                f.write(",\n".join(chunk))
                f.write(";\n")
            
            chunk_files.append(chunk_file)
            print(f"Created chunk {chunk_num}: {len(chunk)} records")
        
        print(f"\nCreated {len(chunk_files)} chunk files")
        return chunk_files
    
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    chunks = chunk_bulk_import()
    print(f"Chunk files ready for import: {len(chunks)}")