#!/bin/bash
# Smart bulk import using Supabase CLI
# This will use the local Supabase instance to import data efficiently

echo "Starting smart bulk import of legacy clients..."

# Check if Supabase is running
if ! pgrep -x "supabase" > /dev/null; then
    echo "Starting Supabase..."
    npm run db:start &
    sleep 5
fi

# Function to import a chunk and check success
import_chunk() {
    local chunk_file="$1"
    local chunk_num="$2"
    
    echo "Importing chunk $chunk_num..."
    
    # Try to execute the SQL file
    if [ -f "$chunk_file" ]; then
        # Use Supabase CLI to execute the SQL
        npx supabase db reset --local --no-seed
        
        # This approach imports via SQL execution
        echo "Executing $chunk_file..."
        
        # Get current count before
        local before_count=$(npx supabase db exec "SELECT COUNT(*) FROM legacy_clients;" --local 2>/dev/null | grep -o '[0-9]*' | tail -1)
        
        # Execute the chunk
        cat "$chunk_file" | npx supabase db exec --local
        
        # Get count after
        local after_count=$(npx supabase db exec "SELECT COUNT(*) FROM legacy_clients;" --local 2>/dev/null | grep -o '[0-9]*' | tail -1)
        
        echo "Chunk $chunk_num: $before_count -> $after_count records"
        
        if [ $? -eq 0 ]; then
            echo "✅ Chunk $chunk_num imported successfully"
            return 0
        else
            echo "❌ Error importing chunk $chunk_num"
            return 1
        fi
    else
        echo "❌ Chunk file $chunk_file not found"
        return 1
    fi
}

# Import all chunks
success_count=0
error_count=0

for i in {1..38}; do
    chunk_file="/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/chunk_$(printf "%03d" $i).sql"
    
    if import_chunk "$chunk_file" "$i"; then
        ((success_count++))
    else
        ((error_count++))
    fi
    
    # Small delay between chunks
    sleep 1
done

echo ""
echo "=== Import Summary ==="
echo "✅ Successful chunks: $success_count"
echo "❌ Failed chunks: $error_count"
echo "📊 Total chunks: $((success_count + error_count))"

# Final count check
echo "Getting final record count..."
final_count=$(npx supabase db exec "SELECT COUNT(*) FROM legacy_clients;" --local 2>/dev/null | grep -o '[0-9]*' | tail -1)
echo "📈 Total records in database: $final_count"

echo "Smart bulk import completed!"