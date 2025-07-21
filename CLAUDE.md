# Snow-Flow Development with Claude Code

## 🚀 Core Development Principles

### Concurrent Execution Strategy
**Golden Rule**: "1 MESSAGE = ALL RELATED OPERATIONS"
- Always batch related MCP tool calls in a single response
- Use TodoWrite extensively for complex task coordination
- Launch multiple agents concurrently for maximum performance
- Leverage batch file operations whenever reading/writing multiple files

### ServiceNow Development Best Practices
1. **Never hardcode credentials** - Use OAuth and environment variables
2. **Always work in Update Sets** - MANDATORY SEQUENCE:
   a. FIRST: Create update set with `snow_update_set_create`
   b. THEN: Switch to it with `snow_update_set_switch`  
   c. TRACK: Every artifact with `snow_update_set_add_artifact`
   d. CHECK: Current status with `snow_update_set_current`
   e. COMPLETE: Mark complete with `snow_update_set_complete`
3. **Test before deploy** - Use mock testing tools for validation
4. **Validate permissions** - Check OAuth scopes before operations
5. **Use fuzzy search** - ServiceNow names can vary (iPhone vs iPhone 6S)
6. **Track all artifacts** - Use snow_update_set_add_artifact after EVERY deployment
7. **Test with mock first** - Use snow_test_flow_with_mock before comprehensive testing
8. **Verify before test** - Check artifact exists with snow_get_by_sysid before testing

### Update Set Best Practices
- NEVER deploy without active update set
- ALWAYS track artifacts immediately after deployment
- CHECK current update set before starting work
- COMPLETE update sets before moving between environments

## 📋 Essential MCP Tool Patterns

### Batch Operations for Maximum Efficiency
```javascript
// GOOD: Single message with multiple tool calls
TodoWrite([...tasks]);
Task("Architect", "Design system architecture");
Task("Developer", "Implement components");
Task("Tester", "Create test scenarios");

// BAD: Sequential single operations
TodoWrite([task1]);
// wait for response
TodoWrite([task2]);
// wait for response
```

### Memory-Driven Coordination
Use Memory to coordinate information across agents:
```javascript
// Store architecture decisions
snow_memory_store({
  key: "widget_architecture",
  value: "Service Portal widget with Chart.js for data visualization"
});

// All agents can reference this
Task("Frontend Dev", "Implement widget based on widget_architecture in memory");
Task("Backend Dev", "Create REST endpoints for widget_architecture requirements");
```

### Team-Driven Development Coordination
Use specialized teams for complex ServiceNow development:

```bash
# Team with shared memory and quality gates
snow-flow sparc team widget "dashboard" --shared-memory --validation --monitor

# Store team requirements and coordination data
snow-flow memory store "team_requirements" "Dashboard with real-time KPIs and mobile responsiveness"

# All team specialists can access shared context
snow-flow memory get "team_requirements"
```

## 🛠️ Complete ServiceNow MCP Tools Reference

### Discovery & Search Tools
```javascript
// Find any ServiceNow artifact using natural language
snow_find_artifact({
  query: "the widget that shows incidents on homepage",
  type: "widget" // or "flow", "script", "application", "any"
});

// Search catalog items with fuzzy matching
snow_catalog_item_search({
  query: "laptop",
  fuzzy_match: true,        // Finds variations: notebook, MacBook, etc.
  category_filter: "hardware",
  include_variables: true   // Get catalog variables too
});

// Direct sys_id lookup (faster than search)
snow_get_by_sysid({
  sys_id: "abc123...",
  table: "sp_widget"
});
```

### Flow Development Tools
```javascript
// Create flows from natural language
snow_create_flow({
  instruction: "create a flow that sends email when incident priority is high",
  deploy_immediately: true,
  enable_intelligent_analysis: true
});

// Test flows with mock data
snow_test_flow_with_mock({
  flow_id: "incident_notification_flow",
  create_test_user: true,
  mock_catalog_items: true,
  test_inputs: {
    priority: "1",
    category: "hardware"
  },
  simulate_approvals: true
});

// Link catalog items to flows
snow_link_catalog_to_flow({
  catalog_item_id: "New Laptop Request",
  flow_id: "laptop_provisioning_flow",
  link_type: "flow_catalog_process",
  variable_mapping: [
    {
      catalog_variable: "laptop_model",
      flow_input: "equipment_type"
    }
  ]
});
```

### Widget Development Tools
```javascript
// Deploy widgets with automatic validation
snow_deploy_widget({
  name: "incident_dashboard",
  title: "Incident Dashboard",
  template: htmlContent,
  css: cssContent,
  client_script: clientJS,
  server_script: serverJS,
  demo_data: { incidents: [...] }
});

// Preview and test widgets
snow_preview_widget({
  widget_id: "incident_dashboard",
  check_dependencies: true
});

snow_widget_test({
  widget_id: "incident_dashboard",
  test_scenarios: [
    {
      name: "Load with no data",
      server_data: { incidents: [] }
    }
  ]
});
```

### Bulk Operations
```javascript
// Deploy multiple artifacts at once
snow_bulk_deploy({
  artifacts: [
    { type: "widget", data: widgetData },
    { type: "flow", data: flowData },
    { type: "script", data: scriptData }
  ],
  transaction_mode: true,     // All or nothing
  parallel: true,            // Deploy simultaneously
  dry_run: false
});
```

### Intelligent Analysis
```javascript
// Analyze incidents with AI
snow_analyze_incident({
  incident_id: "INC0010001",
  include_similar: true,
  suggest_resolution: true
});

// Pattern analysis
snow_pattern_analysis({
  analysis_type: "incident_patterns",
  timeframe: "month"
});
```

## Flow Testing Guidelines

### Test Flow Hierarchy (use in this order):
1. **snow_test_flow_with_mock** - Always works, use for basic validation
2. **snow_get_by_sysid** - Verify flow exists before advanced testing  
3. **snow_comprehensive_flow_test** - Only if above work (often 404)

### Flow Creation Best Practices
❌ NEVER use snow_deploy_flow with manual JSON
✅ ALWAYS use snow_create_flow with natural language
✅ OR use snow_flow_wizard for step-by-step

Example:
```javascript
// GOOD - Natural language
snow_create_flow({
  instruction: "create approval flow for user provisioning",
  deploy_immediately: true
})

// BAD - Manual JSON (vaak leeg resultaat!)
snow_deploy_flow({
  flow_definition: {...} // Dit werkt vaak niet!
})
```

## ⚡ Performance Optimization

### Parallel Execution Patterns
```javascript
// Execute multiple searches concurrently
Promise.all([
  snow_find_artifact({ query: "incident widget" }),
  snow_catalog_item_search({ query: "laptop" }),
  snow_query_incidents({ query: "priority=1" })
]);
```

### Batch File Operations
```javascript
// Read multiple files in one operation
MultiRead([
  "/path/to/widget.html",
  "/path/to/widget.css",
  "/path/to/widget.js"
]);
```

## 📝 Workflow Guidelines

### Standard Development Flow
1. **Discovery Phase**: Use search tools to find existing artifacts
2. **Planning Phase**: Use TodoWrite to plan all tasks
3. **Development Phase**: Launch agents concurrently
4. **Testing Phase**: Use mock testing tools
5. **Deployment Phase**: Use bulk deploy with validation

### Error Recovery Patterns
```javascript
// Always implement rollback strategies
if (deployment.failed) {
  snow_deployment_rollback_manager({
    update_set_id: deployment.update_set,
    restore_point: deployment.backup_id
  });
}
```

## 🔧 Advanced Configuration

## Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the full test suite
- `npm run lint`: Run ESLint and format checks
- `npm run typecheck`: Run TypeScript type checking

## Snow-Flow Commands
- `snow-flow init --sparc`: Initialize project with SPARC environment
- `snow-flow auth login`: Authenticate with ServiceNow OAuth
- `snow-flow swarm "<objective>"`: Start multi-agent swarm - één command voor alles!
- `snow-flow sparc <mode> "<task>"`: Run specific SPARC mode

## Enhanced Swarm Command (v1.1.41+)
The swarm command now includes intelligent features that are **enabled by default**:

```bash
# Simple usage - all intelligent features enabled!
snow-flow swarm "create incident management dashboard"
```

### Default Settings (no flags needed):
- ✅ `--smart-discovery` - Automatically discovers and reuses existing artifacts
- ✅ `--live-testing` - Tests in real-time on your ServiceNow instance
- ✅ `--auto-deploy` - Deploys automatically (safe with update sets)
- ✅ `--auto-rollback` - Automatically rollbacks on failures
- ✅ `--shared-memory` - All agents share context and coordination
- ✅ `--progress-monitoring` - Real-time progress tracking
- ❌ `--auto-permissions` - Disabled by default (enable with flag for automatic role elevation)

### Advanced Usage:
```bash
# Enable automatic permission escalation
snow-flow swarm "create global workflow" --auto-permissions

# Disable specific features
snow-flow swarm "test widget" --no-auto-deploy --no-live-testing

# Full control
snow-flow swarm "complex integration" \
  --max-agents 8 \
  --strategy development \
  --mode distributed \
  --parallel \
  --auto-permissions
```

## New MCP Tools (v1.1.44+)

### Catalog Item Search
Find catalog items with intelligent fuzzy matching:
```javascript
snow_catalog_item_search({
  query: "iPhone",          // Will find iPhone 6S, iPhone 7, etc.
  fuzzy_match: true,        // Enable intelligent variations
  include_variables: true   // Include catalog variables
})
```

### Flow Testing with Mock Data
Test flows without real data:
```javascript
snow_test_flow_with_mock({
  flow_id: "equipment_provisioning_flow",
  create_test_user: true,      // Creates test user
  mock_catalog_items: true,    // Creates test catalog items
  simulate_approvals: true,    // Auto-approves during test
  cleanup_after_test: true     // Removes test data after
})
```

### Direct Catalog-Flow Linking
Link catalog items directly to flows:
```javascript
snow_link_catalog_to_flow({
  catalog_item_id: "iPhone 6S",
  flow_id: "mobile_provisioning_flow",
  link_type: "flow_catalog_process",  // Modern approach
  variable_mapping: [
    {
      catalog_variable: "phone_model",
      flow_input: "device_type"
    }
  ],
  test_link: true  // Creates test request
})
```

### OAuth Configuration
```env
# .env file
SNOW_INSTANCE=dev123456
SNOW_CLIENT_ID=your_oauth_client_id
SNOW_CLIENT_SECRET=your_oauth_client_secret
SNOW_USERNAME=admin
SNOW_PASSWORD=admin_password
```

### Update Set Management
```javascript
// Smart update set creation
snow_smart_update_set({
  name: "Auto-generated for widget development",
  detect_context: true,  // Auto-detects what you're working on
  auto_switch: true     // Switches when context changes
});
```

## 🚀 NEW: Team-Based Agent Architecture (v1.1.62+)

### Specialized Development Teams

Snow-Flow now uses specialized teams that mirror real software development teams, replacing monolithic agents with expert specialists:

#### **Widget Development Team**
```bash
# Complete widget development with specialized roles
snow-flow sparc team widget "create incident dashboard with charts and filters"
```

**Team Composition:**
- 🎨 **Frontend Developer**: HTML templates, CSS styling, responsive design
- ⚙️ **Backend Developer**: Server scripts, API calls, data processing
- 🖼️ **UI/UX Designer**: User experience, design patterns, accessibility
- 🔧 **ServiceNow Specialist**: Platform integration, best practices
- 🧪 **QA Tester**: Widget testing, validation, edge cases

#### **Flow Development Team**
```bash
# Complete flow development with process experts
snow-flow sparc team flow "build approval process for equipment requests"
```

**Team Composition:**
- 🔄 **Process Designer**: Business logic, workflow design
- 🎯 **Trigger Specialist**: Event handling, conditions, automation
- 📊 **Data Specialist**: Variables, transformations, integrations
- 🔗 **Integration Expert**: APIs, external systems, data sync
- 🛡️ **Security Reviewer**: Permissions, validation, compliance

#### **Application Development Team**
```bash
# Complete application development with enterprise specialists
snow-flow sparc team app "create complete ITSM solution with custom tables"
```

**Team Composition:**
- 🏗️ **Database Designer**: Tables, relationships, indexes, performance
- 🎯 **Business Logic Developer**: Rules, scripts, calculations
- 🎨 **Interface Designer**: Forms, lists, UI components
- 🔐 **Security Engineer**: ACLs, roles, access control
- 📈 **Performance Optimizer**: Queries, caching, efficiency

#### **Adaptive Team (Generic Scenario)**
```bash
# For unknown/custom tasks - dynamically assembled specialists
snow-flow sparc team adaptive "create integration between ServiceNow and external API"
```

**Dynamic Assembly:**
- 🤖 **Task Analyzer**: Understands requirements and assembles optimal team
- 🔧 **Specialist Pool**: Data, Integration, Automation, Security, Reporting specialists
- 📋 **Coordination Patterns**: Sequential, parallel, or hybrid execution
- 🎯 **Quality Gates**: Validation checkpoints between specialist handoffs

### Team Coordination Features

#### **Shared Memory System**
Teams share context and communicate through intelligent memory:
```bash
# Enable shared memory (default: true)
snow-flow sparc team widget "dashboard" --shared-memory
```

- **Context Sharing**: All specialists access shared requirements and progress
- **Version Control**: Track changes and enable rollback if needed
- **Real-time Updates**: Specialists notified when dependencies complete

#### **Quality Gates**
Automated validation between specialist handoffs:
```bash
# Enable validation gates (recommended)
snow-flow sparc team flow "approval" --validation
```

**Quality Gate Types:**
- **Code Quality**: Syntax, standards, best practices
- **Security Review**: Vulnerability scanning, access controls
- **Performance Check**: Query optimization, response times
- **Accessibility**: WCAG compliance, usability testing

#### **Execution Patterns**
Teams automatically select optimal coordination:

**Sequential Pattern** (Dependencies):
```
Architecture → Database → Business Logic → Interface → Testing
```

**Parallel Pattern** (Independent work):
```
Frontend ⟷ Backend ⟷ Security ⟷ Testing (simultaneously)
```

**Hybrid Pattern** (Optimized):
```
Phase 1: Architecture (sequential)
Phase 2: Frontend + Backend + Security (parallel)  
Phase 3: Integration + Testing (sequential)
```

### Individual Specialist Modes

Access specific specialists directly for focused tasks:

```bash
# Frontend specialist
snow-flow sparc frontend "optimize widget responsiveness for mobile"

# Backend specialist  
snow-flow sparc backend "optimize database queries for performance"

# Security specialist
snow-flow sparc security "review application access controls"

# Data specialist
snow-flow sparc data "design table relationships for ITSM"

# Integration specialist
snow-flow sparc integration "create REST API for external system"
```

### Team Command Options

```bash
# Basic team execution
snow-flow sparc team widget "create dashboard"

# Advanced coordination options
snow-flow sparc team widget "dashboard" \
  --parallel \           # Enable parallel execution
  --monitor \           # Real-time progress monitoring
  --shared-memory \     # Enable context sharing (default: true)
  --validation \        # Enable quality gates (recommended)
  --dry-run            # Preview team assembly and plan

# Specialist-specific options
snow-flow sparc frontend "template" \
  --responsive \        # Focus on mobile responsiveness
  --accessibility      # WCAG compliance focus
```

### Team vs Individual Agent Comparison

| Scenario | Old Approach | New Team Approach |
|----------|-------------|-------------------|
| **Widget Creation** | Single agent does everything | Frontend + Backend + UI/UX + Platform specialists |
| **Flow Development** | Flow agent handles all aspects | Process + Trigger + Data + Security specialists |
| **Complex Integration** | Generic coder attempts everything | Adaptive team assembles: Integration + Data + Security + Testing |
| **Quality Assurance** | No systematic validation | Quality gates between each specialist handoff |
| **Knowledge Sharing** | Isolated agent knowledge | Shared memory with version control |

### Best Practices for Team Usage

#### **When to Use Teams vs Individual Agents**

**✅ Use Teams For:**
- Complete widget/flow/application development
- Complex multi-component tasks
- Production-quality deliverables
- When you need multiple expertise areas

```bash
# Good: Complete solution
snow-flow sparc team widget "create executive dashboard with KPIs"

# Good: Complex process
snow-flow sparc team flow "multi-step approval with integrations"
```

**✅ Use Individual Specialists For:**
- Focused single-component tasks
- Quick fixes or optimizations
- Specific expertise needed
- Learning/exploration

```bash
# Good: Focused task
snow-flow sparc frontend "fix mobile responsiveness issue"

# Good: Specific expertise
snow-flow sparc security "review permissions for table X"
```

#### **Team Coordination Guidelines**

1. **Let the Architect Lead**: Team coordinators (architects) analyze requirements and manage specialists
2. **Enable Shared Memory**: Always use `--shared-memory` for complex tasks
3. **Use Quality Gates**: Enable `--validation` for production deployments
4. **Monitor Progress**: Use `--monitor` for long-running team tasks
5. **Dry Run First**: Use `--dry-run` to preview team assembly for complex tasks

#### **Error Handling and Recovery**

Teams include automatic error recovery:
- **Quality Gate Failures**: Automatic retry with specialist feedback
- **Specialist Errors**: Fallback to alternative approaches
- **Dependency Issues**: Intelligent rescheduling and re-coordination
- **Shared Memory Conflicts**: Version control and conflict resolution

### Migration from Old Agent System

**Old Command → New Team Command:**
```bash
# Old: Monolithic approach
snow-flow sparc coder "create widget" 
# New: Specialized team
snow-flow sparc team widget "create widget"

# Old: Generic development
snow-flow sparc designer "create flow"
# New: Process-focused team  
snow-flow sparc team flow "create flow"

# Old: Single agent application
snow-flow sparc architect "design app"
# New: Full development team
snow-flow sparc team app "design app"
```

**Backward Compatibility:**
- All existing individual SPARC modes still work
- Old commands automatically suggest team alternatives
- Gradual migration path available

## 🎯 Quick Start Workflows

### 🚀 Team-Based Development (v1.1.62+)

```bash
# Widget Development Team
snow-flow sparc team widget "create incident dashboard"

# Flow Development Team  
snow-flow sparc team flow "build approval workflow"

# Application Development Team
snow-flow sparc team app "create ITSM solution"

# Adaptive Team (for custom/unknown tasks)
snow-flow sparc team adaptive "create complex integration"

# Individual Specialists
snow-flow sparc frontend "mobile responsiveness"
snow-flow sparc backend "API optimization"  
snow-flow sparc security "access control review"
```

### 🎯 Quick Start
1. `snow-flow init --sparc` - Initialize project with SPARC environment
2. Configure ServiceNow credentials in .env file
3. `snow-flow auth login` - Authenticate with ServiceNow OAuth
4. `snow-flow swarm "create a widget for incident management"` - Everything automatic!
5. `snow-flow sparc team widget "create dashboard"` - NEW: Use specialized teams!

## 💡 Important Notes

### Do's
- ✅ Use TodoWrite extensively for task tracking
- ✅ Batch MCP tool calls for performance
- ✅ Store important data in Memory for coordination
- ✅ Test with mock data before deploying
- ✅ Work within Update Sets for safety
- ✅ Use fuzzy search for finding artifacts
- ✅ Write out code thats important for the whole objective to work

### Don'ts
- ❌ Don't make sequential tool calls when batch is possible
- ❌ Don't hardcode credentials or sys_ids
- ❌ Don't deploy without testing
- ❌ Don't ignore OAuth permission errors
- ❌ Don't create artifacts without checking if they exist
- ❌ Don't use mock data or placeholder code

## 🚀 Performance Benchmarks

With concurrent execution and batch operations:
- **Widget Development**: 3x faster than sequential
- **Flow Creation**: 2.5x faster with parallel validation
- **Bulk Deployment**: Up to 5x faster with parallel mode
- **Search Operations**: 4x faster with concurrent queries

## 📚 Additional Resources

### MCP Server Documentation
- **servicenow-deployment**: Widget, flow, and application deployment
- **servicenow-intelligent**: Smart search and artifact discovery
- **servicenow-operations**: Incident management and catalog operations
- **servicenow-flow-composer**: Natural language flow creation
- **servicenow-platform-development**: Scripts, rules, and policies

### SPARC Modes

#### **Individual SPARC Modes**
- `orchestrator`: Coordinates complex multi-step tasks
- `coder`: Focused code implementation
- `researcher`: Deep analysis and discovery
- `tester`: Comprehensive testing strategies
- `architect`: System design and architecture

#### **Team SPARC Modes (v1.1.62+)**
- `team widget`: Widget development with Frontend + Backend + UI/UX + Platform + QA specialists
- `team flow`: Flow development with Process + Trigger + Data + Integration + Security specialists
- `team app`: Application development with Database + Business Logic + Interface + Security + Performance specialists
- `team adaptive`: Dynamic team assembly based on task requirements

#### **Individual Specialist Modes (v1.1.62+)**
- `frontend`: HTML templates, CSS styling, responsive design
- `backend`: Server scripts, API calls, data processing, performance optimization
- `security`: Access controls, permissions, vulnerability assessment, compliance review
- `data`: Database design, table relationships, data transformations
- `integration`: APIs, external systems, data synchronization

---

*This configuration ensures optimal use of Claude Code's batch tools for Snow-Flow ServiceNow development with maximum efficiency and safety.*
