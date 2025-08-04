# MCP (Model Context Protocol) Setup for Supabase

This guide explains how to set up MCP connections to your Supabase database, allowing Claude Code to interact directly with your database for development tasks.

## Files Created

- `.mcprc.json` - Main MCP configuration file for Claude Code
- `.env.mcp` - Environment variables for sensitive credentials (excluded from git)
- `setup-mcp.sh` - Installation script for MCP packages
- `test-mcp.js` - Connection testing script
- `MCP_SETUP.md` - This documentation file

## Quick Setup

1. **Install required packages:**
   ```bash
   ./setup-mcp.sh
   ```

2. **Get your Supabase credentials:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project: `ojyonxplpmhvcgaycznc`
   - Navigate to Settings → API to get your keys
   - Navigate to Settings → Database to get your database password

3. **Update the `.env.mcp` file with your actual credentials:**
   ```bash
   # Replace these placeholder values with your actual credentials
   SUPABASE_ANON_KEY=your_actual_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   SUPABASE_DB_PASSWORD=your_actual_database_password
   ```

4. **Test the connection:**
   ```bash
   npm install dotenv  # if not already installed
   node test-mcp.js
   ```

5. **Restart Claude Code** to load the new MCP configuration

## What This Enables

Once set up, Claude Code will be able to:

### Database Operations
- **Schema Inspection**: View tables, columns, indexes, and relationships
- **Data Queries**: Execute SELECT queries to examine data
- **Data Modifications**: INSERT, UPDATE, DELETE operations
- **Migration Support**: Help create and review database migrations

### Development Tasks
- **Database Design**: Suggest schema improvements and optimizations
- **Data Analysis**: Analyze existing data patterns and integrity
- **Migration Generation**: Create Supabase migration files
- **Query Optimization**: Help optimize slow queries

### Supabase-Specific Features
- **RLS Policies**: Help set up Row Level Security policies
- **Functions**: Assist with PostgreSQL functions and triggers
- **Real-time**: Configure real-time subscriptions
- **Storage**: Manage storage buckets and policies

## Configuration Details

### MCP Servers

The configuration includes two MCP servers:

1. **supabase-postgres**: Direct PostgreSQL connection for database operations
2. **supabase-api**: Supabase API connection for higher-level operations

### Connection String Format

```
postgresql://postgres.ojyonxplpmhvcgaycznc:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Environment Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `SUPABASE_URL` | Your project URL | Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Anonymous/public key | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (full access) | Dashboard → Settings → API |
| `SUPABASE_DB_PASSWORD` | Database password | Dashboard → Settings → Database |
| `SUPABASE_ACCESS_TOKEN` | Personal access token | Already provided |

## Security Notes

- The `.env.mcp` file is excluded from git to protect your credentials
- Service role key provides full database access - keep it secure
- Only use this setup in trusted development environments
- Consider using separate credentials for development vs production

## Troubleshooting

### Connection Issues

1. **Invalid credentials**: Verify all credentials in `.env.mcp`
2. **Network access**: Ensure your IP is allowed in Supabase network restrictions
3. **Package installation**: Run `./setup-mcp.sh` to install required packages

### Testing Connection

Run the test script to diagnose issues:
```bash
node test-mcp.js
```

This will check:
- Environment variable configuration
- Supabase API connectivity
- Database access permissions

### Common Error Messages

- `Invalid JWT`: Check your API keys
- `Connection refused`: Verify database password and connection string
- `Permission denied`: Ensure service role key has required permissions

## Usage Examples

Once MCP is configured, you can ask Claude Code to:

```
"Show me the current database schema"
"Create a migration to add a new trips table"
"Analyze the data in the users table"
"Help me set up RLS policies for the trips table"
"Optimize this slow query: SELECT * FROM..."
```

## Next Steps

After successful setup:

1. Test basic database queries through Claude Code
2. Create your first database migration
3. Set up proper RLS policies for your tables
4. Import any existing data or schema from legacy systems

## Support

If you encounter issues:
1. Check the test script output for specific error messages
2. Verify all credentials are correctly set
3. Ensure your Supabase project is active and accessible
4. Review Supabase network restrictions and IP allowlists