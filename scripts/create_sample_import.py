#!/usr/bin/env python3
"""
Create a sample import with first 10 records for testing
"""

def create_sample_sql():
    input_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/migrations/import_legacy_clients.sql"
    output_file = "/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/sample_import.sql"
    
    with open(input_file, 'r') as infile:
        lines = infile.readlines()
    
    # Find first 10 INSERT statements
    sample_lines = []
    insert_count = 0
    in_insert = False
    
    for line in lines:
        if line.strip().startswith('BEGIN;'):
            sample_lines.append(line)
            sample_lines.append('\n')
        elif line.strip().startswith('INSERT INTO'):
            if insert_count < 10:
                sample_lines.append(line)
                in_insert = True
                insert_count += 1
            else:
                break
        elif in_insert:
            sample_lines.append(line)
            if line.strip().endswith(');'):
                in_insert = False
                sample_lines.append('\n')
    
    # Add commit
    sample_lines.append('COMMIT;\n')
    sample_lines.append(f'\n-- Sample import of {insert_count} records\n')
    
    with open(output_file, 'w') as outfile:
        outfile.writelines(sample_lines)
    
    print(f"Created sample SQL with {insert_count} records: {output_file}")

if __name__ == "__main__":
    create_sample_sql()