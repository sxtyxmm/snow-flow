# MCP Server Configuration Fix Documentation

## Problem Summary

Two MCP servers (`servicenow-intelligent` and `servicenow-memory`) were failing to start properly due to configuration issues:

1. **Duplicate Registrations**: The `.mcp.json` file had both "servers" and "mcpServers" sections with conflicting configurations
2. **Naming Inconsistencies**: Mix of "snow-flow-" and "servicenow-" prefixes across different configuration files
3. **Memory Server Confusion**: Both `servicenow-memory` and `servicenow-graph-memory` servers exist but weren't properly registered
4. **Template Mismatches**: Configuration templates were inconsistent

## Solution Implemented

### 1. Unified Configuration Structure

All MCP server configurations now use:
- **Consistent naming**: `servicenow-*` prefix for all ServiceNow servers
- **Single configuration key**: `mcpServers` (not "servers")
- **Environment variable placeholders**: Using `${VAR_NAME}` syntax

### 2. Configuration Files Updated

#### `.mcp.json`
- Removed duplicate "servers" section
- All servers under "mcpServers" key
- Using environment variable placeholders

#### `.mcp.json.template`
- Updated to match the structure of `.mcp.json`
- Uses `{{PROJECT_ROOT}}` placeholder for paths
- Consistent with other template files

#### `.claude.mcp-config.template`
- Updated to use "mcpServers" key
- Uses `${MCP_PATH}` placeholder for paths

#### `scripts/register-mcp-servers.js`
- Updated to register servers with correct names
- Now uses "mcpServers" instead of "servers"
- Includes all 13 MCP servers

#### `.snow-flow/mcp-servers.json`
- Added both `servicenow-memory` and `servicenow-graph-memory`
- Consistent naming and structure

### 3. Automated Fix Script

Created `scripts/fix-mcp-configuration.js` that:
- Automatically updates all configuration files
- Ensures consistency across templates
- Can be run to fix configuration issues

## How It Works Now

1. **Installation**: When Snow-Flow is installed via npm, the configuration templates are used
2. **Initialization**: `snow-flow init` command creates proper `.mcp.json` from template
3. **Registration**: `register-mcp-servers.js` adds servers to Claude's configuration
4. **Startup**: All servers start correctly with proper environment variables

## Server List

All 13 MCP servers are now properly configured:

1. `servicenow-deployment`
2. `servicenow-update-set`
3. `servicenow-intelligent`
4. `servicenow-memory`
5. `servicenow-graph-memory`
6. `servicenow-operations`
7. `servicenow-platform-development`
8. `servicenow-integration`
9. `servicenow-automation`
10. `servicenow-security-compliance`
11. `servicenow-reporting-analytics`
12. `servicenow-flow-composer`
13. `snow-flow`

## Testing

To verify the fix works:

1. **Direct Test**: 
   ```bash
   node dist/mcp/servicenow-intelligent-mcp.js
   node dist/mcp/servicenow-memory-mcp.js
   ```
   Both should start without errors.

2. **Fresh Installation Test**:
   ```bash
   cd /tmp
   npm install snow-flow
   snow-flow init
   ```
   All servers should be available in Claude Code.

3. **MCP Registration Test**:
   ```bash
   node scripts/register-mcp-servers.js
   ```
   Should register all 13 servers.

## Maintenance

If configuration issues arise in the future:

1. Run the fix script: `node scripts/fix-mcp-configuration.js`
2. Rebuild: `npm run build`
3. Re-register: `node scripts/register-mcp-servers.js`

This ensures all configurations remain consistent and properly structured.