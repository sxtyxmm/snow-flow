# ServiceNow Flow XML Structure Research Report

## Executive Summary

This report documents the exact XML structure ServiceNow uses for flows in Update Sets based on research of actual ServiceNow instances and documentation.

## Core Tables for Flow Designer

### 1. `sys_hub_flow` - Main Flow Record
The primary table storing flow definitions.

**Key Fields:**
- `sys_id`: Unique identifier (32-character GUID)
- `name`: Display name of the flow
- `internal_name`: System name (lowercase, underscores)
- `type`: "flow", "subflow", or "action"
- `description`: HTML-formatted description
- `active`: Boolean (true/false)
- `master_snapshot`: Reference to sys_hub_flow_snapshot
- `latest_snapshot`: Reference to sys_hub_flow_snapshot
- `status`: "draft" or "published"
- `access`: "public" or "private"
- `run_as`: "user" or "system"
- `callable_by_client_api`: Boolean
- `sc_callable`: Boolean for Service Catalog

### 2. `sys_hub_flow_snapshot` - Flow Version Storage
Stores versioned snapshots of flows.

**Key Fields:**
- `sys_id`: Unique identifier
- `parent_flow`: Reference to sys_hub_flow
- `name`: Snapshot name
- `master`: Boolean indicating if this is master
- `label_cache`: JSON array of variable metadata

### 3. `sys_hub_trigger_instance` - Flow Triggers
Defines what triggers a flow.

**Key Fields:**
- `sys_id`: Unique identifier
- `flow`: Reference to sys_hub_flow
- `trigger_type`: Type of trigger
- `trigger_definition`: JSON configuration
- `table`: Target table for record triggers
- `condition`: Trigger condition

### 4. `sys_hub_action_instance` - Flow Actions
Individual actions within a flow.

**Key Fields:**
- `sys_id`: Unique identifier
- `flow`: Reference to sys_hub_flow
- `action_type`: Type of action
- `action_definition`: JSON configuration
- `order`: Execution order

### 5. `sys_hub_flow_variable` - Flow Variables
Variables used within flows.

**Key Fields:**
- `sys_id`: Unique identifier
- `flow`: Reference to sys_hub_flow
- `name`: Variable name
- `type`: Data type
- `default_value`: Default value

## Update Set XML Structure

### XML Namespace and Schema
```xml
<?xml version="1.0" encoding="UTF-8"?>
<unload unload_date="2025-07-24 08:00:00">
```

### sys_hub_flow Record Structure
```xml
<sys_hub_flow action="INSERT_OR_UPDATE">
    <access>public</access>
    <acls/>
    <active>true</active>
    <annotation/>
    <callable_by_client_api>false</callable_by_client_api>
    <category/>
    <copied_from/>
    <description><![CDATA[<p>Flow description HTML</p>]]></description>
    <internal_name>flow_internal_name</internal_name>
    <label_cache><![CDATA[JSON_ARRAY_OF_LABELS]]></label_cache>
    <latest_snapshot>SNAPSHOT_SYS_ID</latest_snapshot>
    <master_snapshot>SNAPSHOT_SYS_ID</master_snapshot>
    <name>Flow Display Name</name>
    <natlang/>
    <outputs/>
    <remote_trigger_id/>
    <run_as>user</run_as>
    <run_with_roles/>
    <sc_callable>false</sc_callable>
    <status>published</status>
    <sys_class_name>sys_hub_flow</sys_class_name>
    <sys_created_by>admin</sys_created_by>
    <sys_created_on>2025-07-24 08:00:00</sys_created_on>
    <sys_id>UNIQUE_32_CHAR_SYS_ID</sys_id>
    <sys_mod_count>0</sys_mod_count>
    <sys_name>Flow Display Name</sys_name>
    <sys_package display_value="Package Name" source="x_scope">PACKAGE_SYS_ID</sys_package>
    <sys_policy/>
    <sys_scope display_value="Scope Name">SCOPE_SYS_ID</sys_scope>
    <sys_update_name>sys_hub_flow_SYS_ID</sys_update_name>
    <sys_updated_by>admin</sys_updated_by>
    <sys_updated_on>2025-07-24 08:00:00</sys_updated_on>
    <type>flow</type>
</sys_hub_flow>
```

### Flow Definition JSON Structure (within CDATA)
The actual flow logic is stored as JSON within various fields:

```json
{
  "definition": {
    "actions": [
      {
        "id": "ACTION_UUID",
        "type": "CORE_ACTION_TYPE",
        "name": "Action Name",
        "inputs": {
          "inputField": {
            "value": "literal_value",
            "reference": "variable_reference"
          }
        },
        "outputs": {
          "outputField": {
            "name": "output_variable_name"
          }
        }
      }
    ],
    "triggers": [
      {
        "id": "TRIGGER_UUID",
        "type": "TRIGGER_TYPE",
        "table": "target_table",
        "condition": "encoded_query"
      }
    ],
    "stages": [
      {
        "id": "STAGE_UUID",
        "name": "Stage Name",
        "actions": ["ACTION_UUID"]
      }
    ]
  }
}
```

## Critical XML Elements and Attributes

### Required Elements for sys_hub_flow
1. `sys_id` - Must be unique 32-character GUID
2. `name` - Display name
3. `internal_name` - System name (no spaces, lowercase)
4. `type` - Must be "flow", "subflow", or "action"
5. `active` - Boolean value
6. `sys_class_name` - Must be "sys_hub_flow"
7. `sys_scope` - Scope reference

### Sys ID Generation Requirements
- Format: 32 hexadecimal characters
- Must be globally unique
- Typically generated using GUIDGenerator in ServiceNow
- Example: `a1b2c3d4e5f6789012345678901234ab`

### Relationship Mappings
1. Flow → Snapshot: via `master_snapshot` and `latest_snapshot`
2. Flow → Triggers: sys_hub_trigger_instance.flow references sys_hub_flow
3. Flow → Actions: sys_hub_action_instance.flow references sys_hub_flow
4. Flow → Variables: sys_hub_flow_variable.flow references sys_hub_flow

## JSON Structures Within CDATA

### Flow Definition Structure
```json
{
  "definition": {
    "steps": {},
    "actions": [],
    "triggers": [],
    "outputs": [],
    "inputs": []
  }
}
```

### Action Definition Example
```json
{
  "id": "unique-action-id",
  "type": "com.glide.hub.action.rest",
  "name": "REST Call",
  "inputs": {
    "url": {"value": "https://api.example.com"},
    "method": {"value": "GET"},
    "headers": {"value": {}}
  }
}
```

### Trigger Definition Example
```json
{
  "id": "unique-trigger-id",
  "type": "record_create",
  "table": "incident",
  "condition": "priority=1^active=true"
}
```

## XML Character Encoding Requirements
- Use CDATA sections for JSON content
- HTML content must be escaped within CDATA
- Special characters: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`
- Quotes in JSON must be properly escaped

## Complete Example Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<unload unload_date="2025-07-24 08:00:00">
    <!-- Main flow record -->
    <sys_hub_flow action="INSERT_OR_UPDATE">
        <!-- All fields as shown above -->
    </sys_hub_flow>
    
    <!-- Flow snapshot -->
    <sys_hub_flow_snapshot action="INSERT_OR_UPDATE">
        <parent_flow>FLOW_SYS_ID</parent_flow>
        <!-- Other snapshot fields -->
    </sys_hub_flow_snapshot>
    
    <!-- Trigger instances -->
    <sys_hub_trigger_instance action="INSERT_OR_UPDATE">
        <flow>FLOW_SYS_ID</flow>
        <!-- Trigger configuration -->
    </sys_hub_trigger_instance>
    
    <!-- Action instances -->
    <sys_hub_action_instance action="INSERT_OR_UPDATE">
        <flow>FLOW_SYS_ID</flow>
        <!-- Action configuration -->
    </sys_hub_action_instance>
</unload>
```

## Key Findings

1. **Multi-Table Structure**: Flows are not stored in a single table but spread across multiple related tables
2. **JSON within XML**: The actual flow logic is stored as JSON within XML CDATA sections
3. **Versioning**: Uses snapshot system for version control
4. **References**: Heavy use of sys_id references between tables
5. **No Single Definition Field**: Unlike expectations, there's no single "flow_definition" field containing all JSON

## Recommendations for Implementation

1. **Generate Valid Sys IDs**: Use proper GUID generation for all sys_id fields
2. **Maintain Relationships**: Ensure all references between tables are valid
3. **Use CDATA Properly**: Wrap all JSON content in CDATA sections
4. **Include All Related Records**: Don't forget trigger, action, and variable records
5. **Respect Field Constraints**: Follow max lengths, required fields, and data types

## Further Research Needed

1. Exact JSON schema for different action types
2. Complete list of trigger types and their configurations
3. Flow-to-subflow linking mechanisms
4. Variable scoping and data passing between actions
5. Error handling and retry configuration storage