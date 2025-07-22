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
  type: "widget|flow|application",
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
   FAILURE? → Use fallback strategies (see below)
    ↓
4. snow_update_set_add_artifact() // Always track
    ↓
   DONE! ✅
```

## 🔧 Error Recovery - MCP Fallback Strategies

**Only if MCP tools fail, use these fallbacks:**

### Authentication Failures
```javascript
if (error.includes('authentication') || error.includes('401') || error.includes('403')) {
  return `
❌ ServiceNow Authentication Required

Fix this now:
1. Run: snow-flow auth login
2. Check .env: SNOW_INSTANCE, SNOW_CLIENT_ID, SNOW_CLIENT_SECRET
3. Test: snow_validate_live_connection()

Cannot proceed until authentication works!
  `;
}
```

### Permission Escalation
```javascript
if (error.includes('insufficient privileges')) {
  await snow_escalate_permissions({
    required_roles: ['admin', 'app_creator'],
    reason: 'ServiceNow development requires elevated permissions'
  });
}
```

### Deployment Failures - Graceful Degradation
```javascript
if (deployment.failed) {
  // Strategy 1: Try global scope
  const globalAttempt = await snow_deploy({ 
    ...config, 
    scope_preference: 'global' 
  });
  
  if (globalAttempt.failed) {
    // Strategy 2: Manual steps guide
    return createManualStepsGuide(config, error);
  }
}
```

## 🚀 Swarm Command - MCP-Orchestrated Multi-Agent Intelligence

**The Swarm system is now MCP-native and ALWAYS uses ServiceNow tools first!**

### 🚀 Primary Development Interface (RECOMMENDED)

```bash
# Swarm with automatic MCP-first workflow
snow-flow swarm "create incident dashboard with charts and real-time data"
snow-flow swarm "build approval workflow for equipment requests"  
snow-flow swarm "deploy mobile-responsive widget with accessibility features"
```

**What happens internally in every swarm:**
1. ✅ **Pre-flight auth check** with `snow_validate_live_connection()`
2. ✅ **Smart discovery** with `snow_comprehensive_search()`  
3. ✅ **Multi-agent coordination** with shared MCP context
4. ✅ **Real deployment** with `snow_deploy()`
5. ✅ **Automatic tracking** with `snow_update_set_add_artifact()`
6. ✅ **Live testing** with `snow_test_flow_with_mock()` or `snow_widget_test()`

### Swarm MCP Integration Features

- **🎯 Auto MCP Validation**: Every swarm operation starts with auth check
- **📊 Smart Discovery**: Uses `snow_comprehensive_search()` to find existing artifacts  
- **🔄 Update Set Management**: Automatic `snow_smart_update_set()` creation
- **🐝 Swarm Coordination**: All agents share MCP context and coordinate via real ServiceNow data
- **🚀 Live Deployment**: Direct ServiceNow integration via MCP tools
- **⚡ Parallel Execution**: Multiple agents work simultaneously on ServiceNow

## 🔒 MANDATORY ServiceNow Development Workflow

### **STEP 1: Authentication Validation (ALWAYS FIRST)**

```javascript
// This happens automatically in ALL MCP tools
const connectionResult = await snow_validate_live_connection({
  test_level: "permissions"  // Test actual write capabilities
});

if (!connectionResult.success) {
  throw new AuthenticationError(`
❌ ServiceNow Connection Failed: ${connectionResult.error}

🔧 Fix this now:
1. Check .env credentials
2. Run: snow-flow auth login  
3. Test: snow_auth_diagnostics()
  `);
}
```

### **STEP 2: Smart Discovery (Prevent Duplication)**

```javascript
// ALWAYS check before creating
const discovery = await snow_comprehensive_search({
  query: "incident dashboard widget",
  include_inactive: false
});

if (discovery.found.length > 0) {
  console.log(`🔍 Found ${discovery.found.length} similar artifacts:`);
  discovery.found.forEach(artifact => {
    console.log(`💡 Consider reusing: ${artifact.name} (${artifact.sys_id})`);
  });
}
```

### **STEP 3: Real ServiceNow Deployment**

```javascript
// Deploy directly to ServiceNow - NO local files!
const deployment = await snow_deploy({
  type: "widget",
  config: {
    name: "incident_dashboard",
    title: "Incident Dashboard", 
    template: htmlContent,
    server_script: serverJS,
    client_script: clientJS,
    css: cssStyles
  },
  auto_update_set: true,    // Automatic Update Set management
  fallback_strategy: "manual_steps"  // Graceful degradation
});
```

### **STEP 4: Automatic Update Set Tracking**

```javascript
// Every deployment is automatically tracked
await snow_update_set_add_artifact({
  type: deployment.type,
  sys_id: deployment.result.sys_id,
  name: deployment.result.name
});

console.log(`✅ Widget deployed: ${deployment.result.sys_id}`);
console.log(`📋 Tracked in Update Set: ${deployment.update_set_id}`);
```

## 🎯 MCP Tool Reference (Use These ALWAYS!)

### Core Deployment Tools
```javascript
// Universal deployment (replaces all old deploy_* tools)
snow_deploy({ type: "widget|flow|application", config: {...} })

// Smart artifact discovery  
snow_find_artifact({ query: "natural language", type: "widget" })
snow_comprehensive_search({ query: "broader search" })

// Live connection testing
snow_validate_live_connection({ test_level: "permissions" })

// Update Set management (automatic in snow_deploy)
snow_smart_update_set({ auto_track_related_artifacts: true })
```

### Testing & Validation Tools
```javascript
// Test flows with mock data (safer than live testing)
snow_test_flow_with_mock({ 
  flow_id: "approval_flow",
  create_test_user: true,
  cleanup_after_test: true 
})

// Widget testing
snow_widget_test({ 
  sys_id: "widget_sys_id",
  test_scenarios: [...] 
})

// Live deployment validation
snow_validate_deployment({ type: "widget", artifact: {...} })
```

### Authentication & Recovery Tools
```javascript
// Authentication diagnostics
snow_auth_diagnostics({ 
  run_write_test: true,
  include_recommendations: true 
})

// Permission escalation (when needed)
snow_escalate_permissions({
  required_roles: ['admin'],
  reason: 'Widget deployment requires admin access'
})
```

## 🚨 Error Patterns & Recovery

### Common Errors & MCP Solutions

**Authentication Errors (401/403)**
```javascript
if (error.status === 401 || error.status === 403) {
  const diagnostics = await snow_auth_diagnostics();
  if (!diagnostics.oauth_configured) {
    return "Run: snow-flow auth login";
  }
  if (diagnostics.token_expired) {
    return "Token expired - please re-authenticate";
  }
}
```

**Permission Errors**
```javascript
if (error.includes('insufficient privileges')) {
  await snow_escalate_permissions({
    required_roles: ['admin', 'app_creator'],
    workflow_context: 'ServiceNow widget development'
  });
}
```

**Deployment Conflicts**
```javascript
if (error.includes('already exists')) {
  const existing = await snow_find_artifact({ 
    query: config.name, 
    type: config.type 
  });
  
  return `
🔍 Artifact exists: ${existing.name} (${existing.sys_id})
Options:
1. Update existing: snow_edit_by_sysid()
2. Create with different name
3. Use existing as-is
  `;
}
```

## 📋 Quick Start Workflows

### 🚀 Widget Development (MCP-First)
```bash
# 1. Authentication check (automatic in Swarm)
snow-flow swarm "create incident dashboard widget"

# Manual MCP workflow (what happens internally):
# snow_validate_live_connection() → snow_find_artifact() → snow_deploy() → snow_update_set_add_artifact()
```

### 🔄 Flow Development (MCP-First)  
```bash
# Swarm handles all MCP orchestration with multiple agents
snow-flow swarm "create approval workflow for equipment requests"

# What happens: snow_create_flow() → snow_test_flow_with_mock() → multi-agent validation → auto tracking
```

### 🎯 Smart Discovery Before Creation
```bash
# Always check first!
snow-flow swarm "find existing incident widgets and create improved version"

# Uses: snow_comprehensive_search() → swarm analysis → smart reuse recommendations
```

## 🔧 Build Commands & Testing
- `npm run build`: Build project  
- `npm run test`: Run test suite
- `npm run lint`: Code quality checks
- `npm run typecheck`: TypeScript validation
- `snow-flow auth login`: ServiceNow authentication
- `snow-flow status`: System health check

## 💡 Important Development Rules

### ✅ DO THESE ALWAYS:
- ✅ **Start with MCP tools** - `snow_validate_live_connection()` first
- ✅ **Use discovery** - `snow_find_artifact()` before creating  
- ✅ **Deploy real artifacts** - `snow_deploy()` to ServiceNow
- ✅ **Track everything** - Automatic in `snow_deploy()` with `auto_update_set: true`
- ✅ **Test with mock data** - `snow_test_flow_with_mock()` for safety

### ❌ NEVER DO THESE:
- ❌ **Create local files** without MCP check first
- ❌ **Generate mock sys_ids** instead of real deployment
- ❌ **Skip authentication** validation  
- ❌ **Work offline** when ServiceNow is available
- ❌ **Ignore discovery** results

## 🚀 System Architecture

Snow-flow is built on **MCP-native architecture**:

1. **BaseMCPServer Pattern**: All 11 MCP servers use consistent error handling
2. **MCPExecutionBridge**: Queen Agent uses real MCP tools, not mocks  
3. **Smart Update Sets**: Automatic artifact tracking and management
4. **Authentication-First**: Every operation validates ServiceNow access
5. **Discovery-Driven**: Prevent duplication through intelligent search

---

**Remember: Snow-flow's value is REAL ServiceNow integration. Always use `snow-flow swarm` with MCP tools first!** 🚀

## 🎯 PRIMARY COMMAND: snow-flow swarm

**The `swarm` command is your main interface - it orchestrates everything MCP-first:**

```bash
# ✅ PRIMARY INTERFACE - Use this!
snow-flow swarm "create incident dashboard widget"
snow-flow swarm "build approval workflow for equipment requests"
snow-flow swarm "deploy mobile-responsive widget with accessibility features"

# ✅ All swarm operations automatically include:
# 1. snow_validate_live_connection() - Auth check
# 2. snow_comprehensive_search() - Smart discovery  
# 3. snow_deploy() - Real ServiceNow deployment
# 4. snow_update_set_add_artifact() - Automatic tracking
```

**Every swarm operation is MCP-native and ServiceNow-first!** 🐝