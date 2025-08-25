// Node.js script to import legacy clients in batches
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qeW9ueHBscG1odmNnYXljem5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTcwMjQsImV4cCI6MjA2OTI3MzAyNH0.yw_s7ydtABkUJiK_2HqDI2ewbC8tSIW5MJuD_Vwxpak';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function importBatch(batchNumber) {
  try {
    const batchFile = `/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/batch_${batchNumber.toString().padStart(3, '0')}.sql`;
    
    if (!fs.existsSync(batchFile)) {
      console.log(`Batch file ${batchFile} not found`);
      return false;
    }

    const sql = fs.readFileSync(batchFile, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    
    if (error) {
      console.error(`Error importing batch ${batchNumber}:`, error);
      return false;
    }
    
    console.log(`✅ Successfully imported batch ${batchNumber}`);
    return true;
    
  } catch (err) {
    console.error(`Exception importing batch ${batchNumber}:`, err);
    return false;
  }
}

async function importAllBatches() {
  console.log('Starting batch import of legacy clients...');
  
  let successCount = 0;
  let errorCount = 0;
  
  // Import batches 1-19
  for (let i = 1; i <= 19; i++) {
    console.log(`\nImporting batch ${i}/19...`);
    const success = await importBatch(i);
    
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Add a small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n=== Import Summary ===');
  console.log(`✅ Successful batches: ${successCount}`);
  console.log(`❌ Failed batches: ${errorCount}`);
  console.log(`📊 Total batches: ${successCount + errorCount}`);
  
  // Check final count
  try {
    const { data, error } = await supabase
      .from('legacy_clients')
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`📈 Total records in database: ${data.length || 'Unknown'}`);
    }
  } catch (err) {
    console.log('Could not get final count');
  }
}

// Run the import
importAllBatches().catch(console.error);