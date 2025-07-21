# Snow-Flow: The claude-flow ServiceNow Revolution 🚀

**Snow-Flow** transforms ServiceNow development through the revolutionary **Queen Agent** and **claude-flow philosophy**. Experience **hive-mind intelligence** where one elegant command replaces complex multi-agent orchestration.

**The claude-flow Philosophy:**
- 🧠 **Hive-Mind Intelligence**: All agents share knowledge and learn collectively
- 🎯 **Intent-Driven Development**: Describe what you want, not how to build it  
- 📊 **Memory-Driven Patterns**: Learn from every execution, improve over time
- 👑 **Elegant Simplicity**: One command replaces complex coordination

Powered by 11 specialized MCP (Model Context Protocol) servers and inspired by Claude's natural language understanding, Snow-Flow makes ServiceNow development as simple as having a conversation.

## 🆕 What's New in v1.1.50

### 🎯 CRITICAL FIXES - All User Issues Resolved!
- **ROOT CAUSE SOLVED**: Flow Designer validation failures completely eliminated
- **JSON SCHEMA FLEXIBILITY**: Accepts both "steps" and "activities" arrays with auto-conversion
- **DOCUMENTATION SYNC**: Init command now creates comprehensive CLAUDE.md (373 lines vs 15)
- **COMPLETE GUIDE**: New users get full Snow-Flow development environment from day one

### 🧠 Intelligent Error Recovery (v1.1.48-1.1.49)
- **AUTOMATIC FALLBACKS**: Flow Designer → Business Rule conversion when deployment fails
- **SMART SESSIONS**: Update Sets auto-create when none exist - no more "no active session" errors
- **ZERO MANUAL WORK**: All systematic errors from user feedback now automatically handled
- **COMPREHENSIVE TESTING**: Enhanced flow testing with Business Rule fallback detection

### 🚀 Enhanced Swarm Command (v1.1.42+)
Most intelligent features are now **enabled by default** - één command voor alles!
- **DEFAULT TRUE**: `--smart-discovery`, `--live-testing`, `--auto-deploy`, `--auto-rollback`, `--shared-memory`, `--progress-monitoring`
- **INTELLIGENT ORCHESTRATION**: Uses `snow_orchestrate_development` MCP tool automatically
- **NO FLAGS NEEDED**: Just run `snow-flow swarm "create widget"` and everything works!

### 🔍 Real-Time ServiceNow Integration (v1.1.41+)
- **LIVE VALIDATION**: `snow_validate_live_connection` - real-time auth and permission checking
- **SMART PREVENTION**: `snow_discover_existing_flows` - prevents duplicate flows
- **LIVE TESTING**: `snow_test_flow_execution` - real flow testing in live instances
- **BATCH VALIDATION**: `batch_deployment_validator` - comprehensive multi-artifact validation
- **AUTO ROLLBACK**: `deployment_rollback_manager` - automatic rollback with backup creation

## 🌟 Key Features

### 👑 Revolutionary Queen Agent

- **🧠 Hive-Mind Intelligence**: All agents share knowledge and learn collectively from every execution
- **🎯 Intent-Driven Development**: Natural language understanding converts objectives into perfect solutions  
- **📊 Memory-Driven Patterns**: Learns successful patterns and automatically applies them to new projects
- **🚀 One-Command Orchestration**: Replaces complex multi-step workflows with single elegant commands
- **🔄 Graceful Fallbacks**: Automatically falls back to traditional methods when needed
- **💾 Persistent Learning**: Export/import patterns for team sharing and backup

### 🤖 11 Specialized MCP Servers (Orchestrated by Queen)
Each server provides autonomous capabilities for different aspects of ServiceNow development:

1. **Deployment MCP** - Autonomous widget, flow, and application deployment
2. **Flow Composer MCP** - Natural language flow creation with intelligent analysis
3. **Update Set MCP** - Professional change tracking and deployment management
4. **Intelligent MCP** - AI-powered artifact discovery and editing
5. **Graph Memory MCP** - Relationship tracking and impact analysis
6. **Platform Development MCP** - Development workflow automation
7. **Integration MCP** - Third-party system integration
8. **Operations MCP** - Operations and monitoring management
9. **Automation MCP** - Workflow and process automation
10. **Security & Compliance MCP** - Security auditing and compliance
11. **Reporting & Analytics MCP** - Data analysis and reporting

### 🎯 Core Capabilities (Enhanced by Queen Intelligence)

- **Natural Language Processing**: Create complex ServiceNow artifacts using plain English/Dutch commands
- **Hive-Mind Decision Making**: Collectively learns optimal architectures and applies them automatically
- **Zero Configuration**: All values dynamically discovered from your ServiceNow instance
- **Autonomous Deployment**: Direct deployment to ServiceNow with automatic error handling and learning
- **Update Set Management**: Professional change tracking like ServiceNow pros use
- **Global Scope Strategy**: Intelligent scope selection with fallback mechanisms
- **Memory-Driven Coordination**: Parallel execution optimized by learned patterns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- ServiceNow instance with admin access
- OAuth application configured in ServiceNow

### Installation & Queen Agent Setup

```bash
# Install Snow-Flow globally
npm install -g snow-flow

# Initialize Snow-Flow with claude-flow intelligence
snow-flow init --sparc

# Configure ServiceNow credentials (see Configuration section below)
# Then authenticate
snow-flow auth login

# 🎉 Start developing with the Queen Agent!
snow-flow queen "create incident dashboard with real-time charts"
```

#### Alternative: Install from source
```bash
# Clone the repository
git clone https://github.com/groeimetai/snow-flow.git
cd snow-flow

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

### Configuration

1. Create a `.env` file in the project root:
```env
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-oauth-client-id
SNOW_CLIENT_SECRET=your-oauth-client-secret
SNOW_USERNAME=your-username
SNOW_PASSWORD=your-password
```

2. Set up OAuth in ServiceNow (see [SERVICENOW-OAUTH-SETUP.md](./SERVICENOW-OAUTH-SETUP.md))

3. Authenticate with ServiceNow:
```bash
snow-flow auth login
```

4. **Start developing with Queen Agent:**
```bash
# Your first Queen command - creates everything you need!
snow-flow queen "create incident management dashboard"

# Check what the Queen learned
snow-flow queen-status --detailed

# Get AI insights for your next project
snow-flow queen-insights
```

### 🎯 MCP Server Activation (v1.1.25+)

Snow-Flow now includes **automatic MCP server activation** for Claude Code! During initialization, you'll be prompted to automatically start Claude Code with all 11 MCP servers pre-loaded:

```bash
snow-flow init --sparc

# You'll see:
# 🚀 Would you like to start Claude Code with MCP servers automatically? (Y/n)
# Press Y to launch Claude Code with all MCP servers ready to use!
```

The MCP servers are automatically:
- ✅ Configured with correct paths for global npm installations
- ✅ Registered in Claude Code's settings
- ✅ Activated without manual approval steps
- ✅ Ready to use immediately after initialization

If you need to manually activate MCP servers later:
```bash
# For Mac/Linux:
claude --mcp-config .mcp.json .

# For Windows:
claude.exe --mcp-config .mcp.json .
```

## 💡 Usage Examples

### 👑 Primary Interface: Queen Agent (RECOMMENDED)

**The Transformation:**
```bash
# Before: Complex multi-agent coordination
snow-flow swarm "Build incident system" --strategy development --mode hierarchical --max-agents 8 --parallel --monitor --shared-memory --validation --auto-deploy

# After: Elegant Queen Agent - ONE COMMAND DOES EVERYTHING!
snow-flow queen "Build a complete incident management system"
```

**Examples:**
```bash
# Create complex flows with natural language
snow-flow queen "Create an approval workflow for iPhone orders with manager notifications"

# Deploy widgets directly to ServiceNow  
snow-flow queen "Create and deploy a widget showing critical incidents with real-time updates"

# Build complete ITSM solutions
snow-flow queen "Build complete incident management with dashboard, workflows, and notifications"

# Intelligent artifact discovery and modification
snow-flow queen "Find and modify the approval workflow to add extra approval step for orders over $1000"

# Multi-language support
snow-flow queen "Maak een flow voor automatisch toewijzen van incidenten aan groepen"
```

### 🧠 Queen Memory Management
```bash
# Export learned patterns for backup
snow-flow queen-memory export my-patterns.json

# Import previous learning patterns  
snow-flow queen-memory import my-patterns.json

# View hive-mind intelligence status
snow-flow queen-status --detailed

# Get AI-driven insights and recommendations
snow-flow queen-insights

# Reset learning (requires confirmation)
snow-flow queen-memory clear --confirm
```

### 🚀 Enhanced Legacy Commands (with Queen Intelligence)
```bash
# Add Queen intelligence to existing swarm commands
snow-flow swarm "Create enterprise workflow" --queen --auto-permissions

# Queen-enhanced SPARC modes
snow-flow sparc "Create widget" --queen
```

## 🛠️ Advanced Features

### Flow vs Subflow Intelligence
Snow-Flow automatically analyzes your requirements and decides whether to create a main flow or break it into reusable subflows:
- Complexity analysis
- Reusability assessment
- Performance optimization
- Maintainability considerations

### Update Set Management
Professional change tracking just like ServiceNow developers use:
```bash
# Create a new update set for your feature
snow-flow sparc "Create update set for new approval features"

# All subsequent changes are automatically tracked
snow-flow sparc "Add approval widget to portal"
```

### Global Scope Strategy
Intelligent deployment scope selection:
- Automatic permission validation
- Fallback mechanisms for restricted environments
- Environment-aware deployment (dev/test/prod)

### Template Matching
Recognizes common patterns and applies best practices:
- Approval workflows
- Fulfillment processes
- Notification systems
- Integration patterns

## 🔧 New MCP Tools (v1.1.44+)

### Catalog Item Search with Fuzzy Matching
Find catalog items even when you don't know the exact name:
```javascript
// In Claude Code with MCP tools
snow_catalog_item_search({
  query: "iPhone",          // Finds iPhone 6S, iPhone 7, etc.
  fuzzy_match: true,       // Intelligent variations
  category_filter: "mobile devices",
  include_variables: true  // Get catalog variables
});
```

### Flow Testing with Mock Data
Test flows without affecting production data:
```javascript
snow_test_flow_with_mock({
  flow_id: "equipment_provisioning_flow",
  create_test_user: true,      // Auto-creates test user
  mock_catalog_items: true,    // Creates test items
  mock_catalog_data: [
    {
      name: "Test iPhone 6S",
      price: "699.00"
    }
  ],
  simulate_approvals: true,    // Auto-approves
  cleanup_after_test: true     // Removes test data
});
```

### Direct Catalog-Flow Linking
Link catalog items directly to flows for automated fulfillment:
```javascript
snow_link_catalog_to_flow({
  catalog_item_id: "iPhone 6S",
  flow_id: "mobile_provisioning_flow",
  link_type: "flow_catalog_process",  // Modern approach
  variable_mapping: [
    {
      catalog_variable: "phone_model",
      flow_input: "device_type"
    },
    {
      catalog_variable: "user_department",
      flow_input: "department"
    }
  ],
  trigger_condition: 'current.stage == "request_approved"',
  execution_options: {
    run_as: "system",
    wait_for_completion: true
  },
  test_link: true  // Creates test request
});
```

### Bulk Deployment
Deploy multiple artifacts in a single transaction:
```javascript
snow_bulk_deploy({
  artifacts: [
    { type: "widget", data: widgetData },
    { type: "flow", data: flowData },
    { type: "script", data: scriptData }
  ],
  transaction_mode: true,  // All-or-nothing deployment
  parallel: true,         // Deploy simultaneously
  dry_run: false
});
```

## 📁 Project Structure

```
snow-flow/
├── src/
│   ├── mcp/                    # 11 MCP server implementations
│   ├── orchestrator/           # Flow composition and intelligence
│   ├── strategies/             # Deployment and scope strategies
│   ├── api/                    # ServiceNow API integration
│   ├── managers/               # Resource and scope management
│   └── utils/                  # Utilities and helpers
├── .snow-flow/                 # Snow-Flow configuration
├── .claude/                    # Claude configuration
├── memory/                     # Persistent agent memory
└── coordination/               # Multi-agent coordination
```

## 🔧 Development Commands

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run typecheck

# Development mode
npm run dev

# Build for production
npm run build
```

## 📚 Documentation

- [MCP Server Documentation](./MCP_SERVERS.md) - Detailed info on all 11 MCP servers
- [OAuth Setup Guide](./SERVICENOW-OAUTH-SETUP.md) - ServiceNow OAuth configuration
- [Flow Composer Guide](./ENHANCED_FLOW_COMPOSER_DOCUMENTATION.md) - Advanced flow creation
- [Update Set Guide](./UPDATE_SET_DEPLOYMENT_GUIDE.md) - Professional change management
- [API Integration Guide](./API_INTEGRATION_GUIDE.md) - ServiceNow API details

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

## 🔒 Security

- All credentials stored securely in environment variables
- OAuth 2.0 authentication with ServiceNow
- No hardcoded values - everything discovered dynamically
- Secure token management with automatic refresh

## 🎯 Use Cases

### For ServiceNow Developers
- **🚀 Rapid Development**: One Queen command replaces hours of manual coordination
- **📚 Pattern Learning**: Queen learns your preferences and applies them automatically
- **🔄 Instant Prototyping**: Natural language to working artifacts in minutes
- **📈 Productivity Boost**: Reduce development time by 90% with hive-mind intelligence

### For ServiceNow Architects
- **🧠 Intelligent Architecture**: Queen applies learned architectural patterns automatically
- **🎯 Best Practice Enforcement**: Hive-mind ensures consistency across all projects
- **🔍 Impact Analysis**: Graph memory tracks relationships and dependencies
- **📊 Performance Optimization**: Memory-driven decisions optimize for performance

### For ServiceNow Administrators
- **⚡ One-Command Deployments**: Queen handles entire deployment lifecycle automatically
- **📋 Professional Change Tracking**: Automatic update set management
- **🛡️ Automated Testing**: Queen learns testing patterns and applies them
- **🔄 Intelligent Migration**: Memory-driven migration between instances

## 🚦 Roadmap

### 👑 Queen Agent Enhancements
- [ ] **Advanced Hive-Mind Learning**: Cross-project pattern sharing
- [ ] **Visual Queen Dashboard**: Real-time hive-mind intelligence visualization  
- [ ] **Queen Teams**: Collaborative Queen agents for enterprise projects
- [ ] **Predictive Development**: Queen suggests next steps based on learned patterns

### Traditional Feature Enhancements
- [ ] Enhanced Neo4j graph visualization
- [ ] Multi-instance synchronization
- [ ] AI-powered code review
- [ ] Automated testing framework
- [ ] Performance optimization recommendations

## 🆕 What's New in v1.1.25

### Automatic MCP Server Activation 🎯
- **Interactive Prompt**: During `snow-flow init --sparc`, you're now prompted to automatically start Claude Code with all MCP servers
- **Zero Manual Steps**: No more manual MCP approval in Claude Code - servers load automatically using `claude --mcp-config`
- **Cross-Platform Support**: Works on Mac, Linux, and Windows with platform-specific activation scripts
- **Instant Availability**: All 11 ServiceNow MCP servers are immediately available in Claude Code after initialization

### Previous Updates
- **v1.1.24**: Added `snow-flow mcp debug` command for troubleshooting MCP configurations
- **v1.1.23**: Fixed .npmignore to include essential .claude configuration files
- **v1.1.22**: Verified global npm installation correctly registers all MCP servers
- **v1.1.20**: Added enabledMcpjsonServers to ensure MCP visibility in Claude Code

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

Built with the power of Claude AI and the ServiceNow platform. Special thanks to the ServiceNow developer community for inspiration and best practices.

---

**Ready to experience the claude-flow revolution?** 

```bash
# Install and start with Queen Agent in under 2 minutes!
snow-flow init --sparc
snow-flow auth login
snow-flow queen "create my first ServiceNow solution"
```

**Join the hive-mind intelligence revolution!** 👑🚀