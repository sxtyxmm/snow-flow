# Migrating from snow-flow 1.3.x to 1.4.0

## Breaking Changes: Flow Creation Removed

Snow-flow v1.4.0 removes all flow creation functionality due to critical issues discovered during beta testing.

### Why This Change

- **38 critical bugs** found in flow creation functionality
- **0% success rate** in beta testing
- **Production stability** - maintains reliability of other features
- **Focus on what works** - widget development, update sets, authentication

### What No Longer Works

❌ **Removed Features:**
- `snow_create_flow` MCP tool
- `snow_deploy_flow` MCP tool  
- `snow_test_flow_with_mock` MCP tool
- `snow_link_catalog_to_flow` MCP tool
- `snow_validate_flow_definition` MCP tool
- `snow_flow_wizard` MCP tool
- `snow_analyze_flow_instruction` MCP tool
- `snow_intelligent_flow_analysis` MCP tool
- Flow templates and XML generators
- Automatic flow deployment
- Flow performance analysis

### What Still Works

✅ **Working Features:**
- ServiceNow authentication (`snow-flow auth login`)
- Update Set management (`snow-flow update-set create`)
- Widget development and deployment
- Table/field discovery and analysis
- Memory management (`snow-flow memory store/get`)
- Multi-agent coordination via swarm
- General ServiceNow operations
- MCP server functionality (non-flow tools)

## Alternative Approach

### Before v1.4.0 (Broken)
```bash
# This no longer works
snow-flow swarm "create approval flow for equipment requests"
```

### After v1.4.0 (Working Alternative)

**Step 1: Use snow-flow for planning and discovery**
```bash
# Plan your flow requirements
snow-flow memory store flow_requirements "Need approval workflow with SLA tracking, manager approval, and escalation to IT director after 24 hours"

# Discover related tables and fields
snow-flow swarm "analyze sc_request table fields and approval relationships"

# Store analysis results
snow-flow memory store approval_analysis "Request table supports approval_set, approver fields, and SLA integration"
```

**Step 2: Create flows in ServiceNow Flow Designer**
1. Log into your ServiceNow instance
2. Navigate to: **Flow Designer > Designer**
3. Create flows using the visual interface
4. Reference requirements stored in snow-flow memory

**Step 3: Use snow-flow for other automation**
```bash
# Create supporting widgets
snow-flow swarm "create approval dashboard widget showing pending requests"

# Create business rules if needed
snow-flow swarm "create business rule to notify managers of new equipment requests"

# Manage deployment with update sets
snow-flow update-set create "Equipment Approval Process" "Flow, widgets, and business rules"
```

## Migration Steps

### 1. Backup Current Flows
If you have flows created with snow-flow v1.3.x:
1. Export them from ServiceNow as XML
2. Store requirements in snow-flow memory for reference

### 2. Update snow-flow
```bash
# Update to v1.4.0
npm update -g snow-flow

# Verify version
snow-flow --version
```

### 3. Handle Flow Commands
Flow-related commands now show helpful error messages:
```bash
snow-flow swarm "create flow..."
# Shows: Flow creation has been removed from snow-flow v1.4.0+
#        Please use ServiceNow Flow Designer directly
```

### 4. Adapt Workflows

**Old Workflow (Broken):**
```bash
snow-flow swarm "create incident escalation flow"
```

**New Workflow (Working):**
```bash
# Plan and document
snow-flow memory store escalation_requirements "Need incident escalation after 4 hours to manager, 8 hours to director"

# Analyze supporting data
snow-flow swarm "analyze incident table SLA fields and user hierarchy"

# Create supporting components  
snow-flow swarm "create escalation notification widget for managers"

# Then create flow in ServiceNow Flow Designer manually
```

## Error Messages

If you try to use removed flow functionality, you'll see:

```
Flow creation has been removed from snow-flow v1.4.0+

Please use ServiceNow Flow Designer directly:
1. Log into your ServiceNow instance  
2. Navigate to: Flow Designer > Designer
3. Create flows using the visual interface

Snow-flow continues to support:
- Widget development
- Update Set management  
- Table/field discovery
- General ServiceNow operations
```

## Getting Help

- **GitHub Issues**: https://github.com/groeimetai/snow-flow/issues
- **Documentation**: Focus on widget development and ServiceNow integration
- **ServiceNow Flow Designer**: Use ServiceNow's official documentation for flow creation

## Why Not Fix the Bugs?

The flow creation feature had fundamental architectural issues:
- **Complex XML generation** with 38 different failure points
- **ServiceNow API variations** across different instance versions  
- **Authentication edge cases** in different deployment scenarios
- **Table version mismatches** between instances
- **Encoding issues** with flow definitions

Rather than maintain broken functionality, v1.4.0 focuses on what snow-flow does best: widget development, update set management, and ServiceNow integration.

---

**Snow-flow v1.4.0** - Focused, stable, reliable ServiceNow development automation.