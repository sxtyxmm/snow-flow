# Snow-Flow Development with Claude Code

## 🚨 CRITICAL: MCP-FIRST WORKFLOW (READ THIS FIRST!)

**Snow-flow's core value is REAL ServiceNow integration through MCP tools. NEVER work in offline mode!**

### ⚠️ MANDATORY WORKFLOW - NO EXCEPTIONS

**Every ServiceNow task MUST start with this sequence:**

```javascript
// 1. MANDATORY: Pre-flight authentication check
const authCheck = await snow_validate_live_connection({ test_level: "permissions" });
if (!authCheck.success) {
  // STOP! Fix authentication first
  return authenticationError(authCheck.error);
}

// 2. MANDATORY: Discovery before creation
const discovery = await snow_find_artifact({ 
  query: "your objective",
  type: "widget|flow|script|any" 
});

// 3. MANDATORY: Real ServiceNow deployment
const deployment = await snow_deploy({
  type: "widget|application",  // Note: flow removed in v1.4.0+
  config: { /* your config */ },
  auto_update_set: true  // Always track changes
});

// 4. MANDATORY: Track in Update Set
await snow_update_set_add_artifact({
  type: deployment.type,
  sys_id: deployment.result.sys_id,
  name: deployment.result.name
});
```

### 🚫 FORBIDDEN ACTIONS

**THESE ACTIONS ARE BANNED - NEVER DO THESE:**

❌ **Creating local files** without MCP check first  
❌ **Generating mock data** instead of using MCP tools  
❌ **Working in "offline mode"** when ServiceNow is available  
❌ **Skipping authentication validation**  
❌ **Planning mode** without trying MCP tools first

### ✅ CORRECT: MCP-First Decision Tree

```
User Request → ALWAYS START HERE:
    ↓
1. snow_validate_live_connection()
    ↓
   SUCCESS? → Continue to Step 2
    ↓
   FAILURE? → Fix auth: snow_auth_diagnostics()
              Then guide user: "snow-flow auth login"
              STOP until auth works
    ↓
2. snow_find_artifact() // Check if exists
    ↓
   FOUND? → Ask: "Reuse existing or create new?"
    ↓
   NOT FOUND? → Continue to Step 3
    ↓
3. snow_deploy() // Real deployment to ServiceNow
    ↓
   SUCCESS? → Step 4: Track in Update Set
    ↓
   FAILURE? → Use fallback strategies
    ↓
4. snow_update_set_add_artifact() // Always track
    ↓
   DONE! ✅
```

## 🚀 Snow-Flow Swarm Command - MCP-Orchestrated Multi-Agent Intelligence

**The Swarm system is MCP-native and ALWAYS uses ServiceNow tools first!**

### 🧠 Queen Agent with Parallel Execution (v1.4.0+)
- Automatically spawns 6+ specialized agents for widget development
- Achieves proven 2.8x speedup through intelligent parallel execution
- All agents coordinate through Snow-Flow's memory system
- Every agent uses MCP tools directly - no offline mode

### Swarm Command Examples
```bash
# Simple widget creation
snow-flow swarm "create incident dashboard widget"

# Complex development
snow-flow swarm "build employee onboarding portal with approval workflows"

# With specific options
snow-flow swarm "create service catalog item" --no-auto-deploy --monitor
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
  include_variables: true   // Include catalog variables
});

// Comprehensive search across all tables
snow_comprehensive_search({
  query: "approval",
  include_inactive: false
});
```

### Deployment Tools
```javascript
// Universal deployment tool
snow_deploy({
  type: "widget",
  config: {
    name: "Incident Dashboard",
    template: "<html>...</html>",
    css: "/* styles */",
    server_script: "// server code",
    client_script: "// client code"
  },
  auto_update_set: true
});

// Bulk deployment
snow_bulk_deploy({
  artifacts: [...],
  transaction_mode: true,
  rollback_on_error: true
});
```

### Update Set Management
```javascript
// Ensure active Update Set
snow_ensure_active_update_set({
  context: "Widget development"
});

// Track artifacts
snow_update_set_add_artifact({
  type: "widget",
  sys_id: "abc123",
  name: "My Widget"
});

// Preview changes
snow_update_set_preview({
  update_set_id: "current"
});
```

### Testing Tools
```javascript
// Test flows with mock data
snow_test_flow_with_mock({
  flow_id: "equipment_provisioning_flow",
  create_test_user: true,
  mock_catalog_items: true,
  simulate_approvals: true,
  cleanup_after_test: true
});

// Link catalog to flow
snow_link_catalog_to_flow({
  catalog_item_id: "iPhone 6S",
  flow_id: "mobile_provisioning_flow",
  test_link: true
});
```

## 📋 Essential Patterns

### Authentication Handling
```javascript
// Always handle auth failures gracefully
if (error.includes('401') || error.includes('403')) {
  // Guide user to fix authentication
  console.log('Run: snow-flow auth login');
  console.log('Check .env file for credentials');
  // STOP - don't continue without auth
}
```

### Error Recovery
```javascript
// Implement fallback strategies
if (deployment.failed) {
  // Try global scope
  const globalAttempt = await snow_deploy({ 
    ...config, 
    scope_preference: 'global' 
  });
  
  if (globalAttempt.failed) {
    // Provide manual instructions
    return createManualStepsGuide(config, error);
  }
}
```

## 🔧 Configuration

### Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the full test suite
- `npm run lint`: Run ESLint and format checks
- `npm run typecheck`: Run TypeScript type checking

### Snow-Flow Commands
- `snow-flow init --sparc`: Initialize project with MCP servers
- `snow-flow auth login`: Authenticate with ServiceNow
- `snow-flow swarm "<objective>"`: Execute multi-agent development
- `snow-flow mcp start`: Start MCP servers manually

### Environment Setup
```bash
# .env file
SNOW_INSTANCE=dev123456
SNOW_CLIENT_ID=your_oauth_client_id
SNOW_CLIENT_SECRET=your_oauth_client_secret
```

## 💡 Best Practices

### DO's
✅ Always use `snow_validate_live_connection()` first  
✅ Check for existing artifacts with `snow_find_artifact()`  
✅ Use Update Sets for all changes  
✅ Test with mock data before production  
✅ Handle errors gracefully with fallbacks  

### DON'Ts
❌ Don't create local files first  
❌ Don't skip authentication  
❌ Don't hardcode sys_ids or credentials  
❌ Don't work in offline mode  
❌ Don't deploy without testing  

## 🎯 Quick Start
1. `snow-flow init --sparc` - Initialize project with MCP servers
2. Configure ServiceNow credentials in .env file  
3. `snow-flow auth login` - Authenticate with ServiceNow
4. `snow-flow swarm "create a widget for incident management"` - Everything automatic!

For full documentation, visit: https://github.com/groeimetai/snow-flow