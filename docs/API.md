# Snow-Flow API Documentation

## Overview

Snow-Flow provides a comprehensive command-line interface and programmatic API for multi-agent ServiceNow development. This document covers all available commands, options, and usage patterns.

## Command Line Interface

### Core Commands

#### `snow-flow swarm "<objective>"`

Execute multi-agent coordination for complex ServiceNow development tasks.

**Syntax:**
```bash
snow-flow swarm "<objective>" [options]
```

**Options:**
- `--strategy <type>` - Execution strategy (research, development, analysis, testing, optimization, maintenance)
- `--mode <type>` - Coordination mode (centralized, distributed, hierarchical, mesh, hybrid)
- `--max-agents <n>` - Maximum number of agents (default: 5)
- `--parallel` - Enable parallel execution
- `--monitor` - Real-time monitoring
- `--output <format>` - Output format (json, sqlite, csv, html)
- `--smart-discovery` - Smart artifact discovery and reuse (default: true)
- `--live-testing` - Enable live testing during development (default: true)
- `--auto-deploy` - Automatic deployment when ready (default: true)
- `--auto-rollback` - Automatic rollback on failures (default: true)
- `--shared-memory` - Enable shared memory between agents (default: true)
- `--progress-monitoring` - Real-time progress monitoring (default: true)
- `--auto-permissions` - Automatic permission escalation when needed (default: false)

**Examples:**
```bash
# Simple widget creation
snow-flow swarm "create incident dashboard widget"

# Complex development with options
snow-flow swarm "build employee onboarding portal" --strategy development --mode hierarchical --max-agents 8

# Analysis task with monitoring
snow-flow swarm "analyze table relationships" --strategy analysis --monitor --output json
```

#### `snow-flow auth <command>`

Manage ServiceNow authentication.

**Commands:**
- `login` - Authenticate with ServiceNow
- `logout` - Clear authentication
- `status` - Check authentication status

**Examples:**
```bash
snow-flow auth login
snow-flow auth status
```

#### `snow-flow memory <command>`

Manage persistent memory system.

**Commands:**
- `store <key> <data>` - Store data
- `get <key>` - Retrieve data
- `list` - List all keys
- `export <file>` - Export memory to file
- `import <file>` - Import memory from file
- `stats` - Memory usage statistics
- `cleanup` - Clean unused entries

**Examples:**
```bash
snow-flow memory store project_config '{"theme": "dark", "widgets": ["dashboard"]}'
snow-flow memory get project_config
snow-flow memory export backup.json
```

### Agent Management

#### `snow-flow agent <command>`

Manage AI agents in the system.

**Commands:**
- `spawn <type>` - Create new agent
- `list` - List active agents
- `status <id>` - Get agent status
- `stop <id>` - Stop specific agent

**Agent Types:**
- `coordinator` - Master coordination
- `researcher` - Information gathering
- `coder` - Code generation
- `analyst` - Data analysis
- `architect` - System design
- `tester` - Testing and validation
- `reviewer` - Code review
- `optimizer` - Performance optimization
- `documenter` - Documentation generation
- `monitor` - System monitoring

**Examples:**
```bash
snow-flow agent spawn researcher --name DataAnalyst
snow-flow agent list
snow-flow agent status agent-123
```

### SPARC Development Modes

#### `snow-flow sparc <mode> "<task>"`

Execute specific SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) development modes.

**Modes:**
- `orchestrator` - Master coordination (default)
- `coder` - Code generation
- `researcher` - Research and analysis
- `tdd` - Test-driven development
- `architect` - System architecture
- `reviewer` - Code review
- `debugger` - Debugging and troubleshooting
- `tester` - Testing and validation
- `analyzer` - Performance analysis
- `optimizer` - Code optimization
- `documenter` - Documentation generation
- `designer` - UI/UX design
- `innovator` - Creative solutions
- `swarm-coordinator` - Multi-agent coordination
- `memory-manager` - Memory optimization
- `batch-executor` - Batch operations
- `workflow-manager` - Workflow automation

**Examples:**
```bash
# Default orchestrator mode
snow-flow sparc "create user management system"

# Specific mode
snow-flow sparc run tdd "user authentication with JWT"
snow-flow sparc run architect "microservices design"
```

### System Management

#### `snow-flow config <command>`

Manage configuration settings.

**Commands:**
- `show` - Display current configuration
- `get <key>` - Get specific setting
- `set <key> <value>` - Set configuration value
- `init` - Initialize default configuration
- `validate` - Validate configuration

**Examples:**
```bash
snow-flow config show
snow-flow config set instance dev12345.service-now.com
snow-flow config validate
```

#### `snow-flow status`

Show comprehensive system status including agents, memory, and connections.

#### `snow-flow monitor`

Start real-time system monitoring dashboard.

### MCP Server Integration

#### `snow-flow mcp <command>`

Manage Model Context Protocol servers.

**Commands:**
- `start` - Start MCP servers
- `stop` - Stop MCP servers
- `status` - Check MCP server status
- `tools` - List available MCP tools

**Examples:**
```bash
snow-flow mcp start --port 3000
snow-flow mcp status
snow-flow mcp tools
```

## Programming API

### TypeScript/JavaScript API

#### Core Classes

##### `QueenAgent`

Master coordination agent that manages other agents.

```typescript
import { QueenAgent } from 'snow-flow';

const queen = new QueenAgent({
  memoryPath: './memory',
  maxConcurrentAgents: 10
});

// Analyze objective
const analysis = await queen.analyzeObjective('create widget');

// Spawn agents
const agents = await queen.spawnAgents('objective-id');

// Coordinate execution
const result = await queen.coordinateExecution('objective-id');
```

##### `MemorySystem`

Persistent memory management.

```typescript
import { MemorySystem } from 'snow-flow';

const memory = new MemorySystem('./memory.db');

// Store data
await memory.store('key', { data: 'value' });

// Retrieve data
const data = await memory.get('key');

// Search
const results = await memory.search('pattern');
```

##### `ServiceNowClient`

ServiceNow integration client.

```typescript
import { ServiceNowClient } from 'snow-flow';

const client = new ServiceNowClient({
  instance: 'dev12345.service-now.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
});

// Authenticate
await client.authenticate();

// Create widget
const widget = await client.createWidget({
  name: 'my-widget',
  template: '<div>Hello World</div>'
});
```

#### Agent Factory

Create and manage different types of agents.

```typescript
import { AgentFactory } from 'snow-flow';

const factory = new AgentFactory();

// Create widget creator agent
const widgetAgent = factory.createAgent('widget-creator', {
  specialization: 'dashboard-widgets'
});

// Create security agent
const securityAgent = factory.createAgent('security', {
  focus: 'access-control'
});

// Execute tasks
const result = await widgetAgent.execute({
  type: 'create-widget',
  requirements: 'incident dashboard'
});
```

### Configuration Options

#### Environment Variables

```bash
# ServiceNow Connection
SNOW_INSTANCE=dev12345.service-now.com
SNOW_CLIENT_ID=your-oauth-client-id
SNOW_CLIENT_SECRET=your-oauth-client-secret
SNOW_AUTH_TYPE=oauth

# System Configuration
SNOW_FLOW_ENV=development
SNOW_FLOW_LOG_LEVEL=info
SNOW_FLOW_MAX_CONCURRENT_OPS=10
SNOW_FLOW_SESSION_TIMEOUT=3600000

# Agent Configuration
SNOW_FLOW_MAX_WORKER_AGENTS=10
SNOW_FLOW_SPAWN_TIMEOUT=30000
SNOW_FLOW_TASK_TIMEOUT=300000

# Memory Configuration
SNOW_FLOW_DB_PATH=./memory.db
SNOW_FLOW_CACHE_ENABLED=true
SNOW_FLOW_DEFAULT_TTL=86400000

# Feature Flags
SNOW_FLOW_AUTO_PERMISSIONS=false
SNOW_FLOW_SMART_DISCOVERY=true
SNOW_FLOW_LIVE_TESTING=true
SNOW_FLOW_AUTO_DEPLOY=true
SNOW_FLOW_AUTO_ROLLBACK=true
```

#### Configuration File

**`.snow-flow.config.json`:**
```json
{
  "servicenow": {
    "instance": "dev12345.service-now.com",
    "authType": "oauth",
    "timeout": 60000
  },
  "agents": {
    "maxWorkers": 10,
    "spawnTimeout": 30000,
    "defaultCapabilities": ["servicenow", "memory"]
  },
  "memory": {
    "path": "./memory.db",
    "ttl": 86400000,
    "cacheEnabled": true
  },
  "features": {
    "smartDiscovery": true,
    "liveTesting": true,
    "autoDeployment": true,
    "autoRollback": true
  }
}
```

## MCP Tools Reference

### ServiceNow Integration Tools

#### `snow_find_artifact`

Find ServiceNow artifacts using natural language.

```javascript
const result = await mcpClient.call('snow_find_artifact', {
  query: 'the widget that shows incidents on homepage',
  type: 'widget'
});
```

#### `snow_deploy`

Deploy artifacts to ServiceNow.

```javascript
const result = await mcpClient.call('snow_deploy', {
  type: 'widget',
  config: {
    name: 'Incident Dashboard',
    template: '<div>...</div>',
    script: 'function() { ... }'
  },
  auto_update_set: true
});
```

#### `snow_update_set_create`

Create and manage Update Sets.

```javascript
const result = await mcpClient.call('snow_update_set_create', {
  name: 'Widget Development',
  description: 'Dashboard widgets and improvements'
});
```

### Memory Management Tools

#### `snow_memory_store`

Store data in persistent memory.

```javascript
await mcpClient.call('snow_memory_store', {
  action: 'store',
  key: 'project_config',
  value: JSON.stringify(config),
  ttl: 86400000
});
```

#### `snow_memory_search`

Search memory with patterns.

```javascript
const results = await mcpClient.call('snow_memory_search', {
  pattern: 'widget_*',
  limit: 10
});
```

### Agent Coordination Tools

#### `snow_agent_spawn`

Spawn new agents.

```javascript
const agent = await mcpClient.call('snow_agent_spawn', {
  type: 'widget-creator',
  capabilities: ['servicenow', 'ui-design']
});
```

#### `snow_task_orchestrate`

Orchestrate tasks across agents.

```javascript
const result = await mcpClient.call('snow_task_orchestrate', {
  task: 'create incident dashboard',
  strategy: 'parallel',
  maxAgents: 5
});
```

## Error Handling

### Common Error Codes

- `AUTH_001` - Authentication failed
- `PERM_001` - Insufficient permissions
- `CONN_001` - Connection timeout
- `AGENT_001` - Agent spawn failed
- `MEM_001` - Memory operation failed
- `SNOW_001` - ServiceNow API error

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Authentication failed",
    "details": "Invalid OAuth credentials",
    "suggestions": [
      "Check your client ID and secret",
      "Run: snow-flow auth login"
    ]
  }
}
```

### Error Recovery

```typescript
try {
  const result = await queen.analyzeObjective(objective);
} catch (error) {
  if (error.code === 'AUTH_001') {
    // Re-authenticate
    await client.authenticate();
    // Retry operation
    const result = await queen.analyzeObjective(objective);
  } else if (error.code === 'PERM_001') {
    // Request permission escalation
    await escalatePermissions();
  }
}
```

## Best Practices

### Performance Optimization

1. **Use Parallel Execution**
   ```bash
   snow-flow swarm "create multiple widgets" --parallel --max-agents 8
   ```

2. **Enable Smart Discovery**
   ```bash
   snow-flow swarm "build dashboard" --smart-discovery
   ```

3. **Memory Management**
   ```bash
   # Regular cleanup
   snow-flow memory cleanup
   
   # Monitor usage
   snow-flow memory stats
   ```

### Security Guidelines

1. **Environment Variables**
   - Store credentials in `.env` files
   - Never commit credentials to version control

2. **Permission Management**
   - Use least privilege principle
   - Enable auto-permissions only when necessary

3. **Update Set Tracking**
   - Always use Update Sets for deployments
   - Track all changes for rollback capability

### Development Workflow

1. **Project Initialization**
   ```bash
   snow-flow config init
   snow-flow auth login
   ```

2. **Development**
   ```bash
   # Start with analysis
   snow-flow sparc run researcher "understand requirements"
   
   # Design architecture
   snow-flow sparc run architect "system design"
   
   # Implement with testing
   snow-flow sparc run tdd "feature implementation"
   ```

3. **Deployment**
   ```bash
   # Test deployment
   snow-flow swarm "deploy to test" --no-auto-deploy
   
   # Production deployment
   snow-flow swarm "deploy to production" --monitor
   ```

## Troubleshooting

### Common Issues

1. **Authentication Problems**
   ```bash
   snow-flow auth status
   snow-flow auth login --verbose
   ```

2. **Agent Communication Issues**
   ```bash
   snow-flow agent list
   snow-flow monitor
   ```

3. **Memory Issues**
   ```bash
   snow-flow memory stats
   snow-flow memory cleanup
   ```

4. **ServiceNow Connection**
   ```bash
   snow-flow config validate
   # Check network connectivity
   # Verify ServiceNow instance accessibility
   ```

### Debug Mode

Enable detailed logging:

```bash
export SNOW_FLOW_LOG_LEVEL=debug
snow-flow swarm "your task" --monitor
```

### Support Resources

- GitHub Issues: https://github.com/groeimetai/snow-flow/issues
- Documentation: https://github.com/groeimetai/snow-flow/docs
- Examples: https://github.com/groeimetai/snow-flow/examples

---

This API documentation is continuously updated. For the latest information, visit the project repository.