# MCP (Model Context Protocol) Setup Instructions for Supabase

## Configuration Complete

Your MCP configuration has been successfully set up for your Supabase project. The configuration file has been created/updated at:

**File Location:** `C:\Users\Daniel Wolthers\projects\wolthers-travel-app\.mcprc.json`

## Project Details

- **Supabase Project Reference:** `ojyonxplpmhvcgaycznc`
- **Supabase URL:** `https://ojyonxplpmhvcgaycznc.supabase.co`

## Configuration Structure

The `.mcprc.json` file includes:

1. **Official Supabase MCP Server** - Provides access to Supabase management features
2. **Postgres MCP Server** - Direct database access via PostgreSQL protocol

## Required Setup Steps

### 1. Get Your Supabase Personal Access Token

1. Go to [Supabase Dashboard](https://app.supabase.com/account/tokens)
2. Click "Generate new token"
3. Give it a descriptive name (e.g., "MCP Server Access")
4. Copy the token (you won't be able to see it again)

### 2. Get Your Database Password

1. Go to your [Supabase Project Settings](https://app.supabase.com/project/ojyonxplpmhvcgaycznc/settings/database)
2. Find the "Database Password" section
3. Copy your database password

### 3. Using the MCP Configuration

When you start an MCP-enabled application (like Claude Desktop or similar), it will:

1. Prompt you for the **Supabase personal access token**
2. Prompt you for the **Supabase database password**
3. These will be securely stored for the session

## Available MCP Servers

### 1. Supabase MCP Server (`supabase`)
- **Purpose:** Official Supabase management interface
- **Mode:** Read-only (safe for production)
- **Features:**
  - Query and manage database schema
  - View and manage Edge Functions
  - Access project metadata
  - Monitor project health

### 2. Postgres MCP Server (`supabase-postgres`)
- **Purpose:** Direct PostgreSQL database access
- **Connection:** Uses Supabase's connection pooler
- **Features:**
  - Execute SQL queries
  - Manage database objects
  - Perform data operations

## Security Notes

1. **Never commit tokens to Git** - The configuration uses input prompts to avoid storing sensitive data
2. **Read-only mode** - The Supabase MCP server is configured with `--read-only` flag for safety
3. **Session-based** - Credentials are only stored for the duration of your MCP session

## Testing the Configuration

To test if MCP is working correctly:

1. Open your MCP-enabled application
2. The application should prompt for credentials
3. After entering credentials, you should be able to:
   - Query your Supabase project structure
   - Access database tables
   - View Edge Functions
   - Monitor project status

## Removing Read-Only Mode (Optional)

If you need write access to your Supabase project via MCP, you can remove the `--read-only` flag:

1. Edit `.mcprc.json`
2. In the `supabase` server configuration, change:
   ```json
   "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest", "--read-only", "--project-ref=ojyonxplpmhvcgaycznc"]
   ```
   to:
   ```json
   "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest", "--project-ref=ojyonxplpmhvcgaycznc"]
   ```

**Warning:** Removing read-only mode allows write operations to your production database. Use with caution.

## Troubleshooting

### Common Issues:

1. **"Invalid token" error**
   - Ensure you're using a personal access token, not an API key
   - Check that the token hasn't expired

2. **"Connection refused" error**
   - Verify your database password is correct
   - Check that your IP is whitelisted in Supabase network restrictions

3. **"Command not found" error**
   - Ensure Node.js and npm are installed
   - Run `npm install -g npx` if npx is not available

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Supabase MCP Server](https://github.com/supabase/mcp-server-supabase)
- [Supabase Dashboard](https://app.supabase.com/project/ojyonxplpmhvcgaycznc)

## Support

For issues specific to:
- **MCP Configuration:** Check the MCP documentation
- **Supabase:** Visit [Supabase Support](https://supabase.com/support)
- **This Project:** Review the project's CLAUDE.md file for project-specific guidelines