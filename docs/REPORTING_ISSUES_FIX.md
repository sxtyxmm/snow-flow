# ServiceNow Reporting Issues - FIXED v3.0.11

## 🔧 Issues Identified & Fixed

### 1. Invalid Table Name Errors - FIXED ✅

**Problem:** Users getting errors like:
- `Exception encountered processing path: /GlideListLayout_Query/getListLayout - Invalid table name ITSM Overview Metrics`
- `Invalid table name Change Request Pipeline`

**Root Cause:** Users providing descriptive names instead of actual ServiceNow table names

**Solution:** Added intelligent table name mapping and validation:

```typescript
// Maps common user inputs to real ServiceNow tables
'itsm overview metrics' → 'incident'
'itsm trend analysis' → 'incident' 
'change request pipeline' → 'change_request'
'incident overview' → 'incident'
'change overview' → 'change_request'
// + more mappings
```

### 2. 403 Forbidden Errors - FIXED ✅

**Problem:** 
- `MCP error -32603: Failed to create Dashboard: Request failed with status code 403`
- Users unable to create dashboards due to permission issues

**Root Cause:** Missing ServiceNow roles for Performance Analytics

**Solution:** Added permission checking with helpful error messages:

```typescript
// Checks for required roles: pa_admin, pa_power_user, admin
// Provides clear instructions when permissions missing
```

## 🚀 New Features Added

### Smart Table Resolution
- **Fuzzy Matching**: "ITSM Overview" → finds "incident" table
- **Exact Mapping**: Direct mapping of common phrases
- **Suggestions**: Shows similar tables when none found
- **Validation**: Sanitizes and validates table names

### Permission Detection  
- **Pre-Flight Checks**: Tests permissions before attempting operations
- **Clear Error Messages**: Shows exactly what roles are needed
- **Alternative Solutions**: Suggests workarounds when permissions missing

### Better Error Handling
- **Descriptive Errors**: Instead of generic "Table not found"
- **Suggestions**: "Did you mean: incident, change_request, problem?"
- **Common Tables**: Lists frequently used ServiceNow tables

## 📋 Usage Examples

### Before (Broken):
```javascript
snow_create_report({
  name: "ITSM Trend Analysis",
  table: "ITSM Overview Metrics"  // ❌ Invalid table name
})
```

### After (Fixed):
```javascript
snow_create_report({
  name: "ITSM Trend Analysis", 
  table: "ITSM Overview Metrics"  // ✅ Auto-mapped to 'incident'
})

// Or use correct table names directly:
snow_create_report({
  name: "Incident Trend Analysis",
  table: "incident"  // ✅ Direct table name
})
```

## 🔍 Permission Error Handling

### Before (Confusing):
```
MCP error -32603: Failed to create Dashboard: Request failed with status code 403
```

### After (Clear):
```
❌ Insufficient permissions to create dashboards.

🔒 Required roles: pa_admin, pa_power_user, admin
💡 Current user needs one of these roles to create dashboards.

🛠️ Solutions:
1. Request admin to assign required role
2. Use reports instead: snow_create_report
3. Create Service Portal widget: snow_deploy with type='widget'
```

## ✅ What's Fixed

1. **Table Name Resolution**:
   - "ITSM Overview Metrics" → `incident`
   - "Change Request Pipeline" → `change_request`
   - Smart fuzzy matching for partial names

2. **403 Permission Errors**:
   - Pre-checks permissions before creating dashboards
   - Clear error messages with solutions
   - Role requirement explanations

3. **Better User Experience**:
   - Helpful suggestions when tables not found
   - Lists common ServiceNow tables
   - Multiple fallback options

## 📊 ServiceNow Table Reference

### Common Tables Users Reference:
- **"ITSM Overview"** → `incident`
- **"Change Pipeline"** → `change_request`  
- **"Problem Overview"** → `problem`
- **"Task Overview"** → `task`
- **"User Overview"** → `sys_user`
- **"Service Requests"** → `sc_request`
- **"Knowledge"** → `kb_knowledge`
- **"Assets"** → `alm_asset`
- **"Configuration Items"** → `cmdb_ci`

### Required Roles for Dashboards:
- `pa_admin` - Performance Analytics Administrator
- `pa_power_user` - PA Power User
- `admin` - System Administrator

## 🧪 Testing

The fixes automatically handle:
1. Invalid table names → Converts to valid ones
2. Missing permissions → Shows clear error with solutions
3. Fuzzy matches → Finds closest table match
4. Suggestions → Helps users find the right table

Users should no longer see cryptic errors and will get helpful guidance instead! 🎉