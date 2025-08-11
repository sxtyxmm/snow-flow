# 🏔️ Snow-Flow

[![NPM Version](https://img.shields.io/npm/v/snow-flow.svg)](https://www.npmjs.com/package/snow-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/snow-flow.svg)](https://nodejs.org)
[![ServiceNow Compatible](https://img.shields.io/badge/ServiceNow-Compatible-00A1E0.svg)](https://www.servicenow.com)

**Advanced ServiceNow Development Framework with AI-Powered Automation**

Snow-Flow revolutionizes ServiceNow development by combining the power of Claude AI, multi-agent orchestration, and the Model Context Protocol (MCP) to create a comprehensive development environment that actually understands ServiceNow.

## 🎯 What Makes Snow-Flow Different

### The Problem
ServiceNow development is complex. You're juggling:
- ES5 JavaScript restrictions (no modern JS features)
- Widget coherence between server/client/HTML
- Complex table relationships and dependencies
- Manual deployment processes
- Limited debugging capabilities
- Repetitive coding tasks

### The Solution
Snow-Flow provides an intelligent development framework that:
- **Understands ServiceNow's ES5 limitations** - Automatically converts modern JavaScript to ES5-compatible code
- **Validates widget coherence** - Ensures server script, client script, and HTML template work together perfectly
- **Executes scripts with full output capture** - See all gs.print, gs.info, gs.warn, and gs.error messages
- **Deploys directly to ServiceNow** - No manual copying and pasting
- **Coordinates multiple AI agents** - Research, code, test, and deploy in parallel
- **Uses 100% real data** - Never mock data, always your actual ServiceNow instance

## 🚀 Quick Start

### Installation
```bash
# Install globally via NPM
npm install -g snow-flow

# Initialize in your project
snow-flow init

# Authenticate with ServiceNow
snow-flow auth login
```

### Your First Snow-Flow Command
```bash
# Create a complete incident dashboard with one command
snow-flow swarm "Create an incident dashboard with real-time updates, SLA tracking, and automated assignment"

# Snow-Flow will:
# 1. Research best practices
# 2. Design the architecture
# 3. Create the widget with perfect coherence
# 4. Test everything
# 5. Deploy to your instance
# 6. Provide the widget URL
```

## 💡 Core Features

### 🤖 AI-Powered Development
Snow-Flow integrates Claude AI to understand your requirements and generate production-ready ServiceNow code:

```bash
# Natural language to ServiceNow artifacts
snow-flow sparc "Create a business rule that auto-assigns incidents based on category"

# The AI understands ServiceNow context and generates ES5-compatible code
```

### 📊 Real Script Execution with Output
Execute background scripts and actually see what happens:

```javascript
const result = await snow_execute_script_with_output({
  script: `
    gs.info('Analyzing incidents...');
    var stats = {};
    var gr = new GlideRecord('incident');
    gr.addActiveQuery();
    gr.query();
    stats.total = gr.getRowCount();
    gs.print('Found ' + stats.total + ' active incidents');
    
    // Get priority breakdown
    var agg = new GlideAggregate('incident');
    agg.addActiveQuery();
    agg.groupBy('priority');
    agg.addAggregate('COUNT');
    agg.query();
    
    stats.byPriority = {};
    while(agg.next()) {
      var p = agg.getValue('priority');
      stats.byPriority[p] = agg.getAggregate('COUNT');
      gs.info('Priority ' + p + ': ' + agg.getAggregate('COUNT'));
    }
    
    return stats;
  `
});

// Output:
// [INFO] Analyzing incidents...
// Found 42 active incidents
// [INFO] Priority 1: 5
// [INFO] Priority 2: 12
// [INFO] Priority 3: 25
// Return value: { total: 42, byPriority: { "1": 5, "2": 12, "3": 25 } }
```

### 🎯 Widget Deployment with Coherence Validation
Deploy widgets that actually work - Snow-Flow validates the communication between all components:

```javascript
await snow_deploy_widget({
  name: "Incident Monitor",
  template: `
    <div class="incident-list">
      <div ng-repeat="inc in data.incidents" ng-click="openIncident(inc.sys_id)">
        <h3>{{inc.number}}</h3>
        <p>{{inc.short_description}}</p>
        <span class="priority-{{inc.priority}}">P{{inc.priority}}</span>
      </div>
      <button ng-click="refreshData()" class="btn btn-primary">Refresh</button>
    </div>
  `,
  server_script: `
    (function() {
      // Server provides data that HTML uses
      data.incidents = [];
      
      var gr = new GlideRecord('incident');
      gr.addActiveQuery();
      gr.orderByDesc('sys_created_on');
      gr.setLimit(10);
      gr.query();
      
      while(gr.next()) {
        data.incidents.push({
          sys_id: gr.getUniqueValue(),
          number: gr.getValue('number'),
          short_description: gr.getValue('short_description'),
          priority: gr.getValue('priority')
        });
      }
      
      // Handle client actions
      if (input.action === 'refresh') {
        // Refresh logic here
        data.refreshed = true;
      }
    })();
  `,
  client_script: `
    function($scope, spUtil) {
      var c = this;
      
      // Implement methods that HTML calls
      $scope.openIncident = function(sysId) {
        window.open('/incident.do?sys_id=' + sysId, '_blank');
      };
      
      $scope.refreshData = function() {
        // Call server action
        c.server.get({action: 'refresh'}).then(function(response) {
          c.data.incidents = response.data.incidents;
          spUtil.addInfoMessage("Data refreshed!");
        });
      };
    }
  `
});

// Snow-Flow validates:
// ✅ data.incidents exists in server and is used in HTML
// ✅ openIncident() in HTML has implementation in client
// ✅ refreshData() in HTML has implementation in client
// ✅ action: 'refresh' in client has handler in server
```

### 🐝 Multi-Agent Swarm Coordination
Coordinate multiple specialized agents working in parallel:

```bash
# Development swarm with automatic coordination
snow-flow swarm "Build complete change management system" \
  --strategy development \
  --mode hierarchical \
  --max-agents 8 \
  --monitor

# Agents work simultaneously:
# - Researcher: Analyzes requirements and best practices
# - Architect: Designs system architecture
# - Coder Team: Develops components in parallel
# - Tester: Creates and runs tests
# - Deployer: Handles deployment
# - Documenter: Generates documentation
```

### 🧠 Machine Learning Integration
Built-in TensorFlow.js for intelligent automation:

```javascript
// Train incident classifier
const model = await snow_train_classifier({
  type: 'incident_category',
  training_data: {
    table: 'incident',
    fields: ['short_description', 'description'],
    label: 'category',
    limit: 1000
  },
  model_config: {
    type: 'lstm',
    epochs: 50,
    batch_size: 32
  }
});

// Use for predictions
const prediction = await snow_predict({
  model_id: model.id,
  input: {
    short_description: "Email not working",
    description: "Cannot connect to Exchange server"
  }
});
// Result: { category: "Email", confidence: 0.94 }
```

## 🔧 17 Specialized MCP Servers

Snow-Flow includes exactly 17 MCP servers, each providing specialized tools for different aspects of ServiceNow development:

### 1. 🚀 **Deployment Server** (40+ tools)
Deploy artifacts with automatic validation and rollback capabilities
- `snow_deploy_widget` - Widgets with coherence validation
- `snow_deploy_flow` - Flow Designer flows
- `snow_deploy_portal_page` - Service Portal pages
- `snow_create_update_set` - Update set management

### 2. ⚙️ **Operations Server** (30+ tools)
Core CRUD operations and data management
- `snow_query_table` - Advanced table queries
- `snow_discover_table_fields` - Schema discovery
- `snow_batch_api` - Batch operations (80% API reduction)
- `snow_cmdb_search` - CMDB exploration

### 3. 🤖 **Automation Server** (25+ tools)
Script execution and automation
- `snow_execute_script_with_output` - Full output capture
- `snow_get_logs` - System log access
- `snow_trace_execution` - Performance tracing
- `snow_test_rest_connection` - REST testing

### 4. 🧠 **Machine Learning Server** (20+ tools)
AI/ML capabilities with TensorFlow.js
- `snow_train_classifier` - Train custom models
- `snow_detect_anomalies` - Anomaly detection
- `snow_forecast_incidents` - Predictive analytics
- `snow_sentiment_analysis` - Text analysis

### 5. 💻 **Platform Development Server** (20+ tools)
Create platform artifacts
- `snow_create_script_include` - Script Includes
- `snow_create_business_rule` - Business Rules
- `snow_create_ui_policy` - UI Policies
- `snow_create_client_script` - Client Scripts

### 6. 🔗 **Integration Server** (15+ tools)
External integrations and data import
- `snow_create_rest_message` - REST integrations
- `snow_create_transform_map` - Data transformations
- `snow_test_web_service` - Service testing
- `snow_configure_oauth` - OAuth setup

### 7. ⚙️ **System Properties Server** (10+ tools)
Configuration management
- `snow_property_get/set` - Property CRUD
- `snow_property_bulk_update` - Bulk operations
- `snow_property_export/import` - Configuration backup

### 8. 📦 **Update Set Server** (10+ tools)
Change management
- `snow_create_update_set` - Create sets
- `snow_preview_update_set` - Preview changes
- `snow_export_update_set` - Export as XML

### 9. 🎯 **Development Assistant Server** (15+ tools)
Code generation and optimization
- `snow_generate_code` - AI code generation
- `snow_suggest_pattern` - Design patterns
- `snow_convert_to_es5` - ES5 conversion
- `snow_optimize_performance` - Performance tips

### 10. 🔒 **Security & Compliance Server** (15+ tools)
Security and compliance management
- `snow_scan_vulnerabilities` - Security scanning
- `snow_audit_compliance` - SOX/GDPR/HIPAA
- `snow_review_access_control` - ACL analysis

### 11. 📊 **Reporting & Analytics Server** (20+ tools)
Advanced reporting and visualization
- `snow_create_dashboard` - Dashboard builder
- `snow_define_kpi` - KPI management
- `snow_analyze_data_quality` - Data validation

### 12. 📚 **Knowledge & Catalog Server** (14+ tools)
Knowledge base and service catalog management
- `snow_create_knowledge_article` - Create articles
- `snow_search_knowledge` - Search knowledge base
- `snow_create_catalog_item` - Create catalog items
- `snow_create_catalog_variable` - Catalog variables
- `snow_order_catalog_item` - Order items

### 13. 🔄 **Change, Virtual Agent & PA Server** (19+ tools)
Change management, Virtual Agent, and Performance Analytics
- `snow_create_change_request` - Change requests
- `snow_schedule_cab_meeting` - CAB meetings
- `snow_create_va_topic` - Virtual Agent topics
- `snow_create_pa_indicator` - PA indicators
- `snow_get_pa_scores` - Performance scores

### 14. 📱 **Flow, Workspace & Mobile Server** (20+ tools)
Flow Designer, Workspace, and Mobile app management
- `snow_list_flows` - List and discover flows
- `snow_execute_flow` - Execute existing flows
- `snow_get_flow_execution_status` - Monitor flow execution
- `snow_get_flow_execution_history` - View execution history
- `snow_get_flow_details` - Get flow configuration details
- `snow_import_flow_from_xml` - Import flows from XML (only programmatic creation method)
- `snow_create_workspace` - Create workspaces
- `snow_configure_mobile_app` - Mobile config
- `snow_send_push_notification` - Push notifications

### 15. 🗄️ **CMDB, Event, HR, CSM & DevOps Server** (23+ tools)
Configuration, Events, HR, Customer Service, DevOps
- `snow_create_ci` - Create CIs
- `snow_run_discovery` - Run discovery
- `snow_create_event` - Create events
- `snow_employee_onboarding` - HR onboarding
- `snow_create_devops_pipeline` - DevOps pipelines

### 16. ⚡ **Advanced Features Server** (14+ tools)
Advanced optimization and analysis capabilities
- `snow_batch_api` - Batch operations (80% API reduction)
- `snow_get_table_relationships` - Table analysis
- `snow_discover_process` - Process mining
- `snow_analyze_workflow_execution` - Workflow analysis
- `snow_generate_documentation` - Auto-documentation

### 17. 👑 **Orchestration Server** (25+ tools)
Multi-agent coordination
- `snow_swarm_init` - Initialize swarms
- `snow_agent_spawn` - Create agents
- `snow_memory_store` - Persistent memory
- `snow_task_orchestrate` - Task management

## 📝 ES5 JavaScript - The ServiceNow Reality

ServiceNow uses the Rhino JavaScript engine which only supports ES5. Snow-Flow handles this automatically:

### ❌ What Doesn't Work in ServiceNow:
```javascript
// Modern JavaScript that WILL FAIL in ServiceNow:
const name = 'John';                    // const/let not supported
let items = [];                         // use var instead
const add = (a, b) => a + b;           // arrow functions fail
var msg = `Hello ${name}`;              // template literals fail
var {x, y} = point;                     // destructuring fails
for (let item of items) { }             // for...of fails
async function getData() { }            // async/await fails
items.map(x => x * 2);                  // array methods limited
class Widget { }                        // classes not supported
enum Status { ACTIVE, INACTIVE }        // enums not supported
```

### ✅ What Snow-Flow Converts To:
```javascript
// ES5-compatible code that WORKS:
var name = 'John';
var items = [];
function add(a, b) { return a + b; }
var msg = 'Hello ' + name;
var x = point.x, y = point.y;
for (var i = 0; i < items.length; i++) { }
function getData(callback) { }
var doubled = [];
for (var i = 0; i < items.length; i++) {
  doubled.push(items[i] * 2);
}
function Widget() { }
var Status = { ACTIVE: 'active', INACTIVE: 'inactive' };
```

## 🎮 Command Line Interface

### Core Commands
```bash
snow-flow init                          # Initialize project
snow-flow auth login                    # Authenticate with ServiceNow
snow-flow start                         # Start orchestration system
snow-flow status                        # Check system status
```

### Agent Management
```bash
snow-flow agent spawn researcher        # Create research agent
snow-flow agent spawn coder            # Create coding agent
snow-flow agent list                   # List active agents
```

### Task Execution
```bash
snow-flow task create "Build user management portal"
snow-flow task list                    # View task queue
snow-flow task status                  # Check task progress
```

### SPARC Development Modes
```bash
snow-flow sparc "Create incident workflow"      # Orchestrator mode
snow-flow sparc run coder "Generate REST API"   # Specific mode
snow-flow sparc tdd "User authentication"       # Test-driven development
snow-flow sparc modes                           # List all 17 modes
```

### Memory Management
```bash
snow-flow memory store "api_key" "sk-..."       # Store data
snow-flow memory get "api_key"                  # Retrieve data
snow-flow memory list                           # List all keys
snow-flow memory export backup.json             # Export memory
```

### Swarm Coordination
```bash
snow-flow swarm "Build complete ITSM solution" \
  --strategy development \
  --mode hierarchical \
  --max-agents 10 \
  --parallel \
  --monitor \
  --auto-deploy
```

## 🔌 Integration with ServiceNow

### OAuth Configuration
1. In ServiceNow, navigate to **System OAuth > Application Registry**
2. Click **New** > **Create an OAuth API endpoint for external clients**
3. Fill in:
   - Name: `Snow-Flow Integration`
   - Client ID: (auto-generated)
   - Client Secret: (set your secret)
   - Redirect URL: `http://localhost:3000/oauth/callback`
4. Save and copy the Client ID and Secret

### Environment Setup
Create a `.env` file:
```env
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-client-id
SNOW_CLIENT_SECRET=your-client-secret
SNOW_USERNAME=admin
SNOW_PASSWORD=your-password
```

### First Authentication
```bash
snow-flow auth login
# Opens browser for OAuth flow
# Tokens are stored securely and refreshed automatically
```

## 📚 Real-World Examples

### Example 1: Create a Complete Dashboard
```bash
snow-flow swarm "Create executive dashboard showing:
- Real-time incident metrics
- SLA performance
- Team workload distribution
- Trend analysis
- Automated report generation"

# Snow-Flow will create, test, and deploy everything
```

### Example 2: Automate Incident Management
```javascript
// Use Snow-Flow to create automation
await snow_create_business_rule({
  name: "Auto Assign Critical Incidents",
  table: "incident",
  when: "before",
  condition: "current.priority == 1",
  script: `
    (function executeRule(current, previous) {
      // Get on-call engineer
      var oncall = new GlideRecord('cmn_rota_member');
      oncall.addQuery('rota', 'critical_response_team');
      oncall.addQuery('active', true);
      oncall.query();
      
      if (oncall.next()) {
        current.assigned_to = oncall.getValue('user');
        gs.addInfoMessage('Critical incident assigned to on-call engineer');
      }
    })(current, previous);
  `
});
```

### Example 3: Build Custom Application
```bash
# Create complete application with single command
snow-flow sparc tdd "Employee onboarding application with:
- Request form with approval workflow
- Automated account provisioning
- Task assignments to IT, HR, Facilities
- Progress tracking dashboard
- Email notifications at each step"
```

## 🛠️ Advanced Features

### Batch API Operations
Reduce API calls by 80% with intelligent batching:
```javascript
const results = await snow_batch_api({
  operations: [
    { action: 'query', table: 'incident', query: 'active=true' },
    { action: 'query', table: 'problem', query: 'active=true' },
    { action: 'query', table: 'change_request', query: 'state=implement' }
  ],
  parallel: true
});
```

### Process Mining
Discover actual vs designed processes:
```javascript
const process = await snow_discover_process({
  table: 'incident',
  start_field: 'sys_created_on',
  end_field: 'resolved_at',
  state_field: 'state',
  analyze_variants: true
});
// Returns process flow, bottlenecks, and optimization opportunities
```

### Predictive Analytics
```javascript
const forecast = await snow_forecast_incidents({
  historical_days: 90,
  forecast_days: 30,
  factors: ['day_of_week', 'category', 'priority'],
  confidence_interval: 0.95
});
```

## 🏗️ Architecture

Snow-Flow is built with:
- **TypeScript** - Type-safe development
- **Node.js 18+** - Modern JavaScript runtime
- **MCP (Model Context Protocol)** - Standardized AI-tool communication
- **TensorFlow.js** - Machine learning capabilities
- **OAuth 2.0** - Secure authentication
- **WebSocket** - Real-time communication

### Directory Structure
```
snow-flow/
├── src/
│   ├── mcp/                 # 16+ MCP server implementations
│   │   ├── servicenow-*.ts  # Individual MCP servers
│   │   └── shared/           # Shared utilities
│   ├── agents/               # AI agent implementations
│   ├── queen/                # Orchestration system
│   ├── utils/                # Utilities and helpers
│   └── types/                # TypeScript definitions
├── website/                  # Documentation website
├── memory/                   # Persistent storage
└── dist/                     # Compiled output
```

## 🔍 Debugging & Troubleshooting

### Enable Debug Mode
```bash
export SNOW_FLOW_DEBUG=true
snow-flow start --verbose
```

### Common Issues

**Issue**: "ES6 syntax error in ServiceNow"
```bash
# Snow-Flow automatically converts to ES5, but you can test:
snow-flow validate-es5 myScript.js
```

**Issue**: "Widget not working"
```bash
# Validate widget coherence:
snow-flow validate-widget myWidget.js
```

**Issue**: "Authentication failed"
```bash
# Refresh OAuth token:
snow-flow auth refresh
```

## 📈 Performance

Snow-Flow optimizations:
- **80% API call reduction** through intelligent batching
- **5-second timeout protection** on all operations
- **Automatic retry** with exponential backoff
- **Connection pooling** for optimal performance
- **Parallel execution** where possible
- **Smart caching** of frequently accessed data

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
git clone https://github.com/groeimetai/snow-flow.git
cd snow-flow
npm install
npm run build
npm link  # Use local version globally
```

### Running Tests
```bash
npm test                 # Run all tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests
npm run typecheck       # TypeScript validation
```

## 📝 Documentation

- **Website**: [Coming Soon - snow-flow.dev]
- **API Docs**: See `/website/docs/api-full.html`
- **Examples**: Check `/examples` directory
- **CLAUDE.md**: Detailed configuration guide

## 🎯 Roadmap

### Coming Soon
- [ ] Visual Studio Code extension
- [ ] Web-based dashboard
- [ ] GitHub Actions integration
- [ ] Terraform provider for ServiceNow
- [ ] GraphQL API support
- [ ] Real-time collaboration features

### In Progress
- [x] Widget coherence validation
- [x] ES5 automatic conversion
- [x] Full output capture for scripts
- [x] Machine learning integration
- [ ] Visual workflow designer
- [ ] Performance profiler

## 💬 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/groeimetai/snow-flow/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/groeimetai/snow-flow/discussions)
- **Email**: snow-flow@example.com

## ⭐ Why Snow-Flow?

1. **It Actually Understands ServiceNow** - Not just another generic tool
2. **Real Data, Real Results** - No mock data, ever
3. **ES5 Compliance Built-In** - Never worry about syntax errors again
4. **Intelligent Automation** - AI that knows ServiceNow best practices
5. **Complete Toolchain** - Everything from development to deployment
6. **Active Development** - Regular updates and new features
7. **Open Source** - MIT licensed, free forever

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Special thanks to:
- The ServiceNow developer community
- Anthropic for Claude AI
- Contributors and early adopters
- Everyone who reported bugs and suggested features

---

**Built with ❤️ for ServiceNow developers by developers who understand the struggle.**

*Snow-Flow - Where ServiceNow development meets artificial intelligence.* 🏔️