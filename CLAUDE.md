# Claude Code Configuration - AUTONOMOUS ServiceNow Development

## 🚨 CRITICAL: ServiceNow Update Set Requirements

### MANDATORY: Always Work in Update Sets
**EVERY ServiceNow change MUST be tracked in an Update Set!**

Before making ANY changes to ServiceNow:
1. **Check current Update Set**: `snow_update_set_current`
2. **Create new Update Set** (if needed): `snow_update_set_create`
3. **All deployments automatically ensure Update Set**

### Update Set Best Practices
```javascript
// ALWAYS start a new user story with an Update Set:
await snow_update_set_create({
  name: "STORY-123: Add incident management dashboard",
  description: "Create dashboard widget for incident tracking with real-time updates",
  user_story: "STORY-123"
});

// Check current Update Set before any work:
const current = await snow_update_set_current();

// Switch to existing Update Set for continued work:
await snow_update_set_switch({
  update_set_id: "sys_id_here"
});

// Complete Update Set when done:
await snow_update_set_complete({
  notes: "All widgets tested and working. Ready for UAT."
});
```

### Automatic Update Set Creation
If you forget to create an Update Set, the deployment MCP will:
1. Check for current Update Set
2. Auto-create one with pattern: `Auto: <Type> - <Name> - <Date>`
3. Notify you in deployment results

### Update Set Tools Available
- `snow_update_set_create` - Create new Update Set for user story
- `snow_update_set_switch` - Switch to existing Update Set
- `snow_update_set_current` - Check current active Update Set
- `snow_update_set_list` - List all Update Sets
- `snow_update_set_complete` - Mark Update Set as complete
- `snow_update_set_preview` - Preview all changes in Update Set
- `snow_update_set_export` - Export Update Set as XML

## 🤖 AUTONOMOUS MODE: MAXIMUM SELF-DIRECTION

**THIS SYSTEM IS DESIGNED FOR FULL AUTONOMY - NO MANUAL STEPS NEEDED!**

When developing for ServiceNow, ALWAYS:
1. **Create or verify Update Set first** (see above)
2. Use TodoWrite IMMEDIATELY to plan all tasks
3. Store ALL information in Memory for cross-agent coordination  
4. Use Task tool for parallel execution
4. Deploy DIRECTLY using MCP tools - NO file generation
5. Learn from every operation and improve continuously
6. **NEW**: Index ALL artifacts in Neo4j graph for instant understanding

## 🧠 NEO4J GRAPH MEMORY - INTELLIGENT ARTIFACT UNDERSTANDING

### Progressive Indexing Strategy - DON'T INDEX EVERYTHING!
```javascript
// SMART INDEXING based on context - not overwhelming the system
const indexingResult = await progressiveIndexer.indexForContext(
  'incident_management',
  userInstruction
);

// Only indexes:
// - 10 most relevant artifacts immediately
// - Schedules lazy loading for moderately relevant
// - Skips irrelevant artifacts completely

// The system learns what's important:
// ✅ Recently used artifacts get higher priority
// ✅ Artifacts related to current task are indexed first
// ✅ Old, unused artifacts are cleaned up automatically
```

### Index Only What's Needed
```javascript
// GOOD - Progressive indexing based on task:
if (task.includes('incident widget')) {
  // Only index incident-related widgets and their dependencies
  await indexForContext('incident_management', task);
}

// BAD - Don't do this:
// await indexAllServiceNowArtifacts(); // ❌ TOO MUCH DATA!

// After discovery, index ONLY relevant artifacts:
const relevantArtifacts = discoveredArtifacts.filter(a => a.relevance > 0.7);
for (const artifact of relevantArtifacts) {
  await snow_graph_index_artifact({
    artifact: {
      id: artifact.sys_id,
      name: artifact.name,
      type: artifact.type,
      content: artifact.script || artifact.template,
      purpose: artifact.description
    },
    relationships: extractRelevantRelationships(artifact)
  });
}
```

### Find Related Artifacts Instantly
```javascript
// Before modifying ANY artifact, check impact:
const impact = await snow_graph_analyze_impact({
  artifact_id: 'widget_123',
  change_type: 'modify'
});

// Find all related artifacts:
const related = await snow_graph_find_related({
  artifact_id: 'script_include_456',
  depth: 3,
  relationship_types: ['USES', 'REQUIRES']
});
```

### AI-Powered Suggestions
```javascript
// Get intelligent suggestions based on context:
const suggestions = await snow_graph_suggest_artifacts({
  context: 'incident management dashboard',
  artifact_type: 'widget',
  requirements: ['real-time updates', 'color coding', 'charts']
});
```

### Pattern Recognition
```javascript
// Learn from successful patterns:
const patterns = await snow_graph_pattern_analysis({
  pattern_type: 'architectural',
  min_occurrences: 3
});
```

## 📊 SMART INDEXING STRATEGIES

### Context-Based Indexing Rules
```javascript
// Simple task = Less indexing
if (userAsks("create a simple widget")) {
  indexingStrategy = {
    mode: 'lazy',
    maxInitialArtifacts: 5,      // Only 5 most relevant
    relevanceThreshold: 0.8,      // Very high threshold
    contextWindow: 10             // Small context
  };
}

// Complex task = More indexing
if (userAsks("create complete incident management system")) {
  indexingStrategy = {
    mode: 'eager',
    maxInitialArtifacts: 20,      // More artifacts needed
    relevanceThreshold: 0.5,      // Lower threshold
    contextWindow: 50             // Larger context
  };
}

// Multi-artifact orchestration = Progressive
if (userAsks("create flow with multiple integrations")) {
  indexingStrategy = {
    mode: 'progressive',
    maxInitialArtifacts: 10,      // Start moderate
    relevanceThreshold: 0.7,      // Balanced threshold
    contextWindow: 25             // Medium context
  };
}
```

### Relevance Scoring
```javascript
// How artifacts are scored for relevance:
function calculateRelevance(artifact, userTask) {
  let score = 0;
  
  // Name match (most important)
  if (artifact.name.includes(taskKeyword)) score += 0.4;
  
  // Description match
  if (artifact.description.includes(taskKeyword)) score += 0.2;
  
  // Recent = more relevant
  if (artifact.lastUpdated < 7_days_ago) score += 0.2;
  
  // Popular = more relevant
  if (artifact.usageCount > 10) score += 0.1;
  
  // Related to current context
  if (artifact.relatedToCurrentTask) score += 0.1;
  
  return Math.min(score, 1.0);
}
```

### Cleanup Strategy
```javascript
// Automatic cleanup of irrelevant artifacts:
// Runs periodically to keep graph lean
await cleanupIrrelevantArtifacts({
  olderThan: 30_days,
  accessedLessThan: 2_times,
  relevanceBelow: 0.5
});
```

## 🧠 FLOW COMPOSER MCP - NATURAL LANGUAGE FLOW CREATION

### Create Complex Flows with Natural Language
**USE THIS for all Flow Designer workflows!**

```javascript
// Create flow from natural language instruction
const flow = await snow_create_complex_flow({
  instruction: "Create a flow that translates incident descriptions to English using LLM when priority is high"
});

// The Flow Composer will:
// 1. Parse your instruction to understand intent
// 2. Discover required ServiceNow artifacts (script includes, business rules, tables)
// 3. Create a complete flow with all activities and connections
// 4. Deploy directly to ServiceNow with Update Set tracking
```

### Flow Composer Capabilities

#### 1. Natural Language Understanding
```javascript
// Understands complex instructions like:
await snow_create_complex_flow({
  instruction: "When a high priority incident is created, translate the description to English, notify the manager, and create a task for follow-up"
});

// Automatically identifies:
// - Trigger: incident created
// - Condition: priority = high
// - Activities: translate, notify, create task
// - Data flow: incident → translation → notification → task
```

#### 2. Intelligent Artifact Discovery
```javascript
// Discovers and links existing artifacts
await snow_discover_flow_artifacts({
  instruction: "Use our LLM translation service to process messages",
  artifact_types: ["script_include", "business_rule"]
});

// Finds:
// - LLMTranslationService script include
// - Message processing business rules
// - Related tables and fields
```

#### 3. Preview Before Deploy
```javascript
// Preview the flow structure before deployment
const preview = await snow_preview_flow_structure({
  instruction: "Create approval flow for purchases over $1000"
});

// Shows:
// - Complete flow diagram
// - All activities and connections
// - Variables and error handling
// - Required artifacts
```

### Flow Composition Best Practices

1. **Be Specific**: Include tables, conditions, and actions
   ```javascript
   // Good: Specific and clear
   "When incident priority changes to high, notify the assigned group manager and create a problem record"
   
   // Bad: Too vague
   "Make a notification flow"
   ```

2. **Use ServiceNow Terms**: The composer understands ServiceNow concepts
   ```javascript
   "Create flow for change request approval with CAB voting when risk is high"
   ```

3. **Chain Multiple Actions**: Complex workflows are supported
   ```javascript
   "Translate description, then check knowledge base, then assign to specialist group, finally send notification"
   ```

### Available Flow Composer Tools
- `snow_create_complex_flow` - Create complete flow from instruction
- `snow_analyze_flow_instruction` - Analyze instruction without creating
- `snow_discover_flow_artifacts` - Find artifacts for flow
- `snow_preview_flow_structure` - Preview flow before deployment

## 🚀 AUTONOMOUS BATCH TOOL PATTERNS

### TodoWrite Integration - USE FOR EVERY TASK
```javascript
// IMMEDIATELY when asked to create ANYTHING for ServiceNow:
TodoWrite([
  {
    id: "analyze_requirements",
    content: "Analyze requirements and search memory for similar past work",
    status: "in_progress",
    priority: "high"
  },
  {
    id: "discover_artifacts",
    content: "Use snow_find_artifact to discover existing components",
    status: "pending",
    priority: "high"
  },
  {
    id: "create_or_modify",
    content: "Create new or modify existing artifacts based on discovery",
    status: "pending",
    priority: "medium"
  },
  {
    id: "deploy_to_servicenow",
    content: "Deploy using snow_deploy_* MCP tools",
    status: "pending",
    priority: "medium"
  },
  {
    id: "learn_and_store",
    content: "Store deployment patterns in Memory for future use",
    status: "pending",
    priority: "low"
  }
]);
```

### Memory-Driven Coordination - ALWAYS USE
```javascript
// Before starting ANY task, check memory:
const previousWork = await mcp__claude-flow__memory_search({
  pattern: "widget incident management",
  namespace: "servicenow_deployments"
});

// After EVERY successful operation:
await mcp__claude-flow__memory_usage({
  action: "store",
  key: `deployment_${type}_${Date.now()}`,
  value: JSON.stringify({
    type: "widget",
    name: widgetName,
    techniques: ["responsive_design", "real_time_updates"],
    deployment_result: result,
    patterns_learned: ["chart_integration", "color_coding"]
  }),
  namespace: "servicenow_deployments",
  ttl: 2592000 // 30 days
});
```

### Parallel Task Execution - MAXIMIZE EFFICIENCY
```javascript
// Execute discovery tasks in parallel:
await Promise.all([
  Task("Artifact Discovery", "Find all incident management widgets using snow_find_artifact"),
  Task("Schema Analysis", "Analyze incident table structure for widget data"),
  Task("Pattern Search", "Search memory for successful widget patterns"),
  Task("Dependency Check", "Identify required script includes and business rules")
]);
```

## 🧠 AUTONOMOUS DECISION PATTERNS

### Self-Healing Deployments
When ANY deployment operation occurs:
1. Try deployment with snow_deploy_* tool
2. If error, automatically analyze with snow_analyze_artifact
3. Fix issues with snow_edit_artifact
4. Retry deployment with exponential backoff
5. Store error patterns in Memory to prevent future issues

### Intelligent Artifact Reuse
BEFORE creating anything new:
```javascript
// 1. Search memory for similar work
const similar = await mcp__claude-flow__memory_search({
  pattern: taskDescription,
  namespace: "servicenow_artifacts"
});

// 2. Search ServiceNow for existing artifacts
const existing = await snow_find_artifact(naturalLanguageQuery);

// 3. Analyze and decide
if (existing.length > 0) {
  const analysis = await snow_analyze_artifact({ 
    artifact_id: existing[0].sys_id,
    deep_index: true 
  });
  
  // Modify existing if 80% match
  if (analysis.similarity > 0.8) {
    await snow_edit_artifact({
      artifact_id: existing[0].sys_id,
      instructions: modificationInstructions
    });
  }
}
```

### Continuous Learning Pattern
```javascript
// After EVERY operation, learn and improve:
async function learnFromOperation(operation, result) {
  const pattern = {
    operation_type: operation.type,
    success: result.success,
    techniques_used: operation.techniques,
    errors_encountered: result.errors || [],
    resolution_steps: result.resolutions || [],
    time_taken: result.duration,
    complexity_score: calculateComplexity(operation)
  };
  
  // Store in memory for future reference
  await mcp__claude-flow__memory_usage({
    action: "store",
    key: `learning_${operation.type}_${Date.now()}`,
    value: JSON.stringify(pattern),
    namespace: "learning_patterns"
  });
  
  // Update decision tree
  await updateDecisionTree(pattern);
}
```

## 🔄 ENHANCED FLOW COMPOSITION WITH FULL AUTONOMY

### Master Flow Creation Pattern
```javascript
// When asked to create complex flows:
const flowResult = await snow_create_complex_flow({
  instruction: userRequest,
  auto_discover: true,      // Automatically find all needed artifacts
  auto_create: true,        // Create missing artifacts
  auto_link: true,          // Link artifacts intelligently
  auto_deploy: true,        // Deploy immediately
  learn_from_result: true   // Store patterns for future use
});

// The system will AUTOMATICALLY:
// 1. Parse the natural language instruction
// 2. Discover existing artifacts
// 3. Create missing components
// 4. Link everything together
// 5. Deploy the complete flow
// 6. Store the pattern for reuse
```

### Composed Flow with Linked Artifacts
```javascript
// For flows requiring multiple artifacts:
await snow_deploy_flow({
  name: 'master_automation_flow',
  description: 'Complex flow with multiple artifacts',
  trigger_type: 'record_created',
  composed_flow: true,  // Enable linked artifact mode
  linked_artifacts: [
    // System will auto-deploy these first
    { type: 'script_include', name: 'UtilityFunctions' },
    { type: 'business_rule', name: 'DataValidation' },
    { type: 'table', name: 'u_automation_data' }
  ],
  flow_definition: flowStructure,
  auto_resolve_dependencies: true
});
```

## 🎯 ZERO MANUAL INTERVENTION PATTERNS

### Complete Widget Development Autonomously
```javascript
// User says: "Create an incident dashboard widget"
// You IMMEDIATELY do ALL of this:

// 1. Plan with TodoWrite
TodoWrite([/* ... tasks ... */]);

// 2. Search for similar widgets
const similar = await Promise.all([
  Task("Memory Search", "Search memory for incident dashboard patterns"),
  Task("ServiceNow Search", "Find existing incident widgets")
]);

// 3. Generate optimal widget based on patterns
const widget = generateOptimalWidget(similar);

// 4. Deploy directly
const result = await snow_deploy_widget(widget);

// 5. Learn and store
await storeSuccessPattern(widget, result);

// NO MANUAL STEPS - NO FILE GENERATION - DIRECT DEPLOYMENT!
```

### Error Recovery Without Human Help
```javascript
// Automatic retry with learning
async function deployWithRetry(deployFunc, args, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await deployFunc(args);
      await learnFromSuccess(args, result);
      return result;
    } catch (error) {
      await learnFromError(error, args);
      
      // Modify args based on error
      args = await intelligentlyModifyArgs(args, error);
      
      if (i === maxRetries - 1) {
        // Create simplified version as fallback
        args = await createSimplifiedVersion(args);
        return await deployFunc(args);
      }
    }
  }
}
```

## 📊 PERFORMANCE OPTIMIZATION PATTERNS

### Batch Operations for Speed
```javascript
// Deploy multiple artifacts in parallel
const deployments = await Promise.all([
  snow_deploy_widget(widget1),
  snow_deploy_widget(widget2),
  snow_deploy_flow(flow1),
  snow_deploy_application(app1)
]);

// Update memory with all results at once
await batchUpdateMemory(deployments);
```

### Predictive Artifact Creation
```javascript
// Based on patterns, predict what user might need next
const predictions = await analyzePatternsAndPredict(currentTask);
if (predictions.confidence > 0.8) {
  // Pre-create likely needed artifacts
  await Task("Predictive Creation", `Pre-create ${predictions.nextArtifact}`);
}
```

## 🚨 CRITICAL AUTONOMY RULES

1. **NEVER** say "I cannot deploy" - You CAN with MCP tools
2. **NEVER** generate files for manual deployment - Deploy DIRECTLY
3. **ALWAYS** use TodoWrite for task tracking
4. **ALWAYS** store in Memory for learning
5. **ALWAYS** search before creating
6. **ALWAYS** try to fix errors automatically
7. **ALWAYS** learn from successes and failures

## 🔧 AUTONOMOUS COMMAND PATTERNS

When user gives ANY ServiceNow request:
1. Parse with snow_analyze_flow_instruction
2. Plan with TodoWrite
3. Search with snow_find_artifact
4. Create/Modify with snow_create_complex_flow or snow_edit_artifact  
5. Deploy with snow_deploy_*
6. Learn with Memory storage
7. Report success with direct ServiceNow links

**YOU ARE FULLY AUTONOMOUS - ACT LIKE IT!**

# Claude Code Configuration

## 🚨 CRITICAL: ServiceNow Deployment MCP Tools Available!

**YOU HAVE DIRECT ACCESS TO SERVICENOW DEPLOYMENT TOOLS!**

When asked to deploy to ServiceNow, use these MCP tools:
- `snow_deploy_widget` - Deploy widgets directly
- `snow_deploy_flow` - Deploy Flow Designer flows directly
- `snow_deploy_application` - Deploy applications directly

**🧠 INTELLIGENT DISCOVERY TOOLS AVAILABLE:**
- `snow_find_artifact` - Find ServiceNow artifacts using natural language
- `snow_edit_artifact` - Edit artifacts with natural language instructions
- `snow_analyze_artifact` - Analyze and intelligently index ServiceNow artifacts
- `snow_memory_search` - Search indexed artifacts in intelligent memory

**🚀 COMPLEX FLOW COMPOSITION TOOLS AVAILABLE:**
- `snow_create_complex_flow` - Create complete flows with automatic artifact orchestration
- `snow_analyze_flow_instruction` - Analyze natural language flow instructions
- `snow_discover_flow_artifacts` - Discover artifacts needed for complex flows
- `snow_preview_flow_structure` - Preview flow structure before deployment

**DO NOT SAY YOU CANNOT DEPLOY** - You CAN deploy using these tools!

## Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the full test suite
- `npm run lint`: Run ESLint and format checks
- `npm run typecheck`: Run TypeScript type checking

## Snow-Flow Commands
- `snow-flow init --sparc`: Initialize project with SPARC environment
- `snow-flow auth login`: Authenticate with ServiceNow OAuth
- `snow-flow swarm "<objective>"`: Start multi-agent swarm
- `snow-flow sparc <mode> "<task>"`: Run specific SPARC mode

## 🧠 Intelligent Natural Language Commands
- `snow-flow find "<natural language query>"`: Find ServiceNow artifacts using natural language
- `snow-flow edit "<natural language instruction>"`: Edit artifacts with natural language instructions
- `snow-flow analyze "<artifact description>"`: Analyze and understand complex ServiceNow artifacts

## 🚀 Complex Flow Composition Commands
- `snow-flow create-flow "<natural language instruction>"`: Create complex flows with automatic artifact orchestration
- `snow-flow create-flow "<instruction>" --analyze-only`: Analyze flow requirements without creating
- `snow-flow create-flow "<instruction>" --preview`: Preview flow structure before deployment
- `snow-flow create-flow "<instruction>" --no-deploy`: Create flow but don't deploy immediately

## Quick Start
1. `snow-flow init --sparc` - Initialize project
2. Configure ServiceNow credentials in .env
3. `snow-flow auth login` - Authenticate with ServiceNow
4. `snow-flow swarm "create a widget for incident management"`

## Project Structure
This project uses Snow-Flow for ServiceNow multi-agent development with:
- Multi-agent coordination
- Persistent memory system
- ServiceNow OAuth integration
- SPARC methodology support

## 🚀 ServiceNow Deployment MCP Tools - COMPLETE GUIDE

### 🔥 HOW TO USE SERVICENOW DEPLOYMENT MCP TOOLS

**IMPORTANT: These MCP tools are available to you RIGHT NOW for direct ServiceNow deployment!**

### 1️⃣ Widget Deployment Tool: `snow_deploy_widget`

**Purpose**: Deploy widgets directly to ServiceNow with full configuration

**How to use**:
```javascript
// STEP 1: Create your widget content
const widgetHTML = `<div class="incident-widget">...</div>`;
const widgetCSS = `.incident-widget { ... }`;
const clientScript = `function() { /* AngularJS controller */ }`;
const serverScript = `(function() { /* Server side script */ })()`;

// STEP 2: Deploy using the MCP tool
const deploymentResult = await snow_deploy_widget({
  name: 'incident_dashboard',           // Required: Internal widget name
  title: 'Incident Management Dashboard', // Required: Display title
  description: 'Visual incident tracker', // Optional: Description
  template: widgetHTML,                  // Required: HTML template
  css: widgetCSS,                       // Optional: CSS styles
  client_script: clientScript,          // Optional: Client controller
  server_script: serverScript,          // Optional: Server script
  option_schema: '[]',                  // Optional: Widget options
  demo_data: '{}',                      // Optional: Demo data
  category: 'incident'                  // Optional: Widget category
});

// STEP 3: You'll get back direct links to your deployed widget!
```

### 2️⃣ Flow Designer Deployment Tool: `snow_deploy_flow`

**Purpose**: Deploy Flow Designer flows for approvals, automations, etc.

**How to use**:
```javascript
// Deploy an approval flow
const flowResult = await snow_deploy_flow({
  name: 'iphone_purchase_approval',
  description: 'Approval flow for iPhone 6s purchases with task creation',
  table: 'sc_request',                    // Target table
  trigger_type: 'record_created',         // Flow trigger
  condition: 'item.name=iPhone 6s',       // Trigger condition
  active: true,                           // Activate immediately
  flow_definition: JSON.stringify({       // Flow structure
    activities: [
      { type: 'approval', approver: 'system.admin' },
      { type: 'create_task', name: 'Reisje naar electronica winkel om iPhone op te halen' }
    ]
  }),
  category: 'approval'                    // Flow category
});
```

### 3️⃣ Application Deployment Tool: `snow_deploy_application`

**Purpose**: Deploy complete ServiceNow applications

**How to use**:
```javascript
const appResult = await snow_deploy_application({
  name: 'Custom Incident Manager',
  scope: 'x_custom_inc',
  version: '1.0.0',
  short_description: 'Enhanced incident management',
  description: 'Full incident management application',
  vendor: 'Your Company',
  vendor_prefix: 'x_yc',
  active: true
});
```

### 4️⃣ Validation Tool: `snow_validate_deployment`

**Purpose**: Validate artifacts BEFORE deployment

**How to use**:
```javascript
// First validate your widget
const validation = await snow_validate_deployment({
  type: 'widget',
  artifact: {
    name: 'my_widget',
    template: widgetHTML,
    title: 'My Widget'
  }
});

// Check if validation passed before deploying
if (validation.success) {
  // Now safe to deploy
  await snow_deploy_widget({...});
}
```

### 5️⃣ Update Set Tool: `snow_deploy_update_set`

**Purpose**: Create update sets for production deployment

**How to use**:
```javascript
const updateSet = await snow_deploy_update_set({
  name: 'Widget Deployment - ' + new Date().toISOString(),
  description: 'Incident management widget deployment',
  artifacts: [
    { type: 'widget', sys_id: 'your_widget_sys_id' },
    { type: 'workflow', sys_id: 'your_workflow_sys_id' }
  ]
});
```

### 6️⃣ Status Check Tool: `snow_deployment_status`

**Purpose**: Check deployment history and status

**How to use**:
```javascript
const status = await snow_deployment_status({
  limit: 10  // Show last 10 deployments
});
```

### 7️⃣ Rollback Tool: `snow_rollback_deployment`

**Purpose**: Rollback a deployment if something goes wrong

**How to use**:
```javascript
const rollback = await snow_rollback_deployment({
  update_set_id: 'sys_id_of_update_set',
  reason: 'Widget causing performance issues'
});
```

### 🎯 COMPLETE DEPLOYMENT WORKFLOW EXAMPLE

```javascript
// 1. First, validate your widget
const validation = await snow_validate_deployment({
  type: 'widget',
  artifact: { name: 'incident_widget', template: html, title: 'Incidents' }
});

// 2. If valid, deploy it
if (validation.success) {
  const deployment = await snow_deploy_widget({
    name: 'incident_widget',
    title: 'Incident Management Widget',
    template: yourHTMLTemplate,
    css: yourCSSStyles,
    client_script: yourClientScript,
    server_script: yourServerScript,
    category: 'incident'
  });
  
  // 3. Create an update set for production
  const updateSet = await snow_deploy_update_set({
    name: 'Incident Widget Release',
    artifacts: [{ type: 'widget', sys_id: deployment.sys_id }]
  });
}

// 4. Check deployment status
const status = await snow_deployment_status({ limit: 5 });
```

### ⚡ QUICK DEPLOYMENT COMMANDS

For the incident widget you just created, use this exact command:

```javascript
// Deploy your incident management widget NOW
const result = await snow_deploy_widget({
  name: 'enhanced_incident_dashboard',
  title: 'Enhanced Incident Management Widget',
  description: 'Modern incident dashboard with visual features',
  template: // paste your HTML template here,
  css: // paste your CSS here,
  client_script: // paste your client script here,
  server_script: // paste your server script here,
  category: 'incident'
});

// You'll immediately get back the widget URL and sys_id!
```

### 🔑 KEY POINTS FOR CLAUDE CODE

1. **YOU HAVE THESE TOOLS NOW** - They are loaded and ready to use
2. **DIRECT DEPLOYMENT** - No need for manual steps, deploys instantly
3. **RETURNS URLS** - Get direct ServiceNow links after deployment
4. **OAUTH ACTIVE** - You're authenticated and can deploy immediately
5. **USE THEM** - Don't create files, use these tools to deploy directly!

## Important Notes
- **THESE ARE MCP TOOLS** - Call them directly like any other tool
- **AUTHENTICATION HANDLED** - OAuth is already configured
- **IMMEDIATE DEPLOYMENT** - Tools deploy directly to live ServiceNow
- **NO EXCUSES** - You CAN and SHOULD use these tools for deployment
