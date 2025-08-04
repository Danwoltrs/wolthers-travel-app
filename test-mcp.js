#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.mcp' });

async function testMCPConnection() {
    console.log('Testing MCP connection to Supabase...\n');
    
    // Check environment variables
    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_DB_PASSWORD'
    ];
    
    console.log('Checking environment variables...');
    for (const varName of requiredVars) {
        if (process.env[varName]) {
            console.log(`✓ ${varName}: Set`);
        } else {
            console.log(`✗ ${varName}: Missing`);
        }
    }
    console.log();
    
    // Test Supabase client connection
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('Testing Supabase API connection...');
        
        try {
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            
            // Test a simple query
            const { data, error } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .limit(5);
            
            if (error) {
                console.log(`✗ Supabase API connection failed: ${error.message}`);
            } else {
                console.log('✓ Supabase API connection successful');
                console.log(`  Found ${data ? data.length : 0} public tables`);
                if (data && data.length > 0) {
                    console.log('  Sample tables:', data.map(t => t.table_name).join(', '));
                }
            }
        } catch (err) {
            console.log(`✗ Supabase API connection error: ${err.message}`);
        }
    } else {
        console.log('✗ Cannot test Supabase API - missing credentials');
    }
    
    console.log('\nMCP Configuration Status:');
    console.log('- .mcprc.json: Created');
    console.log('- .env.mcp: Created (update with your credentials)');
    console.log('- setup-mcp.sh: Created');
    console.log('- test-mcp.js: Created');
    
    console.log('\nNext Steps:');
    console.log('1. Update credentials in .env.mcp');
    console.log('2. Run: source .env.mcp');
    console.log('3. Run: ./setup-mcp.sh');
    console.log('4. Restart Claude Code to load MCP configuration');
}

testMCPConnection().catch(console.error);