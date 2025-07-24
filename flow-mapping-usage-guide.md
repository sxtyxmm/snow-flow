# ServiceNow Flow Component Mapping Usage Guide

## Overview
This guide explains how to use the ServiceNow Flow Component XML mappings to create, parse, and deploy flows programmatically.

## Key Concepts

### 1. Flow Structure
Every ServiceNow flow consists of:
- **Metadata**: sys_id, name, description, table, active status
- **Trigger**: Defines when the flow starts
- **Variables**: Flow-level variables accessible throughout
- **Steps**: Individual actions to execute
- **Connections**: Define execution order and logic flow
- **Outputs**: Values returned from the flow

### 2. Action Type IDs
ServiceNow uses consistent sys_ids for action types across instances:
- These IDs are hardcoded in the platform
- Always use the exact sys_id when creating flows programmatically
- The internal_name can vary but sys_id remains constant

### 3. Data Pills
Data pills represent dynamic values in flows:
- **Trigger data**: `{{trigger.current.field_name}}`
- **Step outputs**: `{{Step Name.output_field}}`
- **Flow variables**: `{{flow_var.variable_name}}`
- **System properties**: `{{system.property_name}}`

## Creating Flows Programmatically

### Step 1: Define Flow Metadata
```javascript
const flowDefinition = {
  name: "My Automated Flow",
  internal_name: "my_automated_flow",
  description: "Flow created via API",
  table: "incident",
  type: "flow",
  active: true
};
```

### Step 2: Configure Trigger
```javascript
const trigger = {
  type: "e7c1e465536301003e2c7dd36c961939", // Record Created
  table: "incident",
  condition: "priority=1^active=true"
};
```

### Step 3: Add Actions
```javascript
const steps = [
  {
    name: "1 - Send Notification",
    action_type: "6c82aa49736301103e1e7dd36c96193f",
    inputs: {
      notification_id: "notification_sys_id",
      send_to: {
        user: "{{trigger.current.assigned_to}}"
      }
    }
  },
  {
    name: "2 - Update Record",
    action_type: "8e8e8ba9532301003e2c7dd36c96199d",
    inputs: {
      table: "incident",
      record: "{{trigger.current}}",
      field_values: {
        state: "2",
        work_notes: "Notification sent"
      }
    }
  }
];
```

### Step 4: Define Connections
```javascript
const connections = [
  {
    from: "trigger",
    to: "1 - Send Notification",
    type: "sequential"
  },
  {
    from: "1 - Send Notification",
    to: "2 - Update Record",
    type: "sequential"
  }
];
```

## Converting to ServiceNow API Format

### Flow Designer API Structure
```javascript
const apiPayload = {
  "name": flowDefinition.name,
  "description": flowDefinition.description,
  "definition": {
    "triggers": [trigger],
    "actions": steps.map((step, index) => ({
      "id": `action_${index}`,
      "name": step.name,
      "type": step.action_type,
      "inputs": step.inputs
    })),
    "connections": connections
  }
};
```

## Common Patterns

### 1. Approval Pattern
```javascript
// Ask for approval
const approvalStep = {
  action_type: "75b8e80473a301104769b2e1576d43b8",
  inputs: {
    table: "change_request",
    record: "{{trigger.current}}",
    approvers: {
      group: "cab_approval_group_sys_id"
    }
  }
};

// Check approval result
const checkApproval = {
  action_type: "7de4a729bf2031003b7fb249b0c87421", // If condition
  conditions: {
    left_operand: "{{Ask for Approval.approval_state}}",
    operator: "is",
    right_operand: "approved"
  }
};
```

### 2. Notification Pattern
```javascript
const notificationStep = {
  action_type: "6c82aa49736301103e1e7dd36c96193f",
  inputs: {
    notification_id: "email_template_sys_id",
    send_to: {
      user: "{{trigger.current.requested_for}}",
      group: "{{trigger.current.assignment_group}}"
    },
    event_parm_1: "{{trigger.current.number}}",
    event_parm_2: "{{trigger.current.short_description}}"
  }
};
```

### 3. REST API Pattern
```javascript
const restStep = {
  action_type: "972ead52534301003c2a7dd36c9619a7",
  inputs: {
    rest_message: "rest_message_sys_id",
    rest_method: "rest_method_sys_id",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{flow_var.api_token}}"
    },
    request_body: JSON.stringify({
      incident_number: "{{trigger.current.number}}",
      status: "{{trigger.current.state}}"
    })
  }
};
```

## Parsing Existing Flows

### Extract Components from XML
```javascript
function parseFlowXML(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");
  
  return {
    metadata: {
      sys_id: doc.querySelector("sys_id").textContent,
      name: doc.querySelector("name").textContent,
      table: doc.querySelector("table").textContent
    },
    trigger: {
      type: doc.querySelector("trigger > type").textContent,
      condition: doc.querySelector("trigger > condition").textContent
    },
    steps: Array.from(doc.querySelectorAll("step")).map(step => ({
      name: step.querySelector("name").textContent,
      action_type: step.querySelector("action_type").textContent,
      order: step.querySelector("order").textContent
    }))
  };
}
```

## Best Practices

### 1. Use Exact sys_ids
Always use the exact action_type_id values from the mapping document. These are consistent across ServiceNow instances.

### 2. Validate Data Pills
Ensure data pill references are valid:
- Check that referenced steps exist
- Verify output fields are available
- Use proper path notation

### 3. Error Handling
Add error connections for critical steps:
```javascript
{
  from: "REST API Call",
  to: "Error Handler",
  type: "error",
  error_type: "all"
}
```

### 4. Testing
- Start with flows in inactive state
- Use test tables/records
- Enable flow debugging
- Check execution history

### 5. Variable Naming
- Use descriptive names
- Follow snake_case convention
- Prefix with context (e.g., `approval_group`, `notification_template`)

## Deployment Considerations

### 1. Scope
- Flows can be global or scoped to applications
- Action availability depends on installed plugins
- Some actions require specific roles

### 2. Performance
- Limit lookup operations
- Use bulk operations where possible
- Consider async execution for long-running tasks

### 3. Maintenance
- Document complex logic
- Use subflows for reusable components
- Version control flow definitions

## Troubleshooting

### Common Issues
1. **Invalid action_type_id**: Verify the sys_id exists in your instance
2. **Missing data pills**: Check step names and output availability
3. **Connection errors**: Ensure all referenced steps exist
4. **Permission errors**: Verify user has flow_designer role

### Debug Tips
- Enable flow debugging in Flow Designer
- Check flow execution history
- Review system logs for errors
- Test with simplified versions first

## Next Steps
1. Review the complete mapping document for all action types
2. Practice creating simple flows programmatically
3. Explore advanced patterns like parallel execution and loops
4. Integrate with ServiceNow APIs for automated deployment