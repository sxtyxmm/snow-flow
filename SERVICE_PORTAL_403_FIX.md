# Service Portal 403 Error Fix Guide

## Common Causes & Solutions

### 1. OAuth Application Scope Issues
Even with sp_admin role, OAuth applications may have restricted access to Service Portal tables.

**Fix in ServiceNow:**
1. Navigate to: **System OAuth > Application Registry**
2. Find your OAuth application
3. Check these settings:
   - **Accessible from**: Set to "All application scopes"
   - **Refresh Token Lifespan**: Increase to 86400 (24 hours)
   - **Access Token Lifespan**: Increase to 7200 (2 hours)

### 2. Cross-Scope Access Restrictions
Service Portal widgets (sp_widget) may have cross-scope restrictions.

**Fix:**
1. Go to: **System Applications > Applications**
2. Switch to **Global** scope
3. Navigate to: **System Security > Access Control (ACL)**
4. Search for ACLs on table: `sp_widget`
5. Check for any custom ACLs that might block API access
6. Ensure these operations are allowed:
   - create
   - write
   - delete

### 3. Service Portal Specific Permissions
The sp_admin role might not have all necessary permissions.

**Additional Roles to Check:**
- `sp_portal_admin` - Portal administration
- `sp_widget_editor` - Widget editing
- `admin` - System administration
- `rest_api_explorer` - REST API access

### 4. Instance Security Settings
Some instances have additional security hardening.

**Check these settings:**
1. **System Properties > Service Portal**
   - `glide.service_portal.enable_api_access` = true
   - `glide.service_portal.allow_public_api` = true (if needed)

2. **System Web Services > REST API Explorer**
   - Ensure sp_widget table is accessible

### 5. Update Set Context
Widgets must be created in an active Update Set.

**Fix:**
1. Create/switch to an Update Set before deployment
2. Use the MCP tool: `snow_update_set_create` or `snow_ensure_active_update_set`

## Recommended MCP Tool Approach

```javascript
// 1. First ensure Update Set
await snow_ensure_active_update_set({
  context: "Service Portal Development"
});

// 2. Try deployment with explicit scope
await snow_deploy({
  type: "widget",
  config: {
    name: "your_widget",
    // ... widget config
  },
  scope_preference: "global", // Force global scope
  auto_update_set: true
});
```

## Alternative: Manual Deployment Steps

If API deployment continues to fail:

1. **In ServiceNow UI:**
   - Switch to **Global** application scope
   - Navigate to **Service Portal > Widgets**
   - Click "New"
   - Copy/paste the generated code

2. **Via Studio:**
   - Open Studio in Global scope
   - Create new widget
   - Paste code sections

## Debugging Commands

```bash
# Check current authentication
snow_auth_diagnostics({
  run_write_test: true,
  include_recommendations: true
});

# Test sp_widget table access specifically
snow_validate_deployment({
  type: "widget",
  artifact: { name: "test_widget" }
});
```

## Instance-Specific Settings

For developer instances (dev***.service-now.com):
- May have stricter security settings
- Consider requesting PDI admin to adjust OAuth settings
- Check with instance owner for any custom security policies