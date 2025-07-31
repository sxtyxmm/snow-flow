# ServiceNow Flow Generation Analysis

## Executive Summary

The current flow generation in snow-flow fails because it generates incorrect XML structure for ServiceNow flows. The main issues are:

1. **Wrong action format**: Using legacy `sys_hub_action_instance` instead of `sys_hub_action_instance_v2`
2. **Incorrect value encoding**: Passing raw JSON inputs instead of Base64+gzip encoded parameter arrays
3. **Missing flow logic**: Not generating `sys_hub_flow_logic_instance_v2` records
4. **Incomplete relationships**: Missing proper ui_id/parent_ui_id references

## Detailed Findings

### 1. Action Instance Structure (CRITICAL)

**Current (WRONG):**
```xml
<sys_hub_action_instance>
    <inputs>{"table":"sc_request","requested_for":"abel.tuter"}</inputs>
</sys_hub_action_instance>
```

**Required (CORRECT):**
```xml
<sys_hub_action_instance_v2>
    <value>H4sIAAAAAAAAA+1WTW/aMBT/K5HPQ0JAKJCb1q1M09ZO67RLlRvn...</value>
</sys_hub_action_instance_v2>
```

The `value` field contains a Base64-encoded, gzipped array of parameter objects:
```javascript
[
  {
    "name": "table",
    "value": "sc_request",
    "valueType": "static"
  },
  {
    "name": "requested_for",
    "value": "{{fd_data.trigger.current.opened_by}}",
    "valueType": "fd_data"
  }
]
```

### 2. Flow Logic Structure (MISSING)

Every flow requires `sys_hub_flow_logic_instance_v2` records to connect actions:

```xml
<sys_hub_flow_logic_instance_v2>
    <parent display_value="Equipment Request Approval">FLOW_SYS_ID</parent>
    <parent_ui_id>52</parent_ui_id>
    <ui_id>53</ui_id>
    <group_ui_id>53</group_ui_id>
    <type>53</type>
    <active>true</active>
    <ended>false</ended>
    <base_table>sys_hub_flow_logic_instance_v2</base_table>
</sys_hub_flow_logic_instance_v2>
```

### 3. Trigger Structure Updates

Triggers also use v2 format:

```xml
<sys_hub_trigger_instance_v2>
    <type>14</type>  <!-- 14 = Record Created/Updated -->
    <parent display_value="Flow Name">FLOW_SYS_ID</parent>
    <configuration>
        <value>ENCODED_CONFIG</value>
    </configuration>
</sys_hub_trigger_instance_v2>
```

### 4. Complete Flow Relationships

A working flow requires these interconnected records:

```
sys_hub_flow (main flow)
├── sys_hub_trigger_instance_v2 (triggers)
├── sys_hub_action_instance_v2 (actions)
└── sys_hub_flow_logic_instance_v2 (connections)
```

Each record must have:
- Unique `ui_id` within the flow
- Correct `parent_ui_id` references
- Proper `group_ui_id` for grouped actions
- Matching `parent` sys_id pointing to the flow

## Implementation Pattern

### Step 1: Encode Action Parameters

```javascript
function encodeActionValue(parameters) {
    // 1. Create parameter array
    const paramArray = parameters.map(param => ({
        name: param.name,
        value: param.value,
        valueType: param.valueType || "static"
    }));
    
    // 2. Convert to JSON string
    const jsonString = JSON.stringify(paramArray);
    
    // 3. Gzip compress
    const compressed = pako.gzip(jsonString);
    
    // 4. Base64 encode
    const base64 = Buffer.from(compressed).toString('base64');
    
    return base64;
}
```

### Step 2: Generate Flow Logic

```javascript
function generateFlowLogic(fromAction, toAction, flowSysId) {
    return {
        table: 'sys_hub_flow_logic_instance_v2',
        parent: flowSysId,
        parent_ui_id: fromAction.ui_id,
        ui_id: generateUniqueUiId(),
        group_ui_id: toAction.group_ui_id || toAction.ui_id,
        type: toAction.type, // Action type
        active: true,
        ended: false
    };
}
```

### Step 3: Complete XML Generation

```javascript
function generateFlowXML(flowDefinition) {
    const xml = {
        'unload': {
            'sys_hub_flow': [/* flow record */],
            'sys_hub_trigger_instance_v2': [/* triggers */],
            'sys_hub_action_instance_v2': [/* actions */],
            'sys_hub_flow_logic_instance_v2': [/* connections */]
        }
    };
    
    // Build XML with proper relationships
    return xmlBuilder.buildObject(xml);
}
```

## Common Pitfalls

1. **Don't use legacy tables**: Always use v2 versions of action/trigger/logic tables
2. **Don't pass raw JSON**: Always encode parameters as Base64+gzip arrays
3. **Don't skip flow logic**: Every action connection needs a flow_logic record
4. **Don't forget ui_ids**: Every component needs unique ui_id values
5. **Don't mix versions**: All components must use v2 format consistently

## Testing Approach

To verify correct implementation:

1. Generate XML with proper v2 structure
2. Import into ServiceNow via Update Set
3. Open in Flow Designer - should load without errors
4. Check action parameters decode correctly
5. Verify flow logic connections work

## Migration Path

To fix existing code:

1. Replace `sys_hub_action_instance` → `sys_hub_action_instance_v2`
2. Replace `inputs` field → encoded `value` field
3. Add `sys_hub_flow_logic_instance_v2` generation
4. Update trigger format to v2
5. Ensure all ui_id relationships are correct

## Example: Complete Working Flow

See `action-v2-implementation.js` for a complete working example that demonstrates:
- Proper parameter encoding
- Correct table structure
- Complete flow relationships
- Working XML generation