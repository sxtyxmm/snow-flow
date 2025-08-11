# Snow-Flow Configuration & Best Practices

This document provides comprehensive instructions for Snow-Flow, an advanced ServiceNow development and orchestration framework powered by Claude AI.

## Table of Contents
1. [Core Philosophy](#core-philosophy)
2. [Fundamental Rules](#fundamental-rules)
3. [ServiceNow Development Standards](#servicenow-development-standards)
4. [MCP Server Capabilities](#mcp-server-capabilities)
5. [Debugging Best Practices](#debugging-best-practices)
6. [Command Reference](#command-reference)
7. [Workflow Guidelines](#workflow-guidelines)

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

```javascript
// Before claiming anything doesn't work or exist:
// Step 1: Test the actual implementation
const verify = await snow_execute_script_with_output({
  script: `/* Test the exact code or resource */`
});

// Step 2: Check if resources exist
const tableCheck = await snow_discover_table_fields({
  table_name: 'potentially_custom_table'
});

// Step 3: Validate configurations
const propertyCheck = await snow_property_manager({
  action: 'get',
  name: 'system.property'
});

// Step 4: Only then make informed decisions
```

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
```javascript
// For any artifact the user has modified
const currentVersion = await snow_query_table({
  table: 'artifact_table_name',
  query: `sys_id=${artifact_sys_id}`,
  fields: ['*'],  // Get all fields
  limit: 1
});

// Or for widgets specifically
const widgetData = await snow_query_table({
  table: 'sp_widget',
  query: `sys_id=${widget_sys_id}`,
  fields: ['name', 'template', 'client_script', 'script', 'css', 'option_schema'],
  limit: 1
});

// Or use snow_get_by_sysid for comprehensive retrieval
const artifact = await snow_get_by_sysid({
  table: 'table_name',
  sys_id: 'the_sys_id'
});
```

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
```javascript
// User: "I've updated the widget to add a loading spinner"
// Snow-Flow response:

// 1. Fetch current version
const widget = await snow_query_table({
  table: 'sp_widget',
  query: `sys_id=${widgetSysId}`,
  fields: ['*'],
  limit: 1
});

// 2. Analyze changes
console.log("✅ Fetched your latest widget version from ServiceNow");
console.log("📝 I see you've added a loading spinner in the template");

// 3. Work with the updated version
// ... make additional changes based on user's modifications ...
```

**Why This Matters:**
- User modifications are not tracked locally
- Working with outdated versions causes conflicts
- User's work could be lost if not synced
- Builds trust by respecting user's contributions
- Ensures coherent development flow

## Fundamental Rules

### Rule 1: ES5 JavaScript Only in ServiceNow

ServiceNow uses the Rhino JavaScript engine which supports only ES5. Modern JavaScript syntax will fail.

**Never Use:**
- `const` or `let` - use `var`
- Arrow functions `() => {}` - use `function() {}`
- Template literals `` `${var}` `` - use string concatenation
- Destructuring `{a, b} = obj` - use explicit property access
- `for...of` loops - use traditional `for` loops
- Default parameters - use `typeof` checks
- `async/await` - use callbacks or GlideAjax

**Always Use:**
```javascript
// ES5 compatible code
var name = 'value';
function processData() {
  return 'result';
}
var message = 'Hello ' + userName;
for (var i = 0; i < array.length; i++) {
  var item = array[i];
}
```

### Rule 2: Background Scripts as Primary Debug Tool

Background scripts provide immediate, factual feedback from the actual ServiceNow instance. Use them extensively for verification and debugging.

```javascript
// Universal verification pattern
const verify = await snow_execute_script_with_output({
  script: `
    gs.info('=== VERIFICATION TEST ===');
    
    // Test table existence
    var table = new GlideRecord('table_name');
    gs.info('Table valid: ' + table.isValid());
    
    // Test property existence
    var prop = gs.getProperty('property.name');
    gs.info('Property: ' + (prop || 'NOT SET'));
    
    // Test actual code
    try {
      // User's code here
      gs.info('SUCCESS');
    } catch(e) {
      gs.error('ERROR: ' + e.message);
    }
  `
});
```

### Rule 3: Widget Coherence - Critical Client-Server Communication

ServiceNow widgets MUST have perfect communication between client and server scripts. This is not optional - widgets fail when these components don't talk to each other correctly.

**The Three-Way Contract:**

**Server Script Must:**
- Initialize all `data` properties that HTML will reference
- Handle every `input.action` that client sends
- Return data in the format client expects

**Client Script Must:**
- Implement every method that HTML calls via `ng-click`
- Use `c.server.get({action: 'name'})` for server communication
- Update `c.data` when server responds

**HTML Template Must:**
- Only reference `data` properties that server provides
- Only call methods that client implements
- Use correct Angular directives and bindings

**Critical Communication Points:**

1. **Server → Client Data Flow**
   - Server sets `data.property`
   - Client receives via `c.data.property`
   - HTML displays with `{{data.property}}`

2. **Client → Server Requests**
   - Client sends `c.server.get({action: 'name'})`
   - Server receives via `input.action`
   - Server processes and returns updated `data`

3. **HTML → Client Method Calls**
   - HTML has `ng-click="methodName()"`
   - Client must have `$scope.methodName = function()`
   - Method typically calls server with `c.server.get()`

**Common Failures to Avoid:**
- Action name mismatches between client and server
- Method name mismatches between HTML and client  
- Property name mismatches between server and HTML
- Missing handlers for client requests
- Orphaned data properties or methods

**Coherence Validation Checklist:**
- [ ] Every `data.property` in server is used in HTML/client
- [ ] Every `ng-click` in HTML has matching `$scope.method` in client
- [ ] Every `c.server.get({action})` in client has matching `if(input.action)` in server
- [ ] Data flows correctly: Server → HTML → Client → Server
- [ ] No orphaned methods or unused data properties

### Rule 4: Evidence-Based Debugging

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

### Widget Development
- Ensure HTML/Client/Server coherence
- Use Angular providers correctly
- Implement proper data binding
- Test across different themes and portals

### Flow Development
- Use proper trigger conditions
- Implement error handling paths
- Add appropriate logging actions
- Test with various data scenarios

## MCP Server Capabilities

Snow-Flow includes 12 specialized MCP servers, each providing specific ServiceNow capabilities:

### 1. ServiceNow Deployment Server
**Purpose:** Widget and artifact deployment with coherence validation

**Key Tools:**
- `snow_deploy_widget` - Deploy widgets with HTML/Client/Server validation
- `snow_deploy_portal_page` - Deploy portal pages
- `snow_deploy_flow` - Deploy Flow Designer flows
- `snow_create_update_set` - Create update sets
- `snow_validate_deployment` - Validate deployed artifacts
- `snow_rollback_deployment` - Rollback failed deployments

**Special Features:**
- Automatic widget coherence validation
- Data flow contract verification
- Method implementation checking
- CSS class validation

### 2. ServiceNow Operations Server
**Purpose:** Core ServiceNow operations and queries

**Key Tools:**
- `snow_query_table` - Universal table querying with pagination
- `snow_create_incident` - Create and manage incidents
- `snow_update_record` - Update any table record
- `snow_delete_record` - Delete records with validation
- `snow_discover_table_fields` - Discover table schema
- `snow_cmdb_search` - Search Configuration Management Database

**Features:**
- Full CRUD operations on any table
- Advanced query capabilities
- Field discovery and validation
- Relationship navigation

### 3. ServiceNow Automation Server
**Purpose:** Script execution and automation

**Key Tools:**
- `snow_execute_script_with_output` - Execute scripts with output capture
- `snow_get_script_output` - Retrieve script execution history
- `snow_execute_script_sync` - Synchronous script execution
- `snow_get_logs` - Access system logs
- `snow_test_rest_connection` - Test REST integrations
- `snow_trace_execution` - Trace script execution
- `snow_schedule_job` - Create scheduled jobs
- `snow_create_event` - Trigger system events

**Features:**
- Full output capture (gs.print/info/warn/error)
- Execution history tracking
- System log access
- REST message testing
- Performance tracing

### 4. ServiceNow Platform Development Server
**Purpose:** Platform development artifacts

**Key Tools:**
- `snow_create_script_include` - Create reusable scripts
- `snow_create_business_rule` - Create business rules
- `snow_create_client_script` - Create client-side scripts
- `snow_create_ui_policy` - Create UI policies
- `snow_create_ui_action` - Create UI actions
- `snow_create_ui_page` - Create UI pages

**Features:**
- Full artifact creation
- Proper scoping support
- Condition builder integration
- Script validation

### 5. ServiceNow Integration Server
**Purpose:** Integration and data management

**Key Tools:**
- `snow_create_rest_message` - Create REST integrations
- `snow_create_transform_map` - Create data transformation maps
- `snow_create_import_set` - Manage import sets
- `snow_test_web_service` - Test web services
- `snow_configure_email` - Configure email settings

**Features:**
- REST/SOAP integration
- Data transformation
- Import/Export capabilities
- Email configuration

### 6. ServiceNow System Properties Server
**Purpose:** System property management

**Key Tools:**
- `snow_property_get` - Retrieve property values
- `snow_property_set` - Set property values
- `snow_property_list` - List properties by pattern
- `snow_property_delete` - Remove properties
- `snow_property_bulk_update` - Bulk operations
- `snow_property_export` - Export to JSON
- `snow_property_import` - Import from JSON

**Features:**
- Full CRUD on sys_properties
- Bulk operations
- Import/Export capabilities
- Property validation

### 7. ServiceNow Update Set Server
**Purpose:** Change management and deployment

**Key Tools:**
- `snow_create_update_set` - Create new update sets
- `snow_switch_update_set` - Switch active update set
- `snow_complete_update_set` - Mark as complete
- `snow_preview_update_set` - Preview changes
- `snow_export_update_set` - Export as XML

**Features:**
- Full update set lifecycle
- Change tracking
- XML export/import
- Conflict detection

### 8. ServiceNow Development Assistant Server
**Purpose:** Code generation and best practices

**Key Tools:**
- `snow_generate_code` - Generate ServiceNow code
- `snow_suggest_pattern` - Suggest design patterns
- `snow_review_code` - Code review and analysis
- `snow_optimize_performance` - Performance recommendations

**Features:**
- Pattern-based code generation
- Best practice enforcement
- Performance optimization
- Security review

### 9. ServiceNow Security & Compliance Server
**Purpose:** Security and compliance management

**Key Tools:**
- `snow_create_security_policy` - Create security policies
- `snow_audit_compliance` - Compliance auditing
- `snow_scan_vulnerabilities` - Vulnerability scanning
- `snow_assess_risk` - Risk assessment
- `snow_review_access_control` - ACL review

**Features:**
- SOX/GDPR/HIPAA compliance
- Security policy management
- Vulnerability assessment
- Access control validation

### 10. ServiceNow Reporting & Analytics Server
**Purpose:** Reporting and data visualization

**Key Tools:**
- `snow_create_report` - Create reports
- `snow_create_dashboard` - Create dashboards
- `snow_define_kpi` - Define KPIs
- `snow_schedule_report` - Schedule report delivery
- `snow_analyze_data_quality` - Data quality analysis

**Features:**
- Advanced reporting
- Dashboard creation
- KPI management
- Scheduled delivery

### 11. ServiceNow Machine Learning Server
**Purpose:** AI/ML capabilities

**Key Tools:**
- `snow_train_classifier` - Train incident classifier
- `snow_predict_change_risk` - Predict change risks
- `snow_detect_anomalies` - Anomaly detection
- `snow_forecast_incidents` - Incident forecasting
- `snow_optimize_process` - Process optimization

**Features:**
- Predictive analytics
- Pattern recognition
- Anomaly detection
- Process optimization

### 12. Snow-Flow Orchestration Server
**Purpose:** Multi-agent coordination and task management

**Key Tools:**
- `snow_swarm_init` - Initialize agent swarms
- `snow_agent_spawn` - Create specialized agents
- `snow_task_orchestrate` - Orchestrate complex tasks
- `snow_memory_store` - Persistent memory storage
- `snow_neural_train` - Train neural networks
- `snow_performance_analyze` - Performance analysis

**Features:**
- Multi-agent coordination
- Task orchestration
- Neural network training (TensorFlow.js)
- Memory management
- Performance monitoring

## Debugging Best Practices

### Systematic Debugging Protocol

1. **Reproduce the Issue**
   ```javascript
   // Always use ES5 and test exact code
   const result = await snow_execute_script_with_output({
     script: `/* Exact failing code in ES5 */`
   });
   ```

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
```javascript
var table = new GlideRecord('table_name');
gs.info('Table exists: ' + table.isValid());
```

**Property Verification:**
```javascript
var prop = gs.getProperty('property.name');
gs.info('Property value: ' + (prop || 'NOT SET'));
```

**Field Verification:**
```javascript
var gr = new GlideRecord('table');
var element = gr.getElement('field_name');
gs.info('Field exists: ' + (element ? 'Yes' : 'No'));
```

## Command Reference

### Core Commands
- `./snow-flow start` - Start orchestration system
- `./snow-flow status` - System status
- `./snow-flow monitor` - Real-time monitoring

### Agent Management
- `./snow-flow agent spawn <type>` - Create agents
- `./snow-flow agent list` - List active agents

### Task Management
- `./snow-flow task create` - Create tasks
- `./snow-flow task list` - View task queue

### Memory Operations
- `./snow-flow memory store <key> <data>` - Store data
- `./snow-flow memory get <key>` - Retrieve data
- `./snow-flow memory list` - List all keys

### SPARC Modes
- `./snow-flow sparc "<task>"` - Orchestrator mode
- `./snow-flow sparc run <mode> "<task>"` - Specific mode
- `./snow-flow sparc tdd "<feature>"` - Test-driven development

### Swarm Coordination
- `./snow-flow swarm "<objective>"` - Multi-agent coordination
- Options: `--strategy`, `--mode`, `--parallel`, `--monitor`

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

Snow-Flow is a powerful framework for ServiceNow development that emphasizes verification, testing, and evidence-based decision making. By following these guidelines and best practices, you ensure reliable, maintainable, and effective ServiceNow solutions.

Remember: Your job is to solve problems, not to judge implementations. Every environment has its reasons for existing configurations. Verify, test, and respect what you find.