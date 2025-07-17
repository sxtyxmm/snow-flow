# Snow-Flow Project

A comprehensive ServiceNow multi-agent development platform with intelligent MCP (Model Context Protocol) server integration for Claude Code.

## Features

### 🔍 Advanced ServiceNow Search
- **Intelligent Search**: Multi-strategy search (exact match → contains → description → wildcards)
- **Comprehensive Search**: Cross-table search across 16+ ServiceNow tables
- **Claude Code Integration**: Seamless MCP server integration for real-time ServiceNow interaction

### 🤖 Multi-Agent Capabilities
- **SPARC Development**: 17 specialized development modes
- **Swarm Coordination**: Multi-agent collaboration with shared memory
- **Memory Management**: Persistent cross-session artifact indexing

### 🔧 ServiceNow Integration
- **OAuth 2.0 + PKCE**: Secure authentication with automatic token refresh
- **Artifact Management**: Create, read, update ServiceNow artifacts
- **Update Set Support**: Automated change tracking and deployment

## Quick Start

### 1. Initial Setup
```bash
# Clone the repository
git clone https://github.com/groeimetai/snow-flow.git
cd snow-flow

# Install dependencies
npm install

# Build the project
npm run build

# Initialize MCP configuration
npm run setup-mcp
```

### 2. Configure ServiceNow
Create a `.env` file with your ServiceNow credentials:
```env
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-client-id
SNOW_CLIENT_SECRET=your-client-secret
```

### 3. Authenticate
```bash
# Login to ServiceNow
snow-flow auth login
```

### 4. Start Development
```bash
# Start orchestration system with web UI
snow-flow start --ui

# Create a widget using swarm
snow-flow swarm "create a widget for incident management"

# Use SPARC development mode
snow-flow sparc tdd "user authentication system"
```

## MCP Server Integration

This project includes intelligent MCP servers for Claude Code integration:

### ServiceNow Intelligent MCP
- **Tool**: `snow_find_artifact` - Smart artifact discovery with natural language
- **Tool**: `snow_comprehensive_search` - Multi-table search across ServiceNow
- **Tool**: `snow_edit_artifact` - Natural language artifact modification
- **Tool**: `snow_analyze_artifact` - Deep artifact analysis and indexing

### ServiceNow Deployment MCP
- **Tool**: `snow_deploy_widget` - Widget deployment with Update Set management
- **Tool**: `snow_test_connection` - ServiceNow connectivity testing

## Search Capabilities

### Standard Search
```javascript
// Find specific artifact by type
snow_find_artifact("Prevent invalid language code", "business_rule")

// Natural language search
snow_find_artifact("widget that shows incidents", "any")
```

### Comprehensive Search
```javascript
// Multi-table search with metadata
snow_comprehensive_search("language validation")

// Include inactive records
snow_comprehensive_search("approval workflow", { include_inactive: true })
```

## Project Structure

```
├── src/
│   ├── mcp/                    # MCP server implementations
│   │   ├── servicenow-intelligent-mcp.ts
│   │   └── servicenow-deployment-mcp.ts
│   ├── utils/                  # Utility functions
│   │   ├── servicenow-client.ts
│   │   ├── snow-oauth.ts
│   │   └── logger.ts
│   └── commands/               # CLI commands
├── scripts/                    # Build and setup scripts
├── memory/                     # Persistent memory storage
├── .claude/                    # Claude configuration
└── dist/                       # Compiled output
```

## Development Modes

### SPARC Modes
- `orchestrator` - Multi-agent coordination
- `coder` - Direct development
- `researcher` - Information gathering
- `tdd` - Test-driven development
- `architect` - System design
- `reviewer` - Code review
- `debugger` - Issue resolution
- `tester` - Quality assurance
- `analyzer` - Performance analysis
- `optimizer` - Code optimization
- `documenter` - Documentation
- `designer` - UI/UX design
- `innovator` - Creative solutions
- `swarm-coordinator` - Team management
- `memory-manager` - Data management
- `batch-executor` - Bulk operations
- `workflow-manager` - Process automation

### Swarm Strategies
- `research` - Information gathering
- `development` - Feature building
- `analysis` - Data processing
- `testing` - Quality assurance
- `optimization` - Performance tuning
- `maintenance` - System upkeep

## Configuration

### MCP Server Configuration
The project automatically generates `.mcp.json` with dynamic paths:
```json
{
  "mcpServers": {
    "servicenow-intelligent": {
      "command": "node",
      "args": ["./dist/mcp/servicenow-intelligent-mcp.js"]
    },
    "servicenow-deployment": {
      "command": "node", 
      "args": ["./dist/mcp/servicenow-deployment-mcp.js"]
    }
  }
}
```

### Authentication
OAuth 2.0 with PKCE flow:
- Secure token storage in `~/.snow-flow/auth.json`
- Automatic token refresh
- Cross-session persistence

## API Reference

### ServiceNow Client
```typescript
// Search for artifacts
const results = await client.searchRecords('sys_script', 'name=My Rule');

// Create widget
const widget = await client.createWidget({
  name: 'My Widget',
  template: '<div>Hello World</div>',
  // ... other properties
});

// Test connection
const status = await client.testConnection();
```

### OAuth Management
```typescript
// Check authentication
const isAuth = await oauth.isAuthenticated();

// Get access token
const token = await oauth.getAccessToken();

// Refresh token
const refreshResult = await oauth.refreshAccessToken();
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```bash
   # Clear stored tokens
   rm ~/.snow-flow/auth.json
   
   # Re-authenticate
   snow-flow auth login
   ```

2. **MCP Server Connection**
   ```bash
   # Rebuild and setup MCP
   npm run build
   npm run setup-mcp
   ```

3. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :3005
   
   # Kill processes if needed
   pkill -f "snow-flow"
   ```

### Debug Mode
```bash
# Enable debug logging
export SNOW_LOG_LEVEL=debug

# Run with verbose output
snow-flow --verbose sparc "debug authentication"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Documentation

- Configuration: `.claude/config.json`
- Memory system: `memory/servicenow_artifacts/`
- Project structure: `.claude/commands/`
- MCP Tools: Available in Claude Code after setup
