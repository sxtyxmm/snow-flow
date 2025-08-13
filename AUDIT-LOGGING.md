# Snow-Flow ServiceNow Audit Logging

🔍 **Comprehensive audit trail voor alle Snow-Flow activiteiten in ServiceNow**

Snow-Flow v3.6.0+ includeert geavanceerde audit logging die elke actie in ServiceNow tracked met source `snow-flow` voor compliance, debugging en security monitoring.

## 🎯 **Wat wordt gelogd?**

### **Complete Activity Tracking:**
- ✅ **API Calls** - Alle CRUD operaties met token usage
- ✅ **Widget Operations** - Pull/push/validate/deploy met coherence data
- ✅ **Artifact Sync** - Local development file sync operations  
- ✅ **Script Execution** - Background scripts met ES5 validation
- ✅ **Authentication** - Login/token refresh/scope elevation
- ✅ **Tool Execution** - Elke MCP tool call met parameters en duration
- ✅ **Server Events** - MCP server startup/shutdown

### **Enhanced Token Tracking:**
Alle logs bevatten detailed token usage data:
- Input tokens verbruikt
- Output tokens gegenereerd  
- Total token cost per operatie
- Cumulative session tracking

## 🔧 **Setup & Configuration**

### **Automatische Activatie:**
Audit logging is **automatisch actief** voor alle MCP servers die de `EnhancedBaseMCPServer` gebruiken.

### **Environment Variables:**
```bash
# Audit logging control
export SNOW_FLOW_AUDIT_LOGGING=true  # Default: true

# Debug logging
export MCP_DEBUG=true  # Shows token details
export DEBUG=true     # Extended debug info
```

### **ServiceNow Log Configuration:**
Logs worden verzonden naar de `sys_log` table met deze structuur:

```javascript
// ServiceNow sys_log record
{
  source: 'snow-flow',
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  message: 'Human readable message',
  sys_created_on: '2025-01-13 10:30:45',
  
  // Custom Snow-Flow fields:
  u_operation: 'tool_execution',
  u_table: 'sp_widget',
  u_sys_id: 'widget_sys_id',
  u_session_id: 'snow-flow-1705149045-abc123',
  u_mcp_server: 'servicenow-local-development',
  u_token_usage: '{"input":150,"output":75,"total":225}',
  u_duration_ms: 2340,
  u_metadata: '{"tool_name":"snow_pull_artifact","success":true}'
}
```

## 📊 **Audit Log Types**

### **1. Tool Execution Logs**
```javascript
await auditLogger.logOperation('tool_execution', 'INFO', {
  message: 'Successfully executed snow_pull_artifact',
  duration_ms: 2340,
  metadata: {
    tool_name: 'snow_pull_artifact',
    parameters: '{"sys_id":"abc123","table":"sp_widget"}',
    token_usage: { input: 150, output: 75, total: 225 }
  },
  success: true
});
```

### **2. API Call Logs**
```javascript
await auditLogger.logAPICall(
  'searchRecords',    // API method
  'sp_widget',        // Table
  'query',           // Operation type
  15,                // Record count
  1250,              // Duration ms
  true               // Success
);
```

### **3. Widget Operation Logs**
```javascript
await auditLogger.logWidgetOperation(
  'pull',               // operation: pull/push/validate/deploy
  'widget_sys_id',      // Widget sys_id
  'My Chat Widget',     // Widget name
  2340,                 // Duration ms
  true,                 // Success
  null                  // Error details (if failed)
);
```

### **4. Artifact Sync Logs**
```javascript
await auditLogger.logArtifactSync(
  'push',               // action: pull/push/cleanup
  'sp_widget',          // Table name
  'widget_sys_id',      // Artifact sys_id
  'My Widget',          // Artifact name
  4,                    // File count
  3200,                 // Duration ms
  true                  // Success
);
```

### **5. Script Execution Logs**
```javascript
await auditLogger.logScriptExecution(
  'background',         // scriptType: background/business_rule/client_script
  5670,                 // Duration ms
  true,                 // Success
  null,                 // Error details
  23                    // Output lines
);
```

### **6. Authentication Logs**
```javascript
await auditLogger.logAuthOperation(
  'token_refresh',      // operation: login/token_refresh/scope_elevation
  true,                 // Success
  { scope: 'read' }     // Additional details
);
```

## 🔍 **ServiceNow Query Examples**

### **Alle Snow-Flow Activiteit Vandaag:**
```javascript
var gr = new GlideRecord('sys_log');
gr.addQuery('source', 'snow-flow');
gr.addQuery('sys_created_on', '>=', gs.daysAgoStart(0));
gr.orderByDesc('sys_created_on');
gr.query();
```

### **Widget Operaties per Gebruiker:**
```javascript
var gr = new GlideRecord('sys_log');
gr.addQuery('source', 'snow-flow');
gr.addQuery('u_operation', 'CONTAINS', 'widget');
gr.addQuery('sys_created_by', gs.getUserName());
gr.query();
```

### **Failed Operations met Error Details:**
```javascript
var gr = new GlideRecord('sys_log');
gr.addQuery('source', 'snow-flow');
gr.addQuery('level', 'ERROR');
gr.addQuery('u_metadata', 'CONTAINS', 'success":false');
gr.query();
```

### **Token Usage Analysis:**
```javascript
var gr = new GlideRecord('sys_log');
gr.addQuery('source', 'snow-flow');
gr.addQuery('u_token_usage', '!=', '');
gr.query();

var totalTokens = 0;
while (gr.next()) {
  var usage = JSON.parse(gr.u_token_usage);
  totalTokens += usage.total;
}
gs.info('Total tokens used: ' + totalTokens);
```

### **Performance Analysis:**
```javascript
// Find slowest operations
var gr = new GlideRecord('sys_log');
gr.addQuery('source', 'snow-flow');
gr.addQuery('u_duration_ms', '>', 5000); // Slower than 5 seconds
gr.orderByDesc('u_duration_ms');
gr.query();
```

## 📈 **Batch Processing & Performance**

### **Smart Batching:**
- Logs verzameld in batches van max 20 entries
- Automatic flush elke 10 seconden
- Immediate flush bij server shutdown
- Failed logs krijgen max 3 retry attempts

### **Performance Optimizations:**
- Asynchronous logging (blocks niet de main operations)
- Minimal overhead (<5ms per operation)
- Automatic cleanup van temporary properties
- Memory-efficient JSON serialization

## 🛡️ **Security & Compliance**

### **Data Protection:**
- Geen sensitive data in logs (passwords, tokens, personal info)
- Automatic sanitization van user inputs
- Session isolation met unique session IDs
- Audit trail immutability

### **Compliance Features:**
- **SOX Compliance** - Complete financial system change tracking
- **GDPR Compliance** - Data processing audit trail
- **HIPAA Compliance** - Healthcare data access logging
- **Security Monitoring** - Failed authentication attempts

## 🔧 **Advanced Configuration**

### **Custom Audit Logger Usage:**
```javascript
import { getAuditLogger } from './utils/servicenow-audit-logger.js';

// In your MCP server
const auditLogger = getAuditLogger(this.logger, 'my-custom-server');

// Log custom operations
await auditLogger.logOperation('custom_operation', 'INFO', {
  message: 'Custom business logic executed',
  duration_ms: 1200,
  metadata: { 
    custom_field: 'value',
    business_context: 'important_process'
  },
  success: true
});
```

### **Audit Stats & Monitoring:**
```javascript
// Get audit statistics
const stats = auditLogger.getAuditStats();
console.log({
  session_id: stats.session_id,
  pending_logs: stats.pending_logs,
  is_enabled: stats.is_enabled,
  has_servicenow_client: stats.has_servicenow_client
});

// Manual flush (useful for testing)
await auditLogger.flush();
```

## 🎯 **Use Cases**

### **1. Compliance Auditing:**
Track alle wijzigingen voor SOX/GDPR compliance:
```javascript
// Query: Alle wijzigingen in financial records
var gr = new GlideRecord('sys_log');
gr.addQuery('source', 'snow-flow');
gr.addQuery('u_table', 'IN', 'finance_record,budget_line,cost_center');
gr.addQuery('u_operation', 'CONTAINS', 'update');
```

### **2. Security Monitoring:**
Monitor suspicious activiteiten:
```javascript
// Query: Failed authentication attempts
var gr = new GlideRecord('sys_log');
gr.addQuery('source', 'snow-flow');
gr.addQuery('u_operation', 'authentication');
gr.addQuery('level', 'ERROR');
```

### **3. Performance Optimization:**
Identificeer slow operations:
```javascript
// Query: Operations longer than 10 seconds
var gr = new GlideRecord('sys_log');
gr.addQuery('source', 'snow-flow');
gr.addQuery('u_duration_ms', '>', 10000);
gr.orderByDesc('u_duration_ms');
```

### **4. Usage Analytics:**
Track tool usage patterns:
```javascript
// Query: Most used tools per user
var gr = new GlideRecord('sys_log');
gr.addQuery('source', 'snow-flow');
gr.addQuery('u_operation', 'tool_execution');
gr.addQuery('sys_created_by', gs.getUserName());
```

### **5. Token Cost Analysis:**
Monitor token consumption:
```javascript
// Calculate token costs per project/team
var gr = new GlideRecord('sys_log');
gr.addQuery('source', 'snow-flow');
gr.addQuery('u_token_usage', '!=', '');
gr.addQuery('sys_created_on', '>=', gs.daysAgoStart(30)); // Last 30 days
```

## 🚀 **Getting Started**

### **1. Update to Latest Version:**
```bash
npm install -g snow-flow@latest
```

### **2. Verify Audit Logging:**
```bash
# Check if audit logging is active
snow_execute_script_with_output({
  script: "gs.info('Audit logging test from Snow-Flow');"
});

# Check ServiceNow logs
# Navigate to: System Logs > System Log > All
# Filter: Source = 'snow-flow'
```

### **3. Set Up Custom Fields (Optional):**
Als je extra custom fields wilt toevoegen aan sys_log:
```javascript
// Navigate to: System Definition > Tables
// Open: sys_log
// Add custom fields starting with 'u_' prefix for Snow-Flow data
```

## 📚 **Best Practices**

1. **Regular Log Review** - Check audit logs weekly voor anomalies
2. **Retention Policy** - Set up automatic cleanup van oude logs
3. **Alert Configuration** - Create alerts voor failed operations
4. **Access Control** - Limit access tot audit logs aan authorized personnel
5. **Backup Strategy** - Include audit logs in backup procedures

## 🔍 **Troubleshooting**

### **No Audit Logs Appearing:**
```bash
# Check environment variable
echo $SNOW_FLOW_AUDIT_LOGGING

# Verify ServiceNow connection
snow_execute_script_with_output({
  script: "gs.info('Connection test: ' + gs.getProperty('glide.servlet.uri'));"
});
```

### **Missing Custom Fields:**
Custom fields (u_*) zijn optional. Audit logging werkt ook zonder deze fields, maar je krijgt dan minder gedetailleerde metadata.

### **Performance Issues:**
```bash
# Disable audit logging temporarily
export SNOW_FLOW_AUDIT_LOGGING=false

# Or increase batch size (not recommended)
# Modify batchTimer settings in ServiceNowAuditLogger
```

---

**🎉 Met Snow-Flow Audit Logging krijg je complete visibility in alle ServiceNow activiteiten voor compliance, security en performance optimization!**

*Voor vragen of feature requests, open een issue op de GitHub repository.*