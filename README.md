# Snow-Flow

ServiceNow development framework with MCP (Model Context Protocol) server integration and Claude AI orchestration.

## What It Is

Snow-Flow is a Node.js application that provides:
- 12 MCP servers for ServiceNow operations
- Command-line interface for task orchestration
- Multi-agent coordination system
- OAuth authentication for ServiceNow instances
- Background script execution with ES5 JavaScript only

## Requirements

- Node.js 18 or higher
- ServiceNow instance with OAuth configured
- Client ID and Client Secret for authentication
- Instance URL (format: myinstance.service-now.com)

## Installation

```bash
npm install -g snow-flow
```

## Configuration

Create `.env` file with ServiceNow credentials:

```env
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-client-id
SNOW_CLIENT_SECRET=your-client-secret
```

## MCP Servers

Snow-Flow includes 12 MCP servers:

1. **servicenow-deployment** - Widget and artifact deployment with coherence validation
2. **servicenow-operations** - Table operations and queries
3. **servicenow-automation** - Script execution and job scheduling
4. **servicenow-platform-development** - Business rules and script includes
5. **servicenow-integration** - REST messages and data imports
6. **servicenow-system-properties** - System property management
7. **servicenow-update-set** - Update set management
8. **servicenow-development-assistant** - Code generation
9. **servicenow-security-compliance** - Security policies
10. **servicenow-reporting-analytics** - Reports and dashboards
11. **servicenow-machine-learning** - ML model training
12. **snow-flow** - Orchestration and memory management

## Basic Commands

Start orchestration system:
```bash
snow-flow start
```

Create agent:
```bash
snow-flow agent spawn researcher
```

Execute task:
```bash
snow-flow task create analysis "Analyze incident patterns"
```

Run swarm coordination:
```bash
snow-flow swarm "Create incident dashboard"
```

Store data in memory:
```bash
snow-flow memory store key "data"
```

## Script Execution

Snow-Flow executes ServiceNow background scripts using ES5 JavaScript only:

```javascript
// Supported ES5 syntax
var gr = new GlideRecord('incident');
gr.query();
while (gr.next()) {
  gs.info(gr.getValue('number'));
}

// NOT supported (ES6+ will fail)
const data = await fetch();  // Will fail
let items = [];              // Will fail
() => {}                     // Will fail
```

## Widget Development

Widgets require coherent communication between three components:
- Server script provides data
- Client script handles interactions
- HTML template displays content

Server and client scripts must align on:
- Data property names
- Action names for requests
- Method names for UI events

## Authentication

Snow-Flow uses OAuth 2.0 for ServiceNow authentication:
1. Configure OAuth provider in ServiceNow
2. Set client credentials in .env
3. Snow-Flow handles token refresh automatically

## Directory Structure

```
snow-flow/
├── src/
│   ├── mcp/           # MCP server implementations
│   ├── client/        # ServiceNow API client
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript definitions
├── dist/              # Compiled JavaScript
└── .mcp.json         # MCP configuration template
```

## Error Handling

Snow-Flow operations include:
- Automatic retry on network failures
- Token refresh on authentication errors
- Timeout protection (5 seconds default)
- Error logging with context

## Testing

Run tests:
```bash
npm test
```

Type checking:
```bash
npm run typecheck
```

## Build

Build from source:
```bash
npm run build
```

## Version

Current version: 3.4.4

## License

MIT