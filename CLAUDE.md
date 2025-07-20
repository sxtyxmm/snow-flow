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
mcp__claude-flow__memory_usage({
  action: "store",
  key: "widget_architecture",
  value: "Service Portal widget with Chart.js for data visualization"
});

// All agents can reference this
Task("Frontend Dev", "Implement widget based on widget_architecture in memory");
Task("Backend Dev", "Create REST endpoints for widget_architecture requirements");
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

## 🎯 Quick Start
1. `snow-flow init --sparc` - Initialize project with SPARC environment
2. Configure ServiceNow credentials in .env file
3. `snow-flow auth login` - Authenticate with ServiceNow OAuth
4. `snow-flow swarm "create a widget for incident management"` - Everything automatic!

## 💡 Important Notes

### Do's
- ✅ Use TodoWrite extensively for task tracking
- ✅ Batch MCP tool calls for performance
- ✅ Store important data in Memory for coordination
- ✅ Test with mock data before deploying
- ✅ Work within Update Sets for safety
- ✅ Use fuzzy search for finding artifacts

### Don'ts
- ❌ Don't make sequential tool calls when batch is possible
- ❌ Don't hardcode credentials or sys_ids
- ❌ Don't deploy without testing
- ❌ Don't ignore OAuth permission errors
- ❌ Don't create artifacts without checking if they exist

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
- `orchestrator`: Coordinates complex multi-step tasks
- `coder`: Focused code implementation
- `researcher`: Deep analysis and discovery
- `tester`: Comprehensive testing strategies
- `architect`: System design and architecture

---

*This configuration ensures optimal use of Claude Code's batch tools for Snow-Flow ServiceNow development with maximum efficiency and safety.*
