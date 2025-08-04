#!/bin/bash

echo "Setting up MCP (Model Context Protocol) for Supabase..."

# Install required MCP packages
echo "Installing MCP PostgreSQL server..."
npm install -g @modelcontextprotocol/server-postgres

echo "Installing additional MCP tools..."
npm install -g @modelcontextprotocol/cli

# Make sure Supabase client is available
echo "Ensuring Supabase client is installed..."
npm install @supabase/supabase-js

echo ""
echo "MCP setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the credentials in .env.mcp file"
echo "2. Get your database password from Supabase Dashboard -> Settings -> Database"
echo "3. Get your API keys from Supabase Dashboard -> Settings -> API"
echo "4. Source the environment variables: source .env.mcp"
echo "5. Test the connection using the test script"
echo ""