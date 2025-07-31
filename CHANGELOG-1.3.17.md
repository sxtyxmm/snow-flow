# Snow-Flow v1.3.17 - Critical Flow Generation & MCP Runtime Fixes

## 🚨 Major Fixes: ServiceNow Flow Designer & MCP Tool Errors

This release fixes critical issues with Flow Designer integration and MCP tool runtime errors that prevented proper ServiceNow operations.

### 🐛 Fixed

#### 1. Flow Generation Engine Completely Overhauled
- **Fixed v2 Action Encoding**: Actions now use correct `sys_hub_action_instance_v2` structure with Base64+gzip encoded parameter arrays
- **Added Flow Logic Records**: Implemented `sys_hub_flow_logic_instance_v2` to properly connect actions in the flow
- **Corrected Action Type IDs**: Using real ServiceNow action type sys_ids instead of placeholder values
- **UI Integration**: Added required `ui_id` fields for Flow Designer visual rendering
- **Parameter Structure**: Fixed encoding to use proper parameter array format:
  ```javascript
  // Before (WRONG):
  { table: "sc_request", user: "john.doe" }
  
  // After (CORRECT):
  [
    { name: "table", value: "sc_request", valueType: "static" },
    { name: "user", value: "john.doe", valueType: "static" }
  ]
  ```

#### 2. MCP Table Discovery Error Fixed
- **Issue**: `snow_table_schema_discovery` throwing "Table not found: incident" for standard ServiceNow tables
- **Cause**: Standard tables like 'incident' may not appear in sys_db_object API queries
- **Fix**: Added fallback mapping for known standard tables:
  - incident, problem, change_request, sc_request, sc_req_item, sc_task, task
- **Impact**: Platform development tools now work correctly with all standard ServiceNow tables

#### 3. Update Set Creation Error Fixed  
- **Issue**: `snow_update_set_create` throwing "Cannot read properties of undefined (reading 'sys_id')"
- **Cause**: Missing validation of API response structure before accessing properties
- **Fix**: Added response validation to ensure `response.result` exists before accessing `sys_id`
- **Impact**: Update Set management now handles API errors gracefully

#### 4. XML Update Set Deployment Added
- **Issue**: `snow_deploy` not supporting `xml_update_set` type, causing "Unsupported artifact type" error
- **Cause**: Missing case in deployment switch statement for XML update sets
- **Fix**: Added complete XML update set deployment workflow:
  - Import XML to ServiceNow as remote update set
  - Automatic preview and conflict detection
  - Auto-commit when clean (configurable)
  - Detailed progress reporting and error handling
- **Impact**: Flow XML files can now be deployed directly via `snow_deploy` tool

#### 5. Init Command Feedback Improved
- **Issue**: Users reported ".env file not being created" when it already existed
- **Fix**: Enhanced logging to clearly show:
  - When creating new .env file: "📄 Creating new .env file... ✅ .env file created successfully"
  - When .env exists: "⚠️ .env file already exists, creating .env.example template instead"

### 🔧 Technical Details

Based on deep analysis of working ServiceNow flows, we identified and fixed:

1. **Table Version Mismatch**: Was using `sys_hub_action_instance` (v1), now uses `sys_hub_action_instance_v2`
2. **Encoding Format**: Was encoding raw inputs object, now encodes proper parameter array structure
3. **Missing Components**: Added required flow logic records that connect actions together
4. **Real Action IDs**: Updated with actual ServiceNow action type sys_ids from production flows

### 📝 Files Modified
- `src/utils/improved-flow-xml-generator.ts` - Flow generation v2 implementation
- `src/mcp/servicenow-platform-development-mcp.ts` - Added standard table fallback
- `src/mcp/servicenow-update-set-mcp.ts` - Added response validation
- `src/mcp/servicenow-update-set-mcp-refactored.ts` - Added response validation
- `src/cli.ts` - Improved init command logging

### 📝 Documentation Added  
- `SERVICENOW_ACTION_ANALYSIS.md` - Complete technical analysis of the flow generation issues
- `action-v2-implementation.js` - Reference implementation for correct action encoding
- `decode-action-values.js` - Utility to decode and inspect ServiceNow action values

### 🚀 Impact

Flows generated with snow-flow will now:
- ✅ Import successfully into ServiceNow
- ✅ Appear correctly in Flow Designer
- ✅ Execute without "sys_id not found" errors
- ✅ Support all standard flow actions (approval, notification, update record, etc.)

### 💡 Usage

No changes required to your workflow. Simply use snow-flow as before:

```bash
snow-flow swarm "create approval flow for equipment requests"
```

The flow generation will automatically use the corrected v2 format.

### 🙏 Credits

Special thanks to the multi-agent analysis team that discovered the root cause:
- XML Structure Analyst
- Action Pattern Analyst  
- Flow Logic Analyst
- Integration Specialist
- Implementation Agent

---

**Full Changelog**: https://github.com/Niels-IO/snow-flow/compare/v1.3.16...v1.3.17