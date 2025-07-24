# ServiceNow Flow Actions Quick Reference

## Most Common Flow Actions

### 1. Send Email Notification
**Action Type ID:** `6c82aa49736301103e1e7dd36c96193f`
```javascript
{
  notification_id: "email_template_sys_id",
  send_to: {
    user: "{{data_pill}}",
    group: "group_sys_id",
    email: "email@domain.com"
  },
  event_parm_1: "{{data_pill}}",
  event_parm_2: "{{data_pill}}"
}
```

### 2. Ask for Approval
**Action Type ID:** `75b8e80473a301104769b2e1576d43b8`
```javascript
{
  table: "table_name",
  record: "{{trigger.current}}",
  approvers: {
    user: "user_sys_id",
    group: "group_sys_id"
  },
  due_date: "{{date_pill}}"
}
// Outputs: approval_state, approver_comments
```

### 3. Create Record
**Action Type ID:** `8e4f1d99532301003e2c7dd36c9619e1`
```javascript
{
  table: "incident",
  field_values: {
    short_description: "{{data_pill}}",
    assigned_to: "{{user_pill}}",
    priority: "2"
  }
}
// Outputs: record_id, record, display_value
```

### 4. Update Record
**Action Type ID:** `8e8e8ba9532301003e2c7dd36c96199d`
```javascript
{
  table: "incident",
  record: "{{record_pill}}",
  field_values: {
    state: "6",
    close_notes: "Resolved"
  }
}
// Outputs: success, updated_record
```

### 5. Look Up Records
**Action Type ID:** `af8ef4e153230100dc1c5a1faa6a71cd`
```javascript
{
  table: "sys_user",
  conditions: "active=true^department={{dept_pill}}",
  return_all: false  // false returns first record only
}
// Outputs: records[], count, first_record
```

### 6. Run Script
**Action Type ID:** `1303e53d73d201003c6e7dd36c96196f`
```javascript
{
  script: `
    (function execute(inputs, outputs) {
      outputs.result = inputs.value * 2;
      outputs.message = 'Calculation complete';
    })(inputs, outputs);
  `,
  use_transaction: true
}
// Outputs: defined in script
```

### 7. REST
**Action Type ID:** `972ead52534301003c2a7dd36c9619a7`
```javascript
{
  rest_message: "rest_message_sys_id",
  rest_method: "method_sys_id",
  endpoint_override: "https://api.example.com/endpoint",
  headers: {
    "Authorization": "Bearer {{token}}"
  },
  request_body: "{{json_payload}}"
}
// Outputs: response_body, status_code, response_headers
```

### 8. If/Then Logic
**Action Type ID:** `7de4a729bf2031003b7fb249b0c87421`
```javascript
{
  conditions: {
    left_operand: "{{data_pill}}",
    operator: "is|is not|contains|greater than",
    right_operand: "value or {{pill}}"
  }
}
```

### 9. Wait For Condition
**Action Type ID:** `e7c1e4e553430100bfe92e1faf6a7156`
```javascript
{
  table: "approval",
  record: "{{approval_record}}",
  condition: "state=approved^ORstate=rejected",
  timeout: "86400"  // seconds (24 hours)
}
```

### 10. Delete Record
**Action Type ID:** `8e8e8ba9532301003e2c7dd36c961975`
```javascript
{
  table: "table_name",
  record: "{{record_to_delete}}"
}
// Outputs: success
```

## Common Trigger Types

### Record Created
**Trigger Type ID:** `e7c1e465536301003e2c7dd36c961939`
```javascript
{
  table: "incident",
  condition: "priority=1"
}
```

### Record Updated
**Trigger Type ID:** `e7c5ac65536301003e2c7dd36c96193a`
```javascript
{
  table: "incident",
  condition: "state=6",
  field_watch_list: ["state", "assigned_to"]
}
```

### Scheduled
**Trigger Type ID:** `0422e965536301003e2c7dd36c96190b`
```javascript
{
  schedule_type: "daily",
  time: "08:00:00",
  timezone: "America/New_York"
}
```

## Data Pill Reference Patterns

### Trigger Data
- Current record: `{{trigger.current}}`
- Field value: `{{trigger.current.field_name}}`
- Reference field: `{{trigger.current.assigned_to.name}}`

### Step Outputs
- Step output: `{{1 - Step Name.output_field}}`
- Array access: `{{2 - Look Up Records.records[0].name}}`

### Flow Variables
- Variable: `{{flow_var.variable_name}}`

### System Properties
- Current user: `{{system.user.sys_id}}`
- Current time: `{{system.now}}`

## Common Connection Types

### Sequential
```javascript
{
  from: "step_1",
  to: "step_2",
  type: "sequential"
}
```

### Conditional (from If/Then)
```javascript
{
  from: "if_step",
  to: "then_step",
  type: "conditional",
  condition_met: true  // or false for else branch
}
```

### Error Handling
```javascript
{
  from: "risky_step",
  to: "error_handler",
  type: "error",
  error_type: "all"  // or specific error type
}
```

## Tips
1. Always use exact sys_ids for action types
2. Test with inactive flows first
3. Use meaningful step names for easier data pill references
4. Add error handling for external integrations
5. Leverage subflows for reusable logic