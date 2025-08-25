// Complete Supabase import using API with service role
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Use local Supabase with service role key
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function cleanValue(value) {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

function parseBoolean(value) {
  if (!value || value.trim() === '') return null;
  return value.toUpperCase() === 'T';
}

function parseInteger(value) {
  if (!value || value.trim() === '') return null;
  try {
    return parseInt(value);
  } catch {
    return null;
  }
}

async function clearExistingData() {
  console.log('Clearing existing data...');
  
  const { error } = await supabase
    .from('legacy_clients')
    .delete()
    .neq('legacy_client_id', 0); // Delete all records
    
  if (error) {
    console.error('Error clearing data:', error);
    return false;
  }
  
  console.log('✅ Existing data cleared');
  return true;
}

async function getCurrentCount() {
  const { count, error } = await supabase
    .from('legacy_clients')
    .select('*', { count: 'exact', head: true });
  
  return error ? 0 : count;
}

async function importBatch(records) {
  try {
    const { data, error } = await supabase
      .from('legacy_clients')
      .insert(records);

    if (error) {
      console.error('Batch import error:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception during batch import:', err);
    return false;
  }
}

async function processCSVComplete() {
  console.log('Starting complete CSV processing and import...');
  
  // Clear existing data first
  const cleared = await clearExistingData();
  if (!cleared) {
    throw new Error('Failed to clear existing data');
  }
  
  const records = [];
  const batchSize = 25; // Smaller batches for reliability
  let processedCount = 0;
  let importedCount = 0;
  let errorCount = 0;
  
  const startCount = await getCurrentCount();
  console.log(`Starting with ${startCount} records in database`);
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('/Users/danielwolthers/Documents/GitHub/wolthers-travel-app/supabase/clients.csv')
      .pipe(csv())
      .on('data', async (row) => {
        try {
          const legacyId = parseInteger(row.idCLIENTES);
          if (!legacyId) {
            return;
          }
          
          const record = {
            legacy_client_id: legacyId,
            descricao: cleanValue(row.DESCRICAO),
            descricao_fantasia: cleanValue(row.DESCRICAOFANTASIA),
            endereco: cleanValue(row.ENDERECO),
            numero: cleanValue(row.NUMERO),
            complemento: cleanValue(row.COMPLEMENTO),
            bairro: cleanValue(row.BAIRRO),
            cidade: cleanValue(row.CIDADE),
            pais: cleanValue(row.PAIS),
            uf: cleanValue(row.UF),
            cep: cleanValue(row.CEP),
            telefone1: cleanValue(row.TELEFONE1),
            telefone2: cleanValue(row.TELEFONE2),
            telefone3: cleanValue(row.TELEFONE3),
            telefone4: cleanValue(row.TELEFONE4),
            email: cleanValue(row.EMAIL),
            email_contratos: cleanValue(row.EMAILCONTRATOS),
            pessoa: cleanValue(row.PESSOA),
            grupo1: cleanValue(row.GRUPO1),
            grupo2: cleanValue(row.GRUPO2),
            referencias: cleanValue(row.REFERENCIAS),
            obs: cleanValue(row.OBS),
            documento1: cleanValue(row.DOCUMENTO1),
            documento2: cleanValue(row.DOCUMENTO2),
            documento3: cleanValue(row.DOCUMENTO3),
            ativo: parseBoolean(row.ATIVO),
            id_usuario: parseInteger(row.IDUSUARIO),
            id_usuario_ultimo: parseInteger(row.IDUSUARIOULTIMO),
            logo: cleanValue(row.LOGO),
            logo_altura: parseInteger(row.LOGOALTURA),
            logo_largura: parseInteger(row.LOGOLARGURA),
            auto_size: parseBoolean(row.AUTOSIZE)
          };
          
          records.push(record);
          processedCount++;
          
          // Import in batches
          if (records.length >= batchSize) {
            const success = await importBatch([...records]);
            if (success) {
              importedCount += records.length;
              console.log(`✅ Imported batch: ${importedCount} total records (${Math.round(importedCount/1866*100)}%)`);
            } else {
              errorCount += records.length;
              console.log(`❌ Failed batch: ${errorCount} errors`);
            }
            records.length = 0; // Clear array
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
        } catch (err) {
          console.error('Error processing record:', err);
          errorCount++;
        }
      })
      .on('end', async () => {
        // Import final batch
        if (records.length > 0) {
          const success = await importBatch(records);
          if (success) {
            importedCount += records.length;
            console.log(`✅ Imported final batch: ${importedCount} total records`);
          } else {
            errorCount += records.length;
            console.log(`❌ Failed final batch`);
          }
        }
        
        const finalCount = await getCurrentCount();
        
        console.log('\n=== Import Summary ===');
        console.log(`📊 Records processed: ${processedCount}`);
        console.log(`✅ Records imported: ${importedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📈 Database count: ${startCount} → ${finalCount}`);
        console.log(`🎯 Net imported: ${finalCount - startCount}`);
        
        if (finalCount >= 1800) { // Allow for small margin
          console.log('🎉 Import appears successful!');
        } else {
          console.log('⚠️ Import may be incomplete');
        }
        
        resolve({ processedCount, importedCount, errorCount, finalCount });
      })
      .on('error', (err) => {
        console.error('CSV processing error:', err);
        reject(err);
      });
  });
}

// Run the import
if (require.main === module) {
  processCSVComplete()
    .then((result) => {
      console.log('\n🎉 Import completed!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n💥 Import failed:', err);
      process.exit(1);
    });
}

module.exports = { processCSVComplete };