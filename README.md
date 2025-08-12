# Snow-Flow

ServiceNow development framework with AI-powered automation through 17 MCP servers and 200+ specialized tools.

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Claude Code Setup](#claude-code-setup)
- [MCP Servers](#mcp-servers)
- [Usage](#usage)
- [Commands](#commands)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Installation

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher
- ServiceNow instance with admin access
- Claude Code desktop application

### Install from NPM

```bash
# Install globally
npm install -g snow-flow

# Verify installation
snow-flow --version
```

### Install from Source

```bash
# Clone repository
git clone https://github.com/groeimetai/snow-flow.git
cd snow-flow

# Install dependencies
npm install

# Build project
npm run build

# Link globally (optional)
npm link
```

## Configuration

### Step 1: Initialize Snow-Flow

```bash
# Create project directory
mkdir my-servicenow-project
cd my-servicenow-project

# Initialize Snow-Flow
snow-flow init
```

This creates:
- `.env` file for ServiceNow credentials
- `.snow-flow/` configuration directory
- `.claude/` MCP server configurations
- `CLAUDE.md` with comprehensive documentation

### Step 2: Configure ServiceNow Credentials

Edit the `.env` file with your ServiceNow instance details:

```env
# ServiceNow Instance Configuration
SNOW_INSTANCE=your-instance.service-now.com
SNOW_USERNAME=admin.username
SNOW_PASSWORD=admin.password

# OAuth Configuration (recommended for production)
SNOW_CLIENT_ID=your-oauth-client-id
SNOW_CLIENT_SECRET=your-oauth-client-secret

# Optional: Claude API Key
ANTHROPIC_API_KEY=your-claude-api-key
```

### Step 3: Set Up OAuth in ServiceNow

1. Navigate to **System OAuth > Application Registry**
2. Click **New** > **Create an OAuth API endpoint for external clients**
3. Configure:
   - Name: `Snow-Flow OAuth`
   - Client ID: (auto-generated, copy to .env)
   - Client Secret: (generate new, copy to .env)
   - Redirect URL: `http://localhost:3000/callback`
   - Refresh Token Lifespan: `86400` (24 hours)
4. Save and activate

### Step 4: Authenticate

```bash
# Login to ServiceNow
snow-flow auth login

# Verify connection
snow-flow auth status
```

## Claude Code Setup

### Fix Permission Errors

**IMPORTANT:** If you encounter "dangerously skip permissions" errors in Claude Code, you must first authenticate with Claude:

```bash
# 1. First, login to Claude (required for MCP servers to work)
claude login

# 2. Then start Claude Code with MCP servers
claude --mcp-config .claude/claude_desktop_config.json
```

The `claude login` step is crucial - without it, MCP servers cannot authenticate with ServiceNow.

### Automatic MCP Server Activation

During `snow-flow init`, you'll be prompted to automatically activate all MCP servers:

```bash
🚀 Would you like to start Claude Code with MCP servers? (Y/n)
```

Selecting **Y** will:
- Configure all 17 MCP servers
- Auto-approve server permissions
- Launch Claude Code with servers ready

### Manual MCP Server Activation

If you need to manually activate MCP servers:

```bash
# Mac/Linux
claude --mcp-config .claude/claude_desktop_config.json

# Windows
claude.exe --mcp-config .claude/claude_desktop_config.json
```

## MCP Servers

Snow-Flow includes 17 specialized MCP servers with 200+ tools:

### 1. Deployment Server (10 tools)
Widget and artifact deployment with coherence validation
- `snow_deploy` - Create new artifacts
- `snow_update` - Update existing artifacts
- `snow_delete` - Delete artifacts
- `snow_validate_deployment` - Validate before deployment
- `snow_rollback_deployment` - Rollback failed deployments
- `snow_preview_widget` - Preview widgets
- `snow_widget_test` - Test widget functionality
- `snow_batch_deploy` - Deploy multiple artifacts

### 2. Operations Server (12 tools)
Core ServiceNow operations and queries
- `snow_query_table` - Query any table with pagination
- `snow_query_incidents` - Query and analyze incidents
- `snow_cmdb_search` - Search CMDB
- `snow_user_lookup` - Find users
- `snow_operational_metrics` - Get metrics
- `snow_knowledge_search` - Search knowledge base
- `snow_create_incident` - Create incidents
- `snow_update_incident` - Update incidents

### 3. Automation Server (27 tools)
Script execution and automation
- `snow_execute_background_script` - Execute background scripts (ES5 only)
- `snow_execute_script_with_output` - Execute with output capture
- `snow_execute_script_sync` - Synchronous execution
- `snow_confirm_script_execution` - Confirm execution
- `snow_create_scheduled_job` - Create scheduled jobs
- `snow_create_atf_test` - Create automated tests
- `snow_execute_atf_test` - Run tests
- `snow_property_manager` - Manage properties

### 4. Platform Development Server (9 tools)
Create platform artifacts
- `snow_create_script_include` - Create Script Includes
- `snow_create_business_rule` - Create Business Rules
- `snow_create_client_script` - Create Client Scripts
- `snow_create_ui_policy` - Create UI Policies
- `snow_create_ui_action` - Create UI Actions
- `snow_create_ui_page` - Create UI Pages

### 5. Integration Server (10 tools)
REST/SOAP and data management
- `snow_create_rest_message` - Create REST integrations
- `snow_create_transform_map` - Create transform maps
- `snow_create_import_set` - Manage import sets
- `snow_test_web_service` - Test web services
- `snow_configure_email` - Configure email

### 6. System Properties Server (12 tools)
System property management
- `snow_property_get` - Get property values
- `snow_property_set` - Set property values
- `snow_property_list` - List properties
- `snow_property_delete` - Delete properties
- `snow_property_bulk_update` - Bulk updates
- `snow_property_export` - Export to JSON
- `snow_property_import` - Import from JSON

### 7. Update Set Server (6 tools)
Change management and deployment
- `snow_update_set_create` - Create update sets
- `snow_update_set_switch` - Switch active update set
- `snow_update_set_current` - Get current update set
- `snow_update_set_complete` - Complete update set
- `snow_update_set_export` - Export as XML
- `snow_ensure_active_update_set` - Ensure active set

### 8. Development Assistant Server (6 tools)
Intelligent artifact management
- `snow_find_artifact` - Find any artifact
- `snow_edit_artifact` - Edit existing artifacts
- `snow_get_by_sysid` - Get by sys_id
- `snow_analyze_artifact` - Analyze dependencies
- `snow_comprehensive_search` - Deep search
- `snow_analyze_requirements` - Analyze requirements

### 9. Security & Compliance Server (5 tools)
Security and compliance management
- `snow_create_security_policy` - Create policies
- `snow_audit_compliance` - Audit compliance
- `snow_scan_vulnerabilities` - Scan vulnerabilities
- `snow_assess_risk` - Risk assessment
- `snow_review_access_control` - Review ACLs

### 10. Reporting & Analytics Server (5 tools)
Reporting and visualization
- `snow_create_report` - Create reports
- `snow_create_dashboard` - Create dashboards
- `snow_define_kpi` - Define KPIs
- `snow_schedule_report` - Schedule reports
- `snow_analyze_data_quality` - Data quality

### 11. Machine Learning Server (6 tools)
AI/ML capabilities with TensorFlow.js
- `ml_train_incident_classifier` - Train classifiers
- `ml_predict_change_risk` - Predict risks
- `ml_detect_anomalies` - Detect anomalies
- `ml_forecast_incidents` - Forecast incidents
- `ml_performance_analytics` - Performance ML
- `ml_hybrid_recommendation` - Recommendations

### 12. Orchestration Server (6 tools)
Multi-agent coordination
- `swarm_init` - Initialize swarms
- `agent_spawn` - Create agents
- `task_orchestrate` - Orchestrate tasks
- `memory_search` - Search memory
- `neural_train` - Train neural networks
- `performance_report` - Performance reports

### 13. Knowledge & Catalog Server (7 tools)
Knowledge and service catalog
- `snow_create_knowledge_article` - Create articles
- `snow_search_knowledge` - Search knowledge
- `snow_create_catalog_item` - Create catalog items
- `snow_create_catalog_variable` - Create variables
- `snow_order_catalog_item` - Order items
- `snow_discover_catalogs` - Discover catalogs

### 14. Change & Virtual Agent Server (7 tools)
Change management and Virtual Agent
- `snow_create_change_request` - Create changes
- `snow_schedule_cab_meeting` - Schedule CAB
- `snow_create_va_topic` - Create VA topics
- `snow_send_va_message` - Send VA messages
- `snow_create_pa_indicator` - Create PA indicators
- `snow_get_pa_scores` - Get PA scores

### 15. Flow & Workspace Server (10 tools)
Flow Designer and Workspace
- `snow_list_flows` - List flows
- `snow_execute_flow` - Execute flows
- `snow_get_flow_details` - Get flow details
- `snow_get_flow_execution_status` - Execution status
- `snow_get_flow_execution_history` - Execution history
- `snow_import_flow_from_xml` - Import flows
- `snow_create_workspace` - Create workspaces
- `snow_configure_mobile_app` - Configure mobile
- `snow_send_push_notification` - Push notifications

### 16. CMDB & Event Server (8 tools)
CMDB and event management
- `snow_create_ci` - Create Configuration Items
- `snow_create_ci_relationship` - Create relationships
- `snow_run_discovery` - Run discovery
- `snow_create_event` - Create events
- `snow_create_hr_case` - Create HR cases
- `snow_employee_onboarding` - Onboarding
- `snow_create_customer_case` - Customer cases
- `snow_create_devops_pipeline` - DevOps pipelines

### 17. Advanced Features Server (7 tools)
Batch operations and optimization
- `snow_batch_api` - Batch API (80% reduction)
- `snow_get_table_relationships` - Table relationships
- `snow_analyze_query` - Query optimization
- `snow_detect_code_patterns` - Pattern detection
- `snow_discover_process` - Process discovery
- `snow_analyze_workflow_execution` - Workflow analysis
- `snow_generate_documentation` - Auto-documentation

## Usage

### Basic Widget Deployment

```javascript
// In Claude Code with MCP tools
await snow_deploy({
  type: 'widget',
  config: {
    name: 'incident_dashboard',
    title: 'Incident Dashboard',
    template: '<div>{{data.message}}</div>',
    script: 'data.message = "Hello World";',
    client_script: 'function($scope) { var c = this; }'
  }
});
```

### Execute Background Script (ES5 Only)

```javascript
// IMPORTANT: ServiceNow uses Rhino engine - ES5 only!
await snow_execute_script_with_output({
  script: `
    var gr = new GlideRecord('incident');
    gr.addQuery('active', true);
    gr.query();
    gs.info('Active incidents: ' + gr.getRowCount());
  `
});
```

### Query ServiceNow Tables

```javascript
await snow_query_table({
  table: 'incident',
  query: 'active=true^priority=1',
  fields: ['number', 'short_description', 'assigned_to'],
  limit: 10
});
```

## Commands

### Core Commands
```bash
snow-flow swarm "<objective>"  # Execute multi-agent swarm
snow-flow auth login          # Authenticate with ServiceNow
snow-flow init               # Initialize project
```

### Agent Management
```bash
snow-flow agent spawn <type>  # Create agents
snow-flow agent list          # List active agents
```

### Task Management
```bash
snow-flow task create         # Create tasks
snow-flow task list          # View task queue
```

### Memory Operations
```bash
snow-flow memory store <key> <data>  # Store data
snow-flow memory get <key>           # Retrieve data
snow-flow memory list                # List all keys
```

### SPARC Development Modes
```bash
snow-flow sparc "<task>"                    # Orchestrator mode
snow-flow sparc run <mode> "<task>"        # Specific mode
snow-flow sparc tdd "<feature>"            # Test-driven development
```

Available modes: orchestrator, coder, researcher, tdd, architect, reviewer, debugger, tester, analyzer, optimizer, documenter, designer, innovator, swarm-coordinator, memory-manager, batch-executor, workflow-manager

### Swarm Coordination
```bash
snow-flow swarm "<objective>" [options]
```

Options:
- `--strategy` (research, development, analysis, testing, optimization, maintenance)
- `--mode` (centralized, distributed, hierarchical, mesh, hybrid)
- `--max-agents <n>` (default: 5)
- `--parallel` Enable parallel execution
- `--monitor` Real-time monitoring
- `--output <format>` (json, sqlite, csv, html)

## Troubleshooting

### Common Issues

#### 1. MCP Server Not Responding
```bash
# Check MCP server status
snow-flow mcp status

# Restart MCP servers
snow-flow mcp restart

# Debug mode
snow-flow mcp debug
```

#### 2. Authentication Failed
```bash
# Clear cached credentials
snow-flow auth logout

# Re-authenticate
snow-flow auth login

# Verify OAuth configuration
snow-flow auth test
```

#### 3. Permission Errors in Claude Code
Always run `claude login` before starting Claude Code with MCP servers.

#### 4. ES5 Syntax Errors
ServiceNow uses Rhino engine. Always use ES5 syntax:
- Use `var` instead of `const/let`
- Use `function()` instead of arrow functions
- Use string concatenation instead of template literals
- Use traditional for loops instead of `for...of`

### Debug Commands
```bash
# Enable verbose logging
export DEBUG=snow-flow:*

# Check version and help
snow-flow --version
snow-flow --help

# Test authentication
snow-flow auth login
snow-flow auth status

# Re-initialize if needed
snow-flow init
```

## Project Structure

```
snow-flow/
├── src/
│   ├── mcp/                # 17 MCP server implementations
│   ├── queen/              # Queen agent orchestration
│   ├── utils/              # Utilities and helpers
│   └── types/              # TypeScript definitions
├── .snow-flow/             # Configuration directory
├── .claude/                # MCP server configs
├── website/                # Documentation website
└── package.json           # NPM package configuration
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npm run typecheck

# Build project
npm run build

# Development mode
npm run dev
```

## Support

- GitHub Issues: https://github.com/groeimetai/snow-flow/issues
- Documentation: https://snow-flow.ai
- ServiceNow Community: https://community.servicenow.com

## License

MIT License - see LICENSE file for details.

## Version

Current version: 3.4.38

---

Snow-Flow - ServiceNow Development Automation with AI