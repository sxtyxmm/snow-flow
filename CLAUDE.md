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

// 3. 🧠 INTELLIGENT GAP ANALYSIS (Beyond MCP Tools)
const gapAnalysis = await analyzeGaps("your objective", mcpTools, logger, {
  autoPermissions: true,
  environment: "development",
  enableAutomation: true,
  includeManualGuides: true
});

// 4. 🚀 NEW v1.1.90: INTELLIGENT PARALLEL AGENT DETECTION
// Queen Agent automatically detects parallelization opportunities
// Spawns specialized agent teams (CSS, backend, security specialists)
// Achieves 2-5x speedup through intelligent task distribution
console.log('🧠 Queen Agent analyzing parallelization opportunities...');

// 5. MANDATORY: Real ServiceNow deployment
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
3. 🧠 analyzeGaps() // NEW: Intelligent Gap Analysis
    ↓
   DETECTS: All ServiceNow configs beyond MCP tools
   AUTOMATES: System properties, navigation, auth configs
   PROVIDES: Manual guides for complex setups
    ↓
4. snow_deploy() // Real deployment to ServiceNow
    ↓
   SUCCESS? → Step 5: Track in Update Set
    ↓
   FAILURE? → Use fallback strategies (see below)
    ↓
5. snow_update_set_add_artifact() // Always track
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
3. 🧠 **NEW: Intelligent Gap Analysis** - detects ALL required ServiceNow configurations
4. ✅ **Multi-agent coordination** with shared MCP context
5. ✅ **Real deployment** with `snow_deploy()`
6. ✅ **Automatic tracking** with `snow_update_set_add_artifact()`
7. ✅ **Live testing** with `snow_test_flow_with_mock()` or `snow_widget_test()`

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

### **STEP 3: 🧠 Intelligent Gap Analysis (NEW!)**

```javascript
// NEW: Automatically detects ALL ServiceNow configurations needed beyond MCP tools
const gapAnalysis = await analyzeGaps("create incident management with LDAP auth", mcpTools, logger, {
  autoPermissions: true,        // Automatic configuration when possible
  environment: "development",   // Environment-specific guidance  
  enableAutomation: true,       // Attempt automatic resolution
  includeManualGuides: true,    // Generate manual instructions
  riskTolerance: "medium"       // Risk assessment level
});

console.log(`📊 Gap Analysis Results:`);
console.log(`  • Total Requirements: ${gapAnalysis.totalRequirements}`);  
console.log(`  • MCP Coverage: ${gapAnalysis.mcpCoverage.coveragePercentage}%`);
console.log(`  • Auto-Resolved: ${gapAnalysis.summary.successfulAutomation} configs`);
console.log(`  • Manual Setup: ${gapAnalysis.summary.requiresManualWork} items`);

// Display automatic configurations
if (gapAnalysis.summary.successfulAutomation > 0) {
  console.log('\n✅ Automatically Configured:');
  gapAnalysis.nextSteps.automated.forEach(step => console.log(`  • ${step}`));
}

// Display manual setup requirements  
if (gapAnalysis.summary.requiresManualWork > 0) {
  console.log('\n📋 Manual Configuration Required:');
  gapAnalysis.nextSteps.manual.forEach(step => console.log(`  • ${step}`));
  
  // Detailed manual guides available
  if (gapAnalysis.manualGuides) {
    console.log('\n📚 Detailed step-by-step guides:');
    gapAnalysis.manualGuides.guides.forEach(guide => {
      console.log(`  📖 ${guide.title} - ${guide.totalEstimatedTime}`);
      console.log(`     Risk: ${guide.riskLevel} | Roles: ${guide.requiredRoles.join(', ')}`);
    });
  }
}
```

### **STEP 4: Real ServiceNow Deployment**

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

### **STEP 5: Automatic Update Set Tracking**

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

## 🧠 Intelligent Gap Analysis Engine (Revolutionary New Feature!)

**The breakthrough solution for handling ALL ServiceNow configurations beyond MCP tools!**

### What It Does

The Gap Analysis Engine automatically detects **60+ types of ServiceNow configurations** that your objective requires but that fall outside the scope of standard MCP tools:

**🔐 Authentication & Security:**
- LDAP, SAML, OAuth provider configurations
- SSO setup, MFA configurations  
- ACL rules, data policies, user roles

**🗄️ Database & Performance:**
- Database indexes, views, partitioning
- Performance analytics, monitoring configs
- System properties, cache settings

**🧭 Navigation & UI:**
- Application menus, navigation modules
- Form layouts, sections, list configurations
- UI actions, policies, client scripts

**📧 Communication & Integration:**
- Email templates, notification rules
- Web services, SOAP messages, import sets
- Transform maps, integration endpoints

**🔄 Workflow & Automation:**
- Workflow activities, transitions
- SLA definitions, escalation rules
- Scheduled jobs, event rules

### How It Works

```javascript
// The engine analyzes your objective and automatically:

1. 🎯 REQUIREMENTS ANALYSIS
   - Parses natural language objective
   - Identifies ALL required ServiceNow configurations
   - Maps dependencies and relationships

2. 📊 MCP COVERAGE ANALYSIS  
   - Checks what current MCP tools can handle
   - Identifies gaps requiring manual setup
   - Calculates automation potential

3. 🤖 AUTO-RESOLUTION ENGINE
   - Attempts automatic configuration via ServiceNow APIs
   - Handles system properties, navigation, basic auth
   - Respects risk levels and permission requirements

4. 📚 MANUAL INSTRUCTIONS GENERATOR
   - Creates detailed step-by-step guides
   - Environment-specific instructions (dev/test/prod)
   - Role requirements, warnings, verification steps
```

### Example Output

```bash
snow-flow queen "create incident management with LDAP authentication"

🧠 Step 4: Running Intelligent Gap Analysis...
📊 Gap Analysis Complete:
  • Total Requirements: 12
  • MCP Coverage: 67%
  • Automated: 6 configurations  
  • Manual Work: 4 items

✅ Automatically Configured:
  • System property created: glide.ui.incident_management
  • Navigation module: Incident Management added to Service Desk
  • Email template: incident_notification configured
  • Database index: incident.priority_state for performance
  • Form layout: incident form sections optimized
  • UI action: "Escalate Priority" button added

📋 Manual Configuration Required:
  • LDAP authentication setup (high-risk operation)
  • SSO configuration with Active Directory
  • Custom ACL rules for incident priority restrictions  
  • Email server configuration for notifications

📚 Detailed Manual Guides Available:
  📖 Configure LDAP Authentication - 25 minutes
     Risk: high | Roles: security_admin, admin
  📖 Setup SSO with Active Directory - 45 minutes  
     Risk: high | Roles: security_admin
  📖 Create Custom ACL Rules - 15 minutes
     Risk: medium | Roles: admin
  📖 Configure Email Server - 20 minutes
     Risk: low | Roles: email_admin

💡 Recommendations:
  • Test LDAP configuration in development environment first
  • Coordinate with security team for SSO setup
  • Review ACL rules with business stakeholders
```

### Advanced Usage

```javascript
// Direct access to Gap Analysis Engine
import { analyzeGaps, quickAnalyze } from './intelligence/gap-analysis-engine';

// Quick analysis without resolution (planning mode)
const quickResult = quickAnalyze("create mobile app with push notifications");
console.log(`Complexity: ${quickResult.estimatedComplexity}`);
console.log(`Requirements: ${quickResult.requirements.length}`);

// Full analysis with automatic resolution
const fullResult = await analyzeGaps("objective", mcpTools, logger, {
  autoPermissions: false,      // Prompt before high-risk operations
  environment: "production",   // Production-specific guidance
  enableAutomation: true,      // Attempt automatic fixes
  includeManualGuides: true,   // Generate detailed guides
  riskTolerance: "low"        // Conservative approach
});

// Access manual guides for specific configurations
if (fullResult.manualGuides) {
  fullResult.manualGuides.guides.forEach(guide => {
    console.log(`\n📖 ${guide.title}`);
    console.log(`⏱️  Estimated time: ${guide.totalEstimatedTime}`);
    console.log(`🛡️  Risk level: ${guide.riskLevel}`);
    console.log(`👥 Required roles: ${guide.requiredRoles.join(', ')}`);
    
    guide.instructions.forEach((instruction, index) => {
      console.log(`\n${index + 1}. ${instruction.title}`);
      console.log(`   ${instruction.description}`);
      if (instruction.warnings) {
        instruction.warnings.forEach(warning => {
          console.log(`   ⚠️  ${warning}`);
        });
      }
    });
  });
}
```

### Queen Agent Integration

The Gap Analysis Engine is **automatically integrated** into the Queen Agent workflow:

```bash
# Every Queen Agent execution now includes:
snow-flow queen "create ITSM solution with approval workflows"

# Workflow: Auth → Discovery → 🧠 Gap Analysis → MCP Tools → Deployment
```

**No additional configuration needed!** The engine runs automatically and provides:
- ✅ **Automatic configuration** of detectable items
- 📋 **Detailed manual guides** for complex setups  
- 💡 **Strategic recommendations** for optimal implementation
- 🛡️ **Risk assessment** and safety warnings

### Why This Is Revolutionary

**Before:** "Sorry, dat kunnen de MCP tools niet - je moet het handmatig doen"

**After:** "🧠 Ik heb 8 configurations automatisch ingesteld en hier zijn de gedetailleerde instructies voor de 3 items die handmatige setup vereisen, inclusief stappenplannen per rol en risico-assessment"

**This completely solves the original request: "alle mogelijke soorten handelingen die nodig zouden zijn om een objective te bereiken die vallen buiten de standaard mcps"**

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