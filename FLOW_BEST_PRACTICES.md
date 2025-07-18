# ServiceNow Flow Creation Best Practices

## Current Approach Analysis

### What We Fixed
1. **Flow Name Parsing**: Now correctly extracts quoted names without including quotes in internal_name
2. **Minimal Required Fields**: Only adding essential fields that ServiceNow needs

### Best Practice Recommendations

## 1. Dynamic Field Discovery
Instead of hardcoding fields, we should:
- Query ServiceNow for the actual flow structure
- Use the REST API Explorer to understand required fields
- Cache field definitions for performance

## 2. Flow Creation Process
The ideal flow creation should be:
1. Create minimal flow record with only required fields
2. Let ServiceNow auto-populate defaults
3. Use ServiceNow's own Flow Designer APIs when available
4. Validate the flow structure after creation

## 3. Error Handling
For the "cannot invoke com.glide.flow_design.action.model.Flow" error:
- This typically means missing required relationships
- Could be missing sys_hub_flow_logic entries
- May need proper flow versioning/snapshot

## 4. Alternative Approach
Consider using ServiceNow's Flow Designer REST API directly:
```javascript
// Instead of creating individual records, use Flow Designer API
POST /api/now/flow/flow_designer/flow
{
  "name": "Flow Name",
  "description": "Description",
  "definition": {
    "trigger": {...},
    "actions": [...]
  }
}
```

## 5. XML Generation
The flow-xml-generator.ts was removed because:
- Snow-flow should handle everything autonomously
- XML should only be used for export/import, not creation
- Direct API calls are more reliable than XML imports

## Next Steps
1. Research ServiceNow Flow Designer REST APIs
2. Implement dynamic field discovery
3. Use minimal approach - let ServiceNow handle defaults
4. Add debugging capabilities to understand flow structure issues