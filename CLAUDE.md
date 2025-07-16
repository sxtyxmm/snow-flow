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
