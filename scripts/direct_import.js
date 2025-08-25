// Direct import using Node.js and Supabase client
const fs = require('fs');
const csv = require('csv-parser'); // You might need: npm install csv-parser
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qeW9ueHBscG1odmNnYXljem5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTcwMjQsImV4cCI6MjA2OTI3MzAyNH0.yw_s7ydtABkUJiK_2HqDI2ewbC8tSIW5MJuD_Vwxpak';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get already imported IDs
const importedIds = new Set([1742, 1860, 1567, 1781, 1354, 1717, 1564, 1221, 1246, 1223, 1330, 1198, 1196]);

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

async function processCSV() {
  console.log('Starting CSV processing and import...');
  
  const records = [];
  const batchSize = 50;
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
          if (!legacyId || importedIds.has(legacyId)) {
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
              console.log(`✅ Imported batch: ${importedCount} total records`);
            } else {
              errorCount += records.length;
              console.log(`❌ Failed batch: ${errorCount} errors`);
            }
            records.length = 0; // Clear array
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100));
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
  processCSV()
    .then((result) => {
      console.log('\n🎉 Import completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n💥 Import failed:', err);
      process.exit(1);
    });
}

module.exports = { processCSV };