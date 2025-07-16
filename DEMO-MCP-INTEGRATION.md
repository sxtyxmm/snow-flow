# 🚀 ServiceNow Multi-Agent MCP Integration Demo

## What We Have Built

The ServiceNow Multi-Agent Framework (`snow-flow`) now includes complete MCP (Model Context Protocol) integration that allows Claude Code to directly access ServiceNow APIs. This creates a seamless development experience where Claude Code can build applications live in ServiceNow.

## Key Features Implemented

### 1. OAuth Authentication System
- **Location**: `src/utils/snow-oauth.ts`
- **Functionality**: Browser-based OAuth 2.0 flow with ServiceNow
- **Command**: `snow-flow auth login`
- **Features**:
  - Automatic browser launch for authentication
  - Token storage and refresh
  - Session management
  - Instance detection

### 2. ServiceNow API Client
- **Location**: `src/utils/servicenow-client.ts`
- **Functionality**: Complete ServiceNow REST API wrapper
- **Capabilities**:
  - Widget creation and management
  - Workflow design
  - Script execution
  - Instance information
  - Connection testing

### 3. MCP Server Implementation
- **Location**: `src/mcp/servicenow-mcp-server.ts`
- **Functionality**: Provides Claude Code with native ServiceNow tools
- **Available Tools**:
  - `snow_auth_status`: Check authentication status
  - `snow_create_widget`: Create ServiceNow widgets
  - `snow_update_widget`: Update existing widgets
  - `snow_get_widget`: Retrieve widget details
  - `snow_list_widgets`: List all widgets
  - `snow_create_workflow`: Create workflows
  - `snow_execute_script`: Execute server-side scripts
  - `snow_test_connection`: Test ServiceNow connection
  - `snow_get_instance_info`: Get instance information

### 4. Multi-Agent Orchestration
- **Location**: `src/cli-minimal.ts`
- **Functionality**: Real Claude Code orchestration with ServiceNow integration
- **Features**:
  - Automatic task type detection
  - Authentication-aware prompts
  - Real-time monitoring
  - Batch tool coordination

## How It Works

### Step 1: Project Initialization
```bash
# Initialize new project with MCP configuration
snow-flow init --sparc

# This creates:
# - .env file with OAuth variables
# - .claude/mcp-config.json with ServiceNow MCP server
# - Complete project structure
```

### Step 2: Authentication Setup
```bash
# Configure OAuth credentials in .env file
SNOW_INSTANCE=yourinstance.service-now.com
SNOW_CLIENT_ID=your-client-id
SNOW_CLIENT_SECRET=your-client-secret

# Authenticate with ServiceNow
snow-flow auth login
```

### Step 3: Start MCP Server
```bash
# Start ServiceNow MCP server for Claude Code integration
snow-flow mcp

# This provides Claude Code with direct ServiceNow API access
```

### Step 4: Multi-Agent Development
```bash
# Create a ServiceNow widget with multi-agent orchestration
snow-flow swarm "Create a task management widget with real-time updates"

# This will:
# 1. Launch Claude Code with specialized prompts
# 2. Provide TodoWrite for task tracking
# 3. Enable direct ServiceNow API access via MCP tools
# 4. Create the widget live in your ServiceNow instance
```

## Technical Architecture

### MCP Integration Flow
1. **snow-flow** starts the MCP server (`servicenow-mcp-server`)
2. **Claude Code** connects to the MCP server via stdio transport
3. **MCP server** provides ServiceNow tools to Claude Code
4. **Claude Code** uses tools to interact with ServiceNow APIs
5. **ServiceNow** receives API calls and returns responses
6. **Results** are displayed in Claude Code interface

### Authentication Flow
1. User runs `snow-flow auth login`
2. Browser opens to ServiceNow OAuth endpoint
3. User authenticates with ServiceNow
4. OAuth tokens are stored locally
5. MCP server uses tokens for API authentication
6. Claude Code can now create/modify ServiceNow resources

## Live Development Examples

### Example 1: Create a Widget
```bash
snow-flow swarm "Create a incident tracker widget for Service Portal"
```

**What happens:**
- Claude Code receives specialized ServiceNow widget creation prompt
- Uses `snow_create_widget` MCP tool
- Widget is created live in ServiceNow instance
- Returns widget URL for immediate testing

### Example 2: Build a Workflow
```bash
snow-flow swarm "Design approval workflow for change requests"
```

**What happens:**
- Claude Code gets workflow-specific orchestration prompt
- Uses `snow_create_workflow` MCP tool
- Workflow is created in ServiceNow Flow Designer
- Returns workflow ID and activation status

### Example 3: Generate Scripts
```bash
snow-flow swarm "Create business rules for automated task assignment"
```

**What happens:**
- Claude Code receives script generation prompt
- Uses `snow_execute_script` MCP tool
- Scripts are executed in ServiceNow instance
- Returns execution results and created records

## Benefits of This Integration

### For Developers
- **Live Development**: Create ServiceNow resources directly from Claude Code
- **Authentication Handled**: No manual API key management
- **Rich Context**: Claude Code understands ServiceNow platform conventions
- **Multi-Agent Coordination**: Specialized agents for different ServiceNow components

### For Organizations
- **Faster Development**: Immediate feedback from live ServiceNow instance
- **Standardized Approach**: Consistent development patterns
- **Quality Assurance**: Built-in testing and validation
- **Documentation**: Auto-generated documentation and examples

## Current Status

### ✅ Completed Features
- OAuth 2.0 authentication flow
- ServiceNow API client
- MCP server implementation
- Multi-agent orchestration
- Real-time monitoring
- Automatic project initialization
- .env file generation
- MCP configuration setup

### 🔄 Testing Results
- MCP server starts successfully
- Authentication flow works
- API client connects to ServiceNow
- Claude Code can use MCP tools
- Multi-agent swarm executes properly

### 🚀 Ready for Use
The ServiceNow Multi-Agent Framework is now ready for live development with Claude Code integration. Users can:

1. Initialize new projects with `snow-flow init --sparc`
2. Authenticate with ServiceNow using `snow-flow auth login`
3. Start MCP server with `snow-flow mcp`
4. Develop live ServiceNow applications with `snow-flow swarm`

This creates a seamless development experience where Claude Code becomes a powerful ServiceNow development environment with multi-agent capabilities.

---

**Next Steps**: Use the framework to build real ServiceNow applications and gather feedback for improvements.