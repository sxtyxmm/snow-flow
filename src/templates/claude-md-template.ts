export const CLAUDE_MD_TEMPLATE = `# Snow-Flow Configuration & Best Practices

This document provides comprehensive instructions for Snow-Flow, an advanced ServiceNow development and orchestration framework powered by Claude AI.

## 🚨 ABSOLUTE RULE #1: NO MOCK DATA, NO PLACEHOLDERS, NO SHORTCUTS! 🚨

### **EVERYTHING MUST BE REAL, COMPLETE, AND PRODUCTION-READY**

**⛔ ABSOLUTELY FORBIDDEN:**
- ❌ NO mock data, test data, or demo data
- ❌ NO placeholder code or stub implementations
- ❌ NO "TODO" comments or incomplete sections
- ❌ NO simulated responses or fake results
- ❌ NO shortcuts, quick fixes, or temporary solutions
- ❌ NO "this would normally..." explanations
- ❌ NO partial implementations or "proof of concepts"
- ❌ NO hardcoded test values or example data

**✅ MANDATORY REQUIREMENTS:**
- ✅ EVERY implementation must be COMPLETE and FUNCTIONAL
- ✅ ALL code must be PRODUCTION-READY
- ✅ TAKE THE TIME to write EVERYTHING properly
- ✅ IMPLEMENT all error handling, validation, and edge cases
- ✅ CREATE actual working solutions, not demonstrations
- ✅ BUILD real integrations, not simulations
- ✅ DEVELOP complete features, not prototypes
- ✅ DELIVER finished products, not drafts

**📝 Quality Standards:**
1. **Complete Implementation** - Every feature fully implemented with all functionality
2. **Real Data Operations** - Actual ServiceNow API calls with real responses
3. **Comprehensive Error Handling** - All edge cases covered, all errors handled
4. **Production-Grade Code** - Clean, maintainable, documented, tested
5. **Full Validation** - Input validation, data verification, coherence checking
6. **Actual Integration** - Real connections to ServiceNow, no mocked services
7. **Thorough Testing** - Complete test coverage, not just happy path
8. **Professional Documentation** - Detailed, accurate, complete documentation

**🎯 The Snow-Flow Commitment:**
When implementing ANY feature, no matter how complex or time-consuming:
- INVEST the time to do it RIGHT
- WRITE every line of code needed
- IMPLEMENT every validation required
- HANDLE every possible error
- CREATE comprehensive solutions
- BUILD production-ready systems
- DELIVER professional results

**Remember:** Users depend on Snow-Flow for REAL production ServiceNow environments. 
There is NO room for shortcuts, placeholders, or incomplete implementations.
Every line of code matters. Every feature must work. Every implementation must be complete.

**TAKE THE TIME. DO IT RIGHT. NO EXCEPTIONS.**

---

## Table of Contents
1. [Core Philosophy](#core-philosophy)
2. [Fundamental Rules](#fundamental-rules)
3. [ServiceNow Development Standards](#servicenow-development-standards)
4. [MCP Server Capabilities](#mcp-server-capabilities)
5. [Debugging Best Practices](#debugging-best-practices)
6. [Command Reference](#command-reference)
7. [Workflow Guidelines](#workflow-guidelines)

## CRITICAL: Widget Debugging Must Use Local Sync

### 🔴 When User Reports Widget Issues, ALWAYS Use \`snow_pull_artifact\` FIRST!

**Common scenarios that REQUIRE Local Sync:**
- "Widget skips questions" → \`snow_pull_artifact\`
- "Form doesn't submit properly" → \`snow_pull_artifact\`
- "Data not displaying" → \`snow_pull_artifact\`
- "Button doesn't work" → \`snow_pull_artifact\`
- "Debug this widget" → \`snow_pull_artifact\`
- "Fix widget issue" → \`snow_pull_artifact\`

**DO NOT use \`snow_query_table\` for widget debugging!** It will hit token limits and you can't use native search/edit tools.

## Core Philosophy

### The Prime Directive: Verify, Don't Assume

Snow-Flow operates on evidence-based development. Never make assumptions about what exists or doesn't exist in a ServiceNow environment. Every environment is unique with custom tables, fields, integrations, and configurations that you cannot predict.

**Cardinal Rules:**
1. If code references something, it probably exists
2. Test before declaring something broken
3. Verify before modifying
4. Fix only what's confirmed broken
5. Respect existing configurations

### The Verification-First Approach

\`\`\`javascript
// Before claiming anything doesn't work or exist:
// Step 1: Test the actual implementation - COMPLETE TEST, NO MOCK
const verify = await snow_execute_script_with_output({
  script: \`
    // REAL verification code - NO placeholders
    var gr = new GlideRecord('actual_table_name');
    gr.addQuery('active', true);
    gr.query();
    var count = 0;
    while (gr.next()) {
      count++;
      gs.info('Record found: ' + gr.getDisplayValue());
    }
    gs.info('Total records: ' + count);
  \`
});

// Step 2: Check if resources exist - ACTUAL CHECK, NO ASSUMPTIONS
const tableCheck = await snow_discover_table_fields({
  table_name: 'potentially_custom_table'
});

// Step 3: Validate configurations - REAL VALIDATION
const propertyCheck = await snow_property_manager({
  action: 'get',
  name: 'system.property'
});

// Step 4: Only then make informed decisions based on REAL DATA
\`\`\`

### 🔄 CRITICAL: Sync User Modifications Before Working

**When a user mentions they've modified an artifact directly in ServiceNow, ALWAYS fetch the latest version first!**

If a user says any of these:
- "I've updated the widget in ServiceNow"
- "I made some changes to the flow"
- "I modified the script"
- "I adjusted the configuration"
- "Ik heb het zelf aangepast" (Dutch: I adjusted it myself)

**YOU MUST:**

1. **Immediately fetch the current version from ServiceNow:**
\`\`\`javascript
// For any artifact the user has modified
const currentVersion = await snow_query_table({
  table: 'artifact_table_name',
  query: \`sys_id=\${artifact_sys_id}\`,
  fields: ['*'],  // Get all fields
  limit: 1
});

// Or for widgets specifically
const widgetData = await snow_query_table({
  table: 'sp_widget',
  query: \`sys_id=\${widget_sys_id}\`,
  fields: ['name', 'template', 'client_script', 'script', 'css', 'option_schema'],
  limit: 1
});

// Or use snow_get_by_sysid for comprehensive retrieval
const artifact = await snow_get_by_sysid({
  table: 'table_name',
  sys_id: 'the_sys_id'
});
\`\`\`

2. **Analyze the user's modifications:**
   - Review what they changed
   - Understand their intent
   - Preserve their modifications

3. **Build upon their changes:**
   - Don't overwrite their work
   - Integrate new features with their modifications
   - Maintain their code style and patterns

4. **Inform the user:**
   - Acknowledge that you've fetched their latest changes
   - Summarize what modifications you found
   - Explain how you'll build upon their work

**Example Workflow:**
\`\`\`javascript
// User: "I've updated the widget to add a loading spinner"
// Snow-Flow response:

// 1. Fetch current version
const widget = await snow_query_table({
  table: 'sp_widget',
  query: \`sys_id=\${widgetSysId}\`,
  fields: ['*'],
  limit: 1
});

// 2. Analyze changes
console.log("✅ Fetched your latest widget version from ServiceNow");
console.log("📝 I see you've added a loading spinner in the template");

// 3. Work with the updated version
// ... make additional changes based on user's modifications ...
\`\`\`

**Why This Matters:**
- User modifications are not tracked locally
- Working with outdated versions causes conflicts
- User's work could be lost if not synced
- Builds trust by respecting user's contributions
- Ensures coherent development flow

## Fundamental Rules

### Rule 1: 🚨 ES5 JavaScript ONLY in ServiceNow - NO EXCEPTIONS!

**⚠️ CRITICAL WARNING: ServiceNow uses Rhino engine - ES6/ES7/ES8+ WILL FAIL!**

ServiceNow's server-side JavaScript runs on Mozilla Rhino which **ONLY supports ES5 (2009)**. Any modern JavaScript syntax will cause **RUNTIME ERRORS**.

**❌ THESE WILL CRASH SERVICENOW (DO NOT USE):**
\`\`\`javascript
// ❌ ES6+ features that BREAK ServiceNow:
const data = [];           // SyntaxError: missing ; after for-loop initializer
let items = [];            // SyntaxError: missing ; after for-loop initializer  
const fn = () => {};       // SyntaxError: syntax error
var msg = \`Hello \${name}\`; // SyntaxError: syntax error
for (let item of items){}  // SyntaxError: missing ; after for-loop initializer
var {name, id} = user;     // SyntaxError: destructuring declaration not supported
array.forEach(x => {});    // SyntaxError: syntax error  
array.map(x => x.id);      // SyntaxError: syntax error
function test(param = 'default') {} // SyntaxError: syntax error
class MyClass {}           // SyntaxError: missing ; after for-loop initializer
\`\`\`

**✅ ONLY USE ES5 SYNTAX (THIS WORKS):**
\`\`\`javascript
// ✅ ES5 compatible code that WORKS in ServiceNow:
var data = [];
var items = [];
function fn() { return 'result'; }
var msg = 'Hello ' + name;
for (var i = 0; i < items.length; i++) {
  var item = items[i];
}
var name = user.name;
var id = user.id;
for (var j = 0; j < array.length; j++) {
  // Process array[j]
}
function test(param) {
  if (typeof param === 'undefined') param = 'default';
}
\`\`\`

**🔥 COMMON MISTAKES THAT BREAK SERVICENOW:**
1. **Arrow Functions**: \`() => {}\` → Use \`function() {}\`
2. **Template Literals**: \`\` \`\${var}\` \`\` → Use \`'text ' + var\`
3. **Let/Const**: \`let x\` → Use \`var x\`
4. **Destructuring**: \`{a, b} = obj\` → Use \`obj.a\`, \`obj.b\`
5. **For...of**: \`for (x of arr)\` → Use \`for (var i=0; i<arr.length; i++)\`
6. **Default Parameters**: \`fn(x='default')\` → Use \`typeof x === 'undefined'\`
7. **Array Methods with Arrows**: \`.map(x => x)\` → Use \`.map(function(x) { return x; })\`

### Rule 2: Background Scripts for Verification Only (Not Widget Updates!)

**CRITICAL DISTINCTION:**
- ✅ Use background scripts for TESTING and VERIFICATION  
- ❌ Do NOT use background scripts to UPDATE widget fields
- ✅ Use \`snow_update\` to directly modify widget records
- ❌ Do NOT try to import server scripts into client scripts via background scripts

**🚨 ES5 ENFORCEMENT FOR BACKGROUND SCRIPTS:**
Background scripts run on ServiceNow's server-side Rhino engine. **EVERY background script MUST be ES5-only or it will fail.**

**Quick ES5 Validation Checklist:**
- [ ] No \`const\` or \`let\` (only \`var\`)
- [ ] No arrow functions \`() => {}\` (only \`function() {}\`)
- [ ] No template literals \`\` \`\${var}\` \`\` (only string concatenation)
- [ ] No destructuring \`{a, b} = obj\` (only explicit \`obj.a\`)
- [ ] No \`for...of\` loops (only traditional \`for\` loops)
- [ ] No default parameters (use \`typeof\` checks)
- [ ] No modern array methods with arrows (use traditional functions)

Background scripts are excellent for verification and debugging, but widget updates must go through proper MCP tools.

**NEW: Auto-Confirm Mode for Background Scripts (v3.4.10+)**
You can now skip the human-in-the-loop confirmation for trusted scripts:

\`\`\`javascript
// Standard mode - requires user confirmation (ES5 ONLY!)
snow_execute_background_script({
  script: "var gr = new GlideRecord('incident'); gr.query();", // ✅ ES5 syntax
  description: "Query incidents",
  allowDataModification: false
});

// Auto-confirm mode - executes immediately ⚠️ USE WITH CAUTION!
snow_execute_background_script({
  script: "var gr = new GlideRecord('incident'); gr.query();", // ✅ ES5 syntax
  description: "Query incidents",
  allowDataModification: false,
  autoConfirm: true  // ⚠️ Bypasses user confirmation!
});

// ❌ WRONG - This will FAIL in ServiceNow:
// script: "const gr = new GlideRecord('incident'); gr.query();", // SyntaxError!
// script: "incidents.forEach(i => console.log(i.number));",      // SyntaxError!
\`\`\`

**🚨 ES5 Validation Required:**
Before using any background script tool, validate your script is ES5-only:
- No \`const\`/\`let\` (use \`var\`)
- No arrow functions (use \`function()\`)
- No template literals (use string concatenation)
- No destructuring (use explicit property access)

**⚠️ Security Warning:**
- Only use \`autoConfirm: true\` for verified, safe scripts
- High-risk operations will still be logged
- All auto-executions are tracked with audit IDs
- Default behavior (without autoConfirm) remains unchanged

## 🚨 CRITICAL: Common ES5 Mistakes That Break ServiceNow

ServiceNow developers frequently use modern JavaScript that fails on the Rhino engine. Here are the most common mistakes:

### 🔥 Top ES5 Violations (Fix These Immediately!)

**1. Arrow Functions with Array Methods**
\`\`\`javascript
// ❌ BREAKS ServiceNow:
var activeIncidents = incidents.filter(inc => inc.active);
var numbers = activeIncidents.map(inc => inc.number);

// ✅ WORKS in ServiceNow:
var activeIncidents = [];
for (var i = 0; i < incidents.length; i++) {
  if (incidents[i].active) {
    activeIncidents.push(incidents[i]);
  }
}
var numbers = [];
for (var j = 0; j < activeIncidents.length; j++) {
  numbers.push(activeIncidents[j].number);
}
\`\`\`

**2. Template Literals for String Building**
\`\`\`javascript
// ❌ BREAKS ServiceNow:
var message = \`Incident \${incident.number} assigned to \${user.name}\`;

// ✅ WORKS in ServiceNow:
var message = 'Incident ' + incident.number + ' assigned to ' + user.name;
\`\`\`

**3. Const/Let Variable Declarations**
\`\`\`javascript
// ❌ BREAKS ServiceNow:
const MAX_RETRIES = 3;
let currentUser = gs.getUser();

// ✅ WORKS in ServiceNow:
var MAX_RETRIES = 3;
var currentUser = gs.getUser();
\`\`\`

**4. Object Destructuring**
\`\`\`javascript
// ❌ BREAKS ServiceNow:
var {name, email, department} = user;
var {sys_id: id, short_description: desc} = incident;

// ✅ WORKS in ServiceNow:
var name = user.name;
var email = user.email;
var department = user.department;
var id = incident.sys_id;
var desc = incident.short_description;
\`\`\`

**5. For...of Loops**
\`\`\`javascript
// ❌ BREAKS ServiceNow:
for (let incident of incidents) {
  gs.info('Processing: ' + incident.number);
}

// ✅ WORKS in ServiceNow:
for (var i = 0; i < incidents.length; i++) {
  gs.info('Processing: ' + incidents[i].number);
}
\`\`\`

**6. Default Function Parameters**
\`\`\`javascript
// ❌ BREAKS ServiceNow:
function processIncident(incident, priority = 3, assignee = 'unassigned') {
  // Process incident
}

// ✅ WORKS in ServiceNow:
function processIncident(incident, priority, assignee) {
  if (typeof priority === 'undefined') priority = 3;
  if (typeof assignee === 'undefined') assignee = 'unassigned';
  // Process incident
}
\`\`\`

### 🎯 Quick ES5 Conversion Guide
| Modern (ES6+) | ES5 Equivalent |
|---------------|----------------|
| \`const x = 5;\` | \`var x = 5;\` |
| \`let items = [];\` | \`var items = [];\` |
| \`() => {}\` | \`function() {}\` |
| \`\` \`Hello \${name}\` \`\` | \`'Hello ' + name\` |
| \`{a, b} = obj\` | \`var a = obj.a; var b = obj.b;\` |
| \`for (item of items)\` | \`for (var i = 0; i < items.length; i++)\` |
| \`func(x = 'default')\` | \`if (typeof x === 'undefined') x = 'default';\` |
| \`arr.map(x => x.id)\` | \`arr.map(function(x) { return x.id; })\` |

\`\`\`javascript
// Universal verification pattern - COMPLETE IMPLEMENTATION REQUIRED
const verify = await snow_execute_script_with_output({
  script: \`
    gs.info('=== VERIFICATION TEST ===');
    
    // Test ACTUAL table existence - NO PLACEHOLDERS
    var incidentTable = new GlideRecord('incident');
    gs.info('Incident table valid: ' + incidentTable.isValid());
    
    // Count REAL records
    incidentTable.addQuery('active', true);
    incidentTable.query();
    var count = 0;
    while (incidentTable.next() && count < 10) {
      count++;
      gs.info('Found: ' + incidentTable.number + ' - ' + incidentTable.short_description);
    }
    gs.info('Total active incidents: ' + incidentTable.getRowCount());
    
    // Test ACTUAL property - use real property names
    var instanceName = gs.getProperty('instance_name');
    var glideVersion = gs.getProperty('glide.version');
    gs.info('Instance: ' + instanceName);
    gs.info('Version: ' + glideVersion);
    
    // Test COMPLETE user code - NO STUBS
    try {
      // REAL implementation - not placeholder
      var userGr = new GlideRecord('sys_user');
      userGr.addQuery('active', true);
      userGr.addQuery('user_name', gs.getUserName());
      userGr.query();
      if (userGr.next()) {
        gs.info('Current user: ' + userGr.name + ' (' + userGr.email + ')');
        gs.info('Roles: ' + userGr.roles.toString());
      }
      
      // Test ACTUAL business logic
      var taskGr = new GlideRecord('task');
      taskGr.addQuery('assigned_to', gs.getUserID());
      taskGr.addQuery('active', true);
      taskGr.query();
      gs.info('Active tasks assigned to me: ' + taskGr.getRowCount());
      
      gs.info('=== VERIFICATION COMPLETE ===');
    } catch(e) {
      gs.error('ERROR: ' + e.message);
      gs.error('Stack: ' + e.stack);
    }
  \`
});
\`\`\`

### Rule 3: Widget Coherence - Critical Client-Server Communication

ServiceNow widgets MUST have perfect communication between client and server scripts. This is not optional - widgets fail when these components don't talk to each other correctly.

**The Three-Way Contract:**

**Server Script Must:**
- Initialize all \`data\` properties that HTML will reference
- Handle every \`input.action\` that client sends
- Return data in the format client expects

**Client Script Must:**
- Implement every method that HTML calls via \`ng-click\`
- Use \`c.server.get({action: 'name'})\` for server communication
- Update \`c.data\` when server responds

**HTML Template Must:**
- Only reference \`data\` properties that server provides
- Only call methods that client implements
- Use correct Angular directives and bindings

**Critical Communication Points:**

1. **Server → Client Data Flow**
   - Server sets \`data.property\`
   - Client receives via \`c.data.property\`
   - HTML displays with \`{{data.property}}\`

2. **Client → Server Requests**
   - Client sends \`c.server.get({action: 'name'})\`
   - Server receives via \`input.action\`
   - Server processes and returns updated \`data\`

3. **HTML → Client Method Calls**
   - HTML has \`ng-click="methodName()"\`
   - Client must have \`$scope.methodName = function()\`
   - Method typically calls server with \`c.server.get()\`

**Common Failures to Avoid:**
- Action name mismatches between client and server
- Method name mismatches between HTML and client  
- Property name mismatches between server and HTML
- Missing handlers for client requests
- Orphaned data properties or methods

**Coherence Validation Checklist:**
- [ ] Every \`data.property\` in server is used in HTML/client
- [ ] Every \`ng-click\` in HTML has matching \`$scope.method\` in client
- [ ] Every \`c.server.get({action})\` in client has matching \`if(input.action)\` in server
- [ ] Data flows correctly: Server → HTML → Client → Server
- [ ] No orphaned methods or unused data properties

### Rule 4: Use Local Sync for Widget Debugging - NOT snow_query_table!

**CRITICAL: When debugging widgets, ALWAYS use \`snow_pull_artifact\` first!**

\`\`\`javascript
// ✅ CORRECT - Use Local Sync for widget debugging
snow_pull_artifact({ 
  sys_id: 'widget_sys_id',
  table: 'sp_widget' 
});
// Now use Claude Code native search, multi-file edit, etc.

// ❌ WRONG - Don't use snow_query_table for debugging widgets
snow_query_table({ 
  table: 'sp_widget',
  query: 'sys_id=...',
  fields: ['template', 'script', 'client_script'] 
});
// This hits token limits and can't use native tools!
\`\`\`

**Why Local Sync for Widget Debugging:**
- **No token limits** - Handle widgets of ANY size
- **Native search** - Find issues across all files instantly
- **Multi-file view** - See relationships between components
- **Better debugging** - Trace data flow, find missing methods
- **Coherence checking** - Validate all parts work together

**Widget Debugging Workflow:**
1. User reports issue → \`snow_pull_artifact\`
2. Search for error patterns across files
3. Fix using multi-file edit
4. Validate coherence → \`snow_validate_artifact_coherence\`
5. Push fixes back → \`snow_push_artifact\`

**IMPORTANT: Use Local Sync Instead of Query for Large Widgets**

When you see "exceeds maximum allowed tokens" errors, don't try to fetch fields separately with \`snow_query_table\`. Use Local Sync instead:

\`\`\`javascript
// ❌ WRONG - Don't do this when debugging:
snow_query_table({ table: 'sp_widget', fields: ['name'] });
snow_query_table({ table: 'sp_widget', fields: ['script'] });
snow_query_table({ table: 'sp_widget', fields: ['client_script'] });
// This is inefficient and can't use native tools!

// ✅ CORRECT - Use Local Sync:
snow_pull_artifact({ 
  sys_id: '01d01d6983176a502a7ea130ceaad376' 
});
// All files available locally with NO token limits!
\`\`\`

**Local Sync Benefits:**
- Handles widgets of ANY size automatically
- All files available for native tool usage
- Maintains relationships between components
- Enables powerful search and refactoring

### Rule 5: Evidence-Based Debugging

Follow this systematic approach for all debugging:

1. **Reproduce** - Run the exact failing code
2. **Inventory** - List all dependencies
3. **Verify** - Test each dependency exists
4. **Fix** - Correct only confirmed issues

**Fix only:**
- ✅ Confirmed syntax errors
- ✅ Verified null references
- ✅ Missing dependencies (after verification)
- ✅ Real type mismatches

**Never change:**
- ❌ Unverified resources
- ❌ Configurations that "seem wrong"
- ❌ APIs you haven't tested
- ❌ Working code that could be "better"

## ServiceNow Development Standards

### Table Operations
- Always verify table existence before operations
- Use proper field types and references
- Check for ACLs and permissions
- Handle large datasets with pagination

### Script Development
- Use Script Includes for reusable code
- Implement proper error handling
- Add meaningful logging with gs.info/warn/error
- Test in scoped applications when applicable
- **NEVER use background scripts to update widget fields - use \`snow_update\` instead**

### Widget Development

**🚨 NO MOCK WIDGETS - EVERY WIDGET MUST BE COMPLETE AND FUNCTIONAL**

**CRITICAL: Direct Widget Updates (Not Background Scripts!)**
- Use \`snow_update({ type: 'widget', identifier: 'widget_name', config: { /* COMPLETE fields */ }})\` 
- Updates widget fields DIRECTLY on the widget record
- Do NOT use background scripts to update widget fields
- Do NOT try to import server scripts into client scripts

**Widget Coherence Requirements:**
- Ensure HTML/Client/Server scripts communicate properly
- Use Angular providers correctly  
- Implement proper data binding
- Test across different themes and portals
- **NO PLACEHOLDER CONTENT - Every widget must be production-ready**

**Creating New Widgets - COMPLETE IMPLEMENTATION REQUIRED:**
\`\`\`javascript
// ❌ WRONG - Mock/placeholder widget
snow_deploy({
  type: 'widget',
  config: {
    name: 'test_widget',
    template: '<div>TODO: Add content</div>',  // NO!
    script: '// TODO: Add logic',  // NO!
    client_script: '// Placeholder'  // NO!
  }
})

// ✅ CORRECT - Complete, functional widget
snow_deploy({
  type: 'widget',
  config: {
    name: 'incident_dashboard_widget',
    title: 'Incident Dashboard',
    template: \`
      <div class="incident-dashboard">
        <div class="dashboard-header">
          <h2>{{data.title}}</h2>
          <span class="refresh-time">{{data.lastRefresh}}</span>
        </div>
        <div class="stats-container">
          <div class="stat-card" ng-repeat="stat in data.stats">
            <div class="stat-value">{{stat.value}}</div>
            <div class="stat-label">{{stat.label}}</div>
          </div>
        </div>
        <div class="incident-list">
          <table class="table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Short Description</th>
                <th>Priority</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="incident in data.incidents" ng-click="c.openIncident(incident.sys_id)">
                <td>{{incident.number}}</td>
                <td>{{incident.short_description}}</td>
                <td><span class="priority-{{incident.priority}}">{{incident.priority}}</span></td>
                <td>{{incident.assigned_to}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    \`,
    script: \`
      // COMPLETE server-side implementation
      (function() {
        data.title = 'Incident Dashboard';
        data.lastRefresh = new GlideDateTime().getDisplayValue();
        
        // Get incident statistics
        data.stats = [];
        
        var totalGr = new GlideAggregate('incident');
        totalGr.addQuery('active', true);
        totalGr.addAggregate('COUNT');
        totalGr.query();
        if (totalGr.next()) {
          data.stats.push({
            value: totalGr.getAggregate('COUNT'),
            label: 'Total Active'
          });
        }
        
        var criticalGr = new GlideAggregate('incident');
        criticalGr.addQuery('active', true);
        criticalGr.addQuery('priority', '1');
        criticalGr.addAggregate('COUNT');
        criticalGr.query();
        if (criticalGr.next()) {
          data.stats.push({
            value: criticalGr.getAggregate('COUNT'),
            label: 'Critical'
          });
        }
        
        // Get recent incidents
        data.incidents = [];
        var incGr = new GlideRecord('incident');
        incGr.addQuery('active', true);
        incGr.orderByDesc('sys_created_on');
        incGr.setLimit(10);
        incGr.query();
        
        while (incGr.next()) {
          data.incidents.push({
            sys_id: incGr.getUniqueValue(),
            number: incGr.getValue('number'),
            short_description: incGr.getValue('short_description'),
            priority: incGr.getValue('priority'),
            assigned_to: incGr.assigned_to.getDisplayValue()
          });
        }
        
        // Handle server actions
        if (input && input.action === 'refresh') {
          // Refresh logic
          data.lastRefresh = new GlideDateTime().getDisplayValue();
        }
      })();
    \`,
    client_script: \`
      function($scope, $window, spModal) {
        var c = this;
        
        // Initialize client controller
        c.refreshInterval = null;
        
        // Open incident in new window
        c.openIncident = function(sysId) {
          var url = '/nav_to.do?uri=incident.do?sys_id=' + sysId;
          $window.open(url, '_blank');
        };
        
        // Refresh data
        c.refresh = function() {
          c.server.get({
            action: 'refresh'
          }).then(function(response) {
            console.log('Dashboard refreshed');
          });
        };
        
        // Auto-refresh every 30 seconds
        c.startAutoRefresh = function() {
          c.refreshInterval = setInterval(function() {
            $scope.$apply(function() {
              c.refresh();
            });
          }, 30000);
        };
        
        // Clean up on destroy
        $scope.$on('$destroy', function() {
          if (c.refreshInterval) {
            clearInterval(c.refreshInterval);
          }
        });
        
        // Start auto-refresh
        c.startAutoRefresh();
      }
    \`,
    css: \`
      .incident-dashboard {
        padding: 20px;
        background: #f5f5f5;
      }
      
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      
      .stats-container {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .stat-card {
        flex: 1;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
      }
      
      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #333;
      }
      
      .stat-label {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
      }
      
      .incident-list {
        background: white;
        border-radius: 8px;
        padding: 15px;
      }
      
      .incident-list tr {
        cursor: pointer;
      }
      
      .incident-list tr:hover {
        background: #f0f0f0;
      }
      
      .priority-1 { color: #d9534f; font-weight: bold; }
      .priority-2 { color: #f0ad4e; }
      .priority-3 { color: #5bc0de; }
      .priority-4 { color: #5cb85c; }
      .priority-5 { color: #777; }
    \`,
    option_schema: [
      {
        name: 'refresh_interval',
        label: 'Refresh Interval (seconds)',
        type: 'integer',
        default: 30
      },
      {
        name: 'max_incidents',
        label: 'Maximum Incidents to Display',
        type: 'integer',
        default: 10
      }
    ]
  }
})
\`\`\`

**Updating Existing Widgets:**
\`\`\`javascript
snow_update({
  type: 'widget',
  identifier: 'my_widget',  // Name or sys_id
  config: {
    template: '<div>Updated HTML</div>',  // Only update what changes
    script: 'data.updated = true;' // ServiceNow uses 'script' field
  }
})
\`\`\`

### Flow Development
- Use proper trigger conditions
- Implement error handling paths
- Add appropriate logging actions
- Test with various data scenarios

## MCP Server Capabilities

Snow-Flow includes 16+ specialized MCP servers with over 200 tools for comprehensive ServiceNow integration:

### 1. ServiceNow Deployment Server
**Purpose:** Widget and artifact deployment with coherence validation

**Key Tools:**
- \`snow_deploy\` - Create NEW artifacts (widgets, pages, etc.) - use with \`type: 'widget'\`
- \`snow_update\` - UPDATE existing artifacts - use for widget field updates
- \`snow_validate_deployment\` - Validate deployed artifacts
- \`snow_rollback_deployment\` - Rollback failed deployments
- \`snow_preview_widget\` - Preview widget before deployment
- \`snow_widget_test\` - Test widget functionality

**Special Features:**
- Automatic widget coherence validation
- Data flow contract verification
- Method implementation checking
- CSS class validation

### 2. ServiceNow Operations Server
**Purpose:** Core ServiceNow operations and queries

**Key Tools:**
- \`snow_query_table\` - Universal table querying with pagination
- \`snow_query_incidents\` - Query and analyze incidents
- \`snow_cmdb_search\` - Search Configuration Management Database
- \`snow_user_lookup\` - Find and manage users
- \`snow_operational_metrics\` - Get operational metrics
- \`snow_knowledge_search\` - Search knowledge base

**Features:**
- Full CRUD operations on any table
- Advanced query capabilities
- Field discovery and validation
- Relationship navigation

### 3. ServiceNow Automation Server
**Purpose:** Script execution and automation

**🚨 CRITICAL: ALL SCRIPTS MUST BE ES5 ONLY!**
ServiceNow runs on Rhino engine - ES6+ syntax will cause SyntaxError and script failure.

**Key Tools:**
- \`snow_execute_background_script\` - Execute background scripts (**ES5 ONLY!** with optional autoConfirm)
- \`snow_confirm_script_execution\` - Confirm script execution after user approval
- \`snow_execute_script_with_output\` - Execute scripts with output capture (**ES5 ONLY!**)
- \`snow_get_script_output\` - Retrieve script execution history
- \`snow_execute_script_sync\` - Synchronous script execution (**ES5 ONLY!**)
- \`snow_get_logs\` - Access system logs
- \`snow_test_rest_connection\` - Test REST integrations
- \`snow_trace_execution\` - Trace script execution (**ES5 ONLY!**)
- \`snow_schedule_job\` - Create scheduled jobs
- \`snow_create_event\` - Trigger system events

**Remember:** Use \`var\`, \`function(){}\`, string concatenation, traditional for loops only!

**Features:**
- Full output capture (gs.print/info/warn/error)
- Execution history tracking
- System log access
- REST message testing
- Performance tracing

### 4. ServiceNow Platform Development Server
**Purpose:** Platform development artifacts

**Key Tools:**
- \`snow_create_ui_page\` - Create UI pages
- \`snow_create_script_include\` - Create reusable scripts
- \`snow_create_business_rule\` - Create business rules
- \`snow_create_client_script\` - Create client-side scripts
- \`snow_create_ui_policy\` - Create UI policies
- \`snow_create_ui_action\` - Create UI actions

**Features:**
- Full artifact creation
- Proper scoping support
- Condition builder integration
- Script validation

### 5. ServiceNow Integration Server
**Purpose:** Integration and data management

**Key Tools:**
- \`snow_create_rest_message\` - Create REST integrations
- \`snow_create_transform_map\` - Create data transformation maps
- \`snow_create_import_set\` - Manage import sets
- \`snow_test_web_service\` - Test web services
- \`snow_configure_email\` - Configure email settings

**Features:**
- REST/SOAP integration
- Data transformation
- Import/Export capabilities
- Email configuration

### 6. ServiceNow System Properties Server
**Purpose:** System property management

**Key Tools:**
- \`snow_property_get\` - Retrieve property values
- \`snow_property_set\` - Set property values
- \`snow_property_list\` - List properties by pattern
- \`snow_property_delete\` - Remove properties
- \`snow_property_bulk_update\` - Bulk operations
- \`snow_property_export\` - Export to JSON
- \`snow_property_import\` - Import from JSON

**Features:**
- Full CRUD on sys_properties
- Bulk operations
- Import/Export capabilities
- Property validation

### 7. ServiceNow Update Set Server
**Purpose:** Change management and deployment

**Key Tools:**
- \`snow_update_set_create\` - Create new update sets
- \`snow_update_set_switch\` - Switch active update set
- \`snow_update_set_current\` - Get current update set
- \`snow_update_set_complete\` - Mark as complete
- \`snow_update_set_export\` - Export as XML
- \`snow_ensure_active_update_set\` - Ensure update set is active

**Features:**
- Full update set lifecycle
- Change tracking
- XML export/import
- Conflict detection

### 8. ServiceNow Development Assistant Server
**Purpose:** Intelligent artifact search, editing and development assistance

**Key Tools:**
- \`snow_find_artifact\` - Find any ServiceNow artifact by name/type
- \`snow_edit_artifact\` - Edit existing artifacts intelligently
- \`snow_get_by_sysid\` - Get artifact by sys_id
- \`snow_analyze_artifact\` - Analyze artifact structure and dependencies
- \`snow_comprehensive_search\` - Deep search across all tables
- \`snow_analyze_requirements\` - Analyze development requirements

**Features:**
- Pattern-based code generation
- Best practice enforcement
- Performance optimization
- Security review

### 9. ServiceNow Security & Compliance Server
**Purpose:** Security and compliance management

**Key Tools:**
- \`snow_create_security_policy\` - Create security policies
- \`snow_audit_compliance\` - Compliance auditing
- \`snow_scan_vulnerabilities\` - Vulnerability scanning
- \`snow_assess_risk\` - Risk assessment
- \`snow_review_access_control\` - ACL review

**Features:**
- SOX/GDPR/HIPAA compliance
- Security policy management
- Vulnerability assessment
- Access control validation

### 10. ServiceNow Reporting & Analytics Server
**Purpose:** Reporting and data visualization

**Key Tools:**
- \`snow_create_report\` - Create reports
- \`snow_create_dashboard\` - Create dashboards
- \`snow_define_kpi\` - Define KPIs
- \`snow_schedule_report\` - Schedule report delivery
- \`snow_analyze_data_quality\` - Data quality analysis

**Features:**
- Advanced reporting
- Dashboard creation
- KPI management
- Scheduled delivery

### 11. ServiceNow Machine Learning Server
**Purpose:** AI/ML capabilities with TensorFlow.js and native ML integration

**Key Tools:**
- \`ml_train_incident_classifier\` - Train incident classifier with LSTM neural networks
- \`ml_predict_change_risk\` - Predict change risks
- \`ml_detect_anomalies\` - Anomaly detection
- \`ml_forecast_incidents\` - Incident forecasting with time series
- \`ml_performance_analytics\` - Native Performance Analytics ML
- \`ml_hybrid_recommendation\` - Hybrid ML recommendations

**Features:**
- Predictive analytics
- Pattern recognition
- Anomaly detection
- Process optimization

### 12. ServiceNow Local Development Server
**Purpose:** Bridge between ServiceNow artifacts and Claude Code's native development tools

**Key Tools:**
- \`snow_pull_artifact\` - Pull any ServiceNow artifact to local files
- \`snow_push_artifact\` - Push local changes back with validation
- \`snow_validate_artifact_coherence\` - Validate artifact relationships
- \`snow_list_supported_artifacts\` - List all supported artifact types
- \`snow_sync_status\` - Check sync status of local artifacts
- \`snow_sync_cleanup\` - Clean up local files after sync
- \`snow_convert_to_es5\` - Convert modern JavaScript to ES5

**Features:**
- Supports 12+ artifact types dynamically
- Smart field chunking for large artifacts
- ES5 validation for server-side scripts
- Coherence validation for widgets
- Full Claude Code native tool integration

**Supported Artifact Types:**
- Service Portal Widgets (\`sp_widget\`)
- Flow Designer Flows (\`sys_hub_flow\`)
- Script Includes (\`sys_script_include\`)
- Business Rules (\`sys_script\`)
- UI Pages (\`sys_ui_page\`)
- Client Scripts (\`sys_script_client\`)
- UI Policies (\`sys_ui_policy\`)
- REST Messages (\`sys_rest_message\`)
- Transform Maps (\`sys_transform_map\`)
- Scheduled Jobs (\`sysauto_script\`)
- Fix Scripts (\`sys_script_fix\`)

### 13. Snow-Flow Orchestration Server
**Purpose:** Multi-agent coordination and task management

**Key Tools:**
- \`swarm_init\` - Initialize agent swarms
- \`agent_spawn\` - Create specialized agents
- \`task_orchestrate\` - Orchestrate complex tasks
- \`memory_search\` - Search persistent memory
- \`neural_train\` - Train neural networks with TensorFlow.js
- \`performance_report\` - Generate performance reports

**Features:**
- Multi-agent coordination
- Task orchestration
- Neural network training (TensorFlow.js)
- Memory management
- Performance monitoring

### Additional Servers:

**ServiceNow CMDB/Event/HR/CSM/DevOps Server** - CI management, event correlation, HR processes, customer service, DevOps pipelines

**ServiceNow Knowledge & Catalog Server** - Knowledge articles, service catalog items, catalog variables and policies

**ServiceNow Change/Virtual Agent/PA Server** - Change management, virtual agent NLU, predictive analytics

**ServiceNow Flow/Workspace/Mobile Server** - Flow Designer, workspace configuration, mobile app management

**Features:**
- Multi-agent coordination
- Task orchestration
- Neural network training (TensorFlow.js)
- Memory management
- Performance monitoring

## Local Development with Artifact Sync

### Dynamic Artifact Synchronization

The Local Development Server enables editing ServiceNow artifacts using Claude Code's native file tools. This creates a powerful development bridge between ServiceNow and local development environments.

**Workflow:**

1. **Pull Artifact to Local Files**
   \`\`\`javascript
   // Auto-detect artifact type
   snow_pull_artifact({ sys_id: 'any_sys_id' });
   
   // Or specify table for faster pull
   snow_pull_artifact({ 
     sys_id: 'widget_sys_id',
     table: 'sp_widget' 
   });
   \`\`\`

2. **Edit with Claude Code Native Tools**
   - Full search capabilities across files
   - Multi-file editing and refactoring
   - Syntax highlighting and validation
   - Git-like diff viewing
   - Go-to-definition and references

3. **Validate Coherence**
   \`\`\`javascript
   // Check artifact relationships
   snow_validate_artifact_coherence({ 
     sys_id: 'artifact_sys_id' 
   });
   \`\`\`

4. **Push Changes Back**
   \`\`\`javascript
   // Push with automatic validation
   snow_push_artifact({ sys_id: 'artifact_sys_id' });
   
   // Force push despite warnings
   snow_push_artifact({ 
     sys_id: 'artifact_sys_id',
     force: true 
   });
   \`\`\`

5. **Clean Up**
   \`\`\`javascript
   // Remove local files after sync
   snow_sync_cleanup({ sys_id: 'artifact_sys_id' });
   \`\`\`

**Artifact Registry:**

Each artifact type is configured with:
- Field mappings to local files
- Context-aware wrappers for better editing
- ES5 validation flags for server scripts
- Coherence rules for interconnected fields
- Preprocessors/postprocessors for data transformation

**File Structure Example:**
\`\`\`
/tmp/snow-flow-artifacts/
├── widgets/
│   └── my_widget/
│       ├── my_widget.html          # Template
│       ├── my_widget.server.js     # Server script (ES5)
│       ├── my_widget.client.js     # Client script
│       ├── my_widget.css           # Styles
│       ├── my_widget.config.json   # Configuration
│       └── README.md               # Context & instructions
├── script_includes/
│   └── MyScriptInclude/
│       ├── MyScriptInclude.js      # Script
│       └── MyScriptInclude.docs.md # Documentation
└── business_rules/
    └── my_rule/
        ├── my_rule.js               # Rule script
        └── my_rule.condition.js     # Condition
\`\`\`

**Benefits:**
- Use your favorite editor features
- Full search and replace capabilities
- Version control integration
- Bulk operations across artifacts
- Offline development capability
- Advanced refactoring tools

## Debugging Best Practices

### Systematic Debugging Protocol

1. **Reproduce the Issue**
   \`\`\`javascript
   // Always use ES5 and test exact code
   const result = await snow_execute_script_with_output({
     script: \`/* Exact failing code in ES5 */\`
   });
   \`\`\`

2. **Verify Dependencies**
   - Check all referenced tables exist
   - Verify all properties are set
   - Confirm all fields are present
   - Test all integrations work

3. **Test in Context**
   - Use same scope and variables
   - Include same imports
   - Test with same data

4. **Apply Evidence-Based Fixes**
   - Fix only confirmed issues
   - Document why changes were made
   - Test fixes thoroughly

### Common Verification Patterns

**Table Verification:**
\`\`\`javascript
var table = new GlideRecord('table_name');
gs.info('Table exists: ' + table.isValid());
\`\`\`

**Property Verification:**
\`\`\`javascript
var prop = gs.getProperty('property.name');
gs.info('Property value: ' + (prop || 'NOT SET'));
\`\`\`

**Field Verification:**
\`\`\`javascript
var gr = new GlideRecord('table');
var element = gr.getElement('field_name');
gs.info('Field exists: ' + (element ? 'Yes' : 'No'));
\`\`\`

## Command Reference

### Core Commands
- \`./snow-flow start\` - Start orchestration system
- \`./snow-flow status\` - System status
- \`./snow-flow monitor\` - Real-time monitoring

### Agent Management
- \`./snow-flow agent spawn <type>\` - Create agents
- \`./snow-flow agent list\` - List active agents

### Task Management
- \`./snow-flow task create\` - Create tasks
- \`./snow-flow task list\` - View task queue

### Memory Operations
- \`./snow-flow memory store <key> <data>\` - Store data
- \`./snow-flow memory get <key>\` - Retrieve data
- \`./snow-flow memory list\` - List all keys

### SPARC Modes
- \`./snow-flow sparc "<task>"\` - Orchestrator mode
- \`./snow-flow sparc run <mode> "<task>"\` - Specific mode
- \`./snow-flow sparc tdd "<feature>"\` - Test-driven development

### Swarm Coordination
- \`./snow-flow swarm "<objective>"\` - Multi-agent coordination
- Options: \`--strategy\`, \`--mode\`, \`--parallel\`, \`--monitor\`

## Workflow Guidelines

### Development Workflow
1. **Plan** - Use TodoWrite for task management
2. **Verify** - Check existing resources
3. **Develop** - Follow ES5 standards
4. **Test** - Use background scripts
5. **Deploy** - Use update sets
6. **Validate** - Verify deployment

### Testing Workflow
1. Run unit tests with background scripts
2. Test integrations with REST tools
3. Validate UI with widget coherence
4. Check performance with tracing
5. Review logs for errors

### Debugging Workflow
1. Reproduce issue exactly
2. Gather evidence with scripts
3. Verify all assumptions
4. Apply minimal fixes
5. Test thoroughly
6. Document changes

## Important Reminders

### Always Remember
- Every ServiceNow instance is unique
- Custom implementations exist that you don't know about
- Preview/beta features may be available
- Organization-specific configurations are common
- Test everything before making assumptions

### Never Assume
- That something doesn't exist without verification
- That configurations are wrong without testing
- That APIs aren't available without checking
- That code won't work without running it
- That you know better than existing implementations

### Golden Rules
1. **Verify First** - Test before declaring broken
2. **ES5 Only** - No modern JavaScript in ServiceNow
3. **Evidence-Based** - Make decisions on facts, not assumptions
4. **Minimal Changes** - Fix only what's broken
5. **Respect Context** - Understand why things exist as they do

## Conclusion

Snow-Flow is a powerful framework for ServiceNow development that demands **COMPLETE, PRODUCTION-READY IMPLEMENTATIONS** with absolutely **NO MOCK DATA, NO PLACEHOLDERS, and NO SHORTCUTS**.

**The Snow-Flow Standard:**
- **EVERY** line of code must be complete and functional
- **EVERY** feature must be fully implemented
- **EVERY** integration must be real and working
- **EVERY** solution must be production-ready
- **NO EXCEPTIONS, NO EXCUSES**

By following these guidelines and the **NO MOCK DATA** principle, you ensure:
- Reliable, maintainable ServiceNow solutions
- Complete implementations that work in production
- Professional-grade code that users can depend on
- Real solutions to real problems

Remember: 
1. **NO MOCK DATA** - Everything must be real
2. **TAKE THE TIME** - Do it right, no shortcuts
3. **COMPLETE IMPLEMENTATIONS** - Every feature, every time
4. **PRODUCTION READY** - Users depend on this being real
5. **VERIFY AND TEST** - With real data, real systems

Your job is to deliver **COMPLETE, WORKING SOLUTIONS**. Every implementation matters. Every line of code counts. Every feature must work.

**TAKE THE TIME. DO IT RIGHT. NO MOCK DATA. NO EXCEPTIONS.**`;

// Add version constant to track template updates
export const CLAUDE_MD_TEMPLATE_VERSION = '3.6.1-NO-MOCK-DATA';