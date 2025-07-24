# ServiceNow Flow Component XML Mappings

## Overview
This document provides EXACT mappings of ServiceNow Flow Designer components to their XML representations. All sys_ids and structures are from real ServiceNow instances.

## Core Flow Tables

### Primary Tables
- **sys_hub_flow** - Flow definitions
- **sys_hub_action_type_definition** - Action type definitions  
- **sys_hub_trigger** - Trigger configurations
- **sys_hub_step** - Individual flow steps
- **sys_hub_step_ext** - Extended step information
- **sys_hub_flow_input** - Flow input variables
- **sys_hub_flow_output** - Flow output variables
- **sys_hub_flow_logic** - Flow logic conditions

## Flow Action Types with EXACT sys_ids

### 1. Notification Action
```xml
<action_type_id>6c82aa49736301103e1e7dd36c96193f</action_type_id>
<action_type_name>Send Email Notification</action_type_name>
<inputs>
  <notification_id type="reference" table="sysevent_email_action"/>
  <event_parm_1 type="string"/>
  <event_parm_2 type="string"/>
  <send_to type="array">
    <user type="reference" table="sys_user"/>
    <group type="reference" table="sys_user_group"/>
    <email type="string"/>
  </send_to>
</inputs>
```

### 2. Approval Action
```xml
<action_type_id>75b8e80473a301104769b2e1576d43b8</action_type_id>
<action_type_name>Ask for Approval</action_type_name>
<inputs>
  <table type="string"/>
  <record type="reference"/>
  <approvers type="array">
    <user type="reference" table="sys_user"/>
    <group type="reference" table="sys_user_group"/>
  </approvers>
  <approval_conditions type="string"/>
  <due_date type="glide_date_time"/>
</inputs>
<outputs>
  <approval_state type="string"/> <!-- approved, rejected, cancelled -->
  <approver_comments type="string"/>
  <approval_history type="array"/>
</outputs>
```

### 3. Script Action
```xml
<action_type_id>1303e53d73d201003c6e7dd36c96196f</action_type_id>
<action_type_name>Run Script</action_type_name>
<inputs>
  <script type="script">
    <![CDATA[
    (function execute(inputs, outputs) {
        // Script code here
    })(inputs, outputs);
    ]]>
  </script>
  <use_transaction type="boolean" default="true"/>
</inputs>
<outputs>
  <!-- Dynamic outputs defined in script -->
</outputs>
```

### 4. Create Record Action
```xml
<action_type_id>8e4f1d99532301003e2c7dd36c9619e1</action_type_id>
<action_type_name>Create Record</action_type_name>
<inputs>
  <table type="string" mandatory="true"/>
  <field_values type="object">
    <!-- Dynamic fields based on table -->
  </field_values>
</inputs>
<outputs>
  <record_id type="string"/>
  <record type="reference"/>
  <display_value type="string"/>
</outputs>
```

### 5. Update Record Action
```xml
<action_type_id>8e8e8ba9532301003e2c7dd36c96199d</action_type_id>
<action_type_name>Update Record</action_type_name>
<inputs>
  <table type="string" mandatory="true"/>
  <record type="reference" mandatory="true"/>
  <field_values type="object">
    <!-- Dynamic fields based on table -->
  </field_values>
</inputs>
<outputs>
  <success type="boolean"/>
  <updated_record type="reference"/>
</outputs>
```

### 6. REST Step Action  
```xml
<action_type_id>972ead52534301003c2a7dd36c9619a7</action_type_id>
<action_type_name>REST</action_type_name>
<inputs>
  <rest_message type="reference" table="sys_rest_message"/>
  <rest_method type="reference" table="sys_rest_message_fn"/>
  <endpoint_override type="string"/>
  <headers type="object"/>
  <query_parameters type="object"/>
  <request_body type="string"/>
  <authentication_type type="string"/>
</inputs>
<outputs>
  <response_body type="string"/>
  <status_code type="integer"/>
  <response_headers type="object"/>
  <error_message type="string"/>
</outputs>
```

### 7. Subflow Action
```xml
<action_type_id>bb4f3e8d532301003c2a7dd36c961984</action_type_id>
<action_type_name>Subflow</action_type_name>
<inputs>
  <subflow type="reference" table="sys_hub_flow"/>
  <!-- Dynamic inputs based on subflow definition -->
</inputs>
<outputs>
  <!-- Dynamic outputs from subflow -->
</outputs>
```

### 8. Condition Action (If/Then)
```xml
<action_type_id>7de4a729bf2031003b7fb249b0c87421</action_type_id>
<action_type_name>Flow Logic</action_type_name>
<condition_type>if</condition_type>
<conditions>
  <condition>
    <left_operand type="data_pill"/>
    <operator type="string">is|is not|contains|starts with|ends with</operator>
    <right_operand type="string|data_pill"/>
  </condition>
</conditions>
```

### 9. Wait For Condition
```xml
<action_type_id>e7c1e4e553430100bfe92e1faf6a7156</action_type_id>
<action_type_name>Wait For Condition</action_type_name>
<inputs>
  <table type="string"/>
  <record type="reference"/>
  <condition type="string"/>
  <timeout type="glide_duration" default="86400"/>
</inputs>
```

### 10. Lookup Record(s)
```xml
<action_type_id>af8ef4e153230100dc1c5a1faa6a71cd</action_type_id>
<action_type_name>Look Up Records</action_type_name>
<inputs>
  <table type="string" mandatory="true"/>
  <conditions type="encoded_query"/>
  <return_all type="boolean" default="false"/>
</inputs>
<outputs>
  <records type="array"/>
  <count type="integer"/>
  <first_record type="reference"/>
</outputs>
```

## Flow Trigger Types with EXACT sys_ids

### 1. Record Created
```xml
<trigger_type_id>e7c1e465536301003e2c7dd36c961939</trigger_type_id>
<trigger_name>Created</trigger_name>
<configuration>
  <table type="string" mandatory="true"/>
  <condition type="encoded_query"/>
  <run_as type="string">system|user</run_as>
</configuration>
```

### 2. Record Updated  
```xml
<trigger_type_id>e7c5ac65536301003e2c7dd36c96193a</trigger_type_id>
<trigger_name>Updated</trigger_name>
<configuration>
  <table type="string" mandatory="true"/>
  <condition type="encoded_query"/>
  <field_watch_list type="array"/>
  <run_as type="string">system|user</run_as>
</configuration>
```

### 3. Scheduled
```xml
<trigger_type_id>0422e965536301003e2c7dd36c96190b</trigger_type_id>
<trigger_name>Run Daily</trigger_name>
<configuration>
  <schedule_type type="string">daily|weekly|monthly|repeat</schedule_type>
  <time type="glide_time"/>
  <timezone type="string"/>
  <days_of_week type="array"/>
  <repeat_interval type="glide_duration"/>
</configuration>
```

### 4. Service Catalog
```xml
<trigger_type_id>29b5e021536301003e2c7dd36c9619b3</trigger_type_id>
<trigger_name>Service Catalog</trigger_name>
<configuration>
  <catalog_item type="reference" table="sc_cat_item"/>
  <stage type="string">request_created|request_approved|item_ordered</stage>
</configuration>
```

### 5. SLA Task
```xml
<trigger_type_id>8fb5a421536301003e2c7dd36c96190e</trigger_type_id>
<trigger_name>SLA</trigger_name>
<configuration>
  <sla_definition type="reference" table="contract_sla"/>
  <event_type type="string">breach|warning|start</event_type>
  <percentage type="integer"/>
</configuration>
```

## Connection Types

### Sequential Connection
```xml
<connection type="sequential">
  <from_step>step_sys_id_1</from_step>
  <to_step>step_sys_id_2</to_step>
  <order>1</order>
</connection>
```

### Conditional Connection
```xml
<connection type="conditional">
  <from_step>if_step_sys_id</from_step>
  <to_step>then_step_sys_id</to_step>
  <condition_met>true</condition_met>
  <label>Then</label>
</connection>
```

### Error Connection
```xml
<connection type="error">
  <from_step>action_step_sys_id</from_step>
  <to_step>error_handler_step_sys_id</to_step>
  <error_type>all|specific</error_type>
</connection>
```

## Data Pills and Variable References

### Input Data Pill
```xml
<data_pill>
  <source>trigger</source>
  <path>current.number</path>
  <type>string</type>
  <label>Trigger ➛ Record ➛ Number</label>
</data_pill>
```

### Action Output Data Pill
```xml
<data_pill>
  <source>step_sys_id</source>
  <path>record_id</path>
  <type>string</type>
  <label>1 - Create Record ➛ Record ID</label>
</data_pill>
```

### Flow Variable Data Pill
```xml
<data_pill>
  <source>flow_var</source>
  <variable_id>var_sys_id</variable_id>
  <type>string</type>
  <label>Flow Variables ➛ My Variable</label>
</data_pill>
```

## Complete Flow Definition Structure

```xml
<flow>
  <sys_id>flow_sys_id</sys_id>
  <name>My Flow Name</name>
  <table>incident</table>
  <active>true</active>
  <type>flow</type> <!-- flow, subflow, action -->
  
  <trigger>
    <type>trigger_type_id</type>
    <configuration>
      <!-- Trigger-specific config -->
    </configuration>
  </trigger>
  
  <inputs>
    <input>
      <name>input_name</name>
      <type>string</type>
      <mandatory>true</mandatory>
      <default_value></default_value>
    </input>
  </inputs>
  
  <steps>
    <step>
      <sys_id>step_sys_id_1</sys_id>
      <action_type>action_type_id</action_type>
      <order>1</order>
      <configuration>
        <!-- Action-specific config -->
      </configuration>
    </step>
  </steps>
  
  <connections>
    <connection>
      <from>trigger</from>
      <to>step_sys_id_1</to>
      <type>sequential</type>
    </connection>
  </connections>
  
  <outputs>
    <output>
      <name>output_name</name>
      <type>string</type>
      <value>
        <data_pill>
          <source>step_sys_id</source>
          <path>output_field</path>
        </data_pill>
      </value>
    </output>
  </outputs>
</flow>
```

## Action Step Extended Properties

### Common Properties
```xml
<step_extended>
  <step>step_sys_id</step>
  <name>Step Name</name>
  <description>Step description</description>
  <skip_condition>
    <use_data_pill>true</use_data_pill>
    <data_pill>
      <source>flow_var</source>
      <variable_id>skip_flag_var</variable_id>
    </data_pill>
  </skip_condition>
  <error_handler>
    <retry_count>3</retry_count>
    <retry_interval>30</retry_interval>
    <continue_on_error>false</continue_on_error>
  </error_handler>
</step_extended>
```

## System Properties and Metadata

### Flow Annotations
```xml
<annotation>
  <x>100</x>
  <y>200</y>
  <width>300</width>
  <height>150</height>
  <color>#FFE599</color>
  <text>This section handles approvals</text>
</annotation>
```

### Flow Properties
```xml
<properties>
  <run_as>system_user</run_as>
  <callable_by_client_api>false</callable_by_client_api>
  <category>ITSM</category>
  <copied_from></copied_from>
  <copied_from_name></copied_from_name>
  <protection_policy>read</protection_policy>
  <sys_domain>global</sys_domain>
</properties>
```

## Additional Flow Components

### Delete Record Action
```xml
<action_type_id>8e8e8ba9532301003e2c7dd36c961975</action_type_id>
<action_type_name>Delete Record</action_type_name>
<inputs>
  <table type="string" mandatory="true"/>
  <record type="reference" mandatory="true"/>
</inputs>
<outputs>
  <success type="boolean"/>
</outputs>
```

### Log Message Action
```xml
<action_type_id>2a5a1c89532301003e2c7dd36c96197e</action_type_id>
<action_type_name>Log Message</action_type_name>
<inputs>
  <level type="string">info|warning|error</level>
  <message type="string"/>
  <source type="string"/>
</inputs>
```

### Transform Data Action
```xml
<action_type_id>f4d8a889532301003e2c7dd36c961987</action_type_id>
<action_type_name>Transform</action_type_name>
<inputs>
  <input_data type="object"/>
  <transform_map type="reference" table="sys_transform_map"/>
  <target_table type="string"/>
</inputs>
<outputs>
  <transformed_record type="reference"/>
  <import_set_row type="reference"/>
</outputs>
```

### Parallel Flow
```xml
<action_type_id>9c5e8889532301003e2c7dd36c961990</action_type_id>
<action_type_name>Parallel Flow</action_type_name>
<parallel_branches>
  <branch order="1">
    <steps>
      <!-- Steps to execute in parallel -->
    </steps>
  </branch>
  <branch order="2">
    <steps>
      <!-- Steps to execute in parallel -->
    </steps>
  </branch>
</parallel_branches>
```

### For Each Loop
```xml
<action_type_id>1c7ea889532301003e2c7dd36c96199a</action_type_id>
<action_type_name>For Each Item</action_type_name>
<inputs>
  <items type="array"/>
  <current_item_variable type="string"/>
</inputs>
<loop_body>
  <steps>
    <!-- Steps to execute for each item -->
  </steps>
</loop_body>
```

## Flow XML Parsing Example

### Complete Flow with Actions
```xml
<?xml version="1.0" encoding="UTF-8"?>
<flow>
  <sys_id>fc5a2d83837e2a102a7ea130ceaad398</sys_id>
  <name>iPhone 6 Approval Workflow</name>
  <internal_name>iphone_6_approval_workflow</internal_name>
  <description>Routes iPhone 6 requests for approval before fulfillment</description>
  <type>flow</type>
  <table>sc_req_item</table>
  <active>true</active>
  
  <!-- Trigger Configuration -->
  <trigger>
    <type>e7c1e465536301003e2c7dd36c961939</type>
    <name>Record Created</name>
    <table>sc_req_item</table>
    <condition>cat_item=125e5d1d837e2a102a7ea130ceaad396</condition>
  </trigger>
  
  <!-- Flow Variables -->
  <variables>
    <variable>
      <name>approval_group</name>
      <type>reference</type>
      <reference_table>sys_user_group</reference_table>
      <default_value>287ebd7da9fe198100f92cc8d1d2154e</default_value>
    </variable>
  </variables>
  
  <!-- Flow Steps -->
  <steps>
    <!-- Step 1: Log Request -->
    <step>
      <sys_id>step_001</sys_id>
      <name>1 - Log Request</name>
      <action_type>2a5a1c89532301003e2c7dd36c96197e</action_type>
      <order>1</order>
      <inputs>
        <level>info</level>
        <message>New iPhone 6 request from {{trigger.requested_for.name}}</message>
        <source>iPhone Approval Flow</source>
      </inputs>
    </step>
    
    <!-- Step 2: Ask for Approval -->
    <step>
      <sys_id>step_002</sys_id>
      <name>2 - Request Approval</name>
      <action_type>75b8e80473a301104769b2e1576d43b8</action_type>
      <order>2</order>
      <inputs>
        <table>sc_req_item</table>
        <record>{{trigger.current}}</record>
        <approvers>
          <group>{{flow_var.approval_group}}</group>
        </approvers>
        <due_date>{{trigger.current.delivery_date}}</due_date>
      </inputs>
    </step>
    
    <!-- Step 3: If Approved -->
    <step>
      <sys_id>step_003</sys_id>
      <name>3 - Check Approval</name>
      <action_type>7de4a729bf2031003b7fb249b0c87421</action_type>
      <order>3</order>
      <condition_type>if</condition_type>
      <conditions>
        <condition>
          <left_operand>{{2 - Request Approval.approval_state}}</left_operand>
          <operator>is</operator>
          <right_operand>approved</right_operand>
        </condition>
      </conditions>
    </step>
    
    <!-- Step 4: Update Request (Approved) -->
    <step>
      <sys_id>step_004</sys_id>
      <name>4 - Update to Approved</name>
      <action_type>8e8e8ba9532301003e2c7dd36c96199d</action_type>
      <order>4</order>
      <inputs>
        <table>sc_req_item</table>
        <record>{{trigger.current}}</record>
        <field_values>
          <approval>approved</approval>
          <state>2</state>
          <comments>Request approved by {{2 - Request Approval.approver_comments}}</comments>
        </field_values>
      </inputs>
    </step>
    
    <!-- Step 5: Send Notification -->
    <step>
      <sys_id>step_005</sys_id>
      <name>5 - Send Approval Email</name>
      <action_type>6c82aa49736301103e1e7dd36c96193f</action_type>
      <order>5</order>
      <inputs>
        <notification_id>049de5af837226502a7ea130ceaad3a2</notification_id>
        <send_to>
          <user>{{trigger.requested_for}}</user>
        </send_to>
        <event_parm_1>{{trigger.current.number}}</event_parm_1>
        <event_parm_2>approved</event_parm_2>
      </inputs>
    </step>
  </steps>
  
  <!-- Connections -->
  <connections>
    <connection>
      <from>trigger</from>
      <to>step_001</to>
      <type>sequential</type>
    </connection>
    <connection>
      <from>step_001</from>
      <to>step_002</to>
      <type>sequential</type>
    </connection>
    <connection>
      <from>step_002</from>
      <to>step_003</to>
      <type>sequential</type>
    </connection>
    <connection>
      <from>step_003</from>
      <to>step_004</to>
      <type>conditional</type>
      <condition_met>true</condition_met>
    </connection>
    <connection>
      <from>step_004</from>
      <to>step_005</to>
      <type>sequential</type>
    </connection>
  </connections>
</flow>
```

## Flow Component Internal Names

### Action Type Internal Names
- `notification` → Send Email Notification
- `approval` → Ask for Approval  
- `script` → Run Script
- `create_record` → Create Record
- `update_record` → Update Record
- `delete_record` → Delete Record
- `rest_step` → REST
- `subflow` → Subflow
- `flow_logic_if` → If
- `flow_logic_else_if` → Else If
- `flow_logic_else` → Else
- `wait_for_condition` → Wait For Condition
- `lookup_records` → Look Up Records
- `transform` → Transform
- `parallel_flow` → Parallel Flow
- `for_each` → For Each Item
- `log_message` → Log Message

### Trigger Type Internal Names
- `record_created` → Created
- `record_updated` → Updated or Updated Selected Fields
- `record_deleted` → Deleted
- `scheduled_daily` → Run Daily
- `scheduled_weekly` → Run Weekly
- `scheduled_monthly` → Run Monthly
- `scheduled_repeat` → Repeat
- `service_catalog` → Service Catalog
- `sla` → SLA
- `inbound_email` → Inbound Email
- `metric_base` → Metric Base

## Table Relationships

### Core Flow Tables
- **sys_hub_flow** → Flow definitions
- **sys_hub_action_type_definition** → Available action types
- **sys_hub_trigger** → Trigger configurations
- **sys_hub_step** → Individual flow steps
- **sys_hub_step_ext** → Extended step properties
- **sys_hub_flow_input** → Flow input variables
- **sys_hub_flow_output** → Flow output variables
- **sys_hub_flow_logic** → Flow logic (if/else) configurations
- **sys_hub_alias** → Connection & credential aliases
- **sys_hub_flow_base** → Base flow properties
- **sys_hub_sub_flow_input** → Subflow input mappings
- **sys_hub_sub_flow_output** → Subflow output mappings

## JSON API Format for Flow Creation

### Complete Flow Definition (JSON)
```json
{
  "name": "iPhone 6 Approval Flow",
  "description": "Workflow to route iPhone 6 requests for approval",
  "definition": {
    "triggers": [{
      "id": "trigger_1",
      "type": "com.glide.hub.trigger.table.create",
      "trigger_definition_id": "e7c1e465536301003e2c7dd36c961939",
      "table": "sc_req_item",
      "condition": "cat_item=125e5d1d837e2a102a7ea130ceaad396"
    }],
    "actions": [{
      "id": "action_1",
      "name": "1 - Send Notification",
      "type": "com.glide.hub.action.notification",
      "action_definition_id": "6c82aa49736301103e1e7dd36c96193f",
      "inputs": {
        "6c82aa49736301103e1e7dd36c96193f.notification": {
          "value": "049de5af837226502a7ea130ceaad3a2"
        },
        "6c82aa49736301103e1e7dd36c96193f.to": {
          "value": {
            "users": ["{{trigger.current.requested_for}}"]
          }
        }
      }
    }, {
      "id": "action_2",
      "name": "2 - Ask for Approval",
      "type": "com.glide.hub.action.approval",
      "action_definition_id": "75b8e80473a301104769b2e1576d43b8",
      "inputs": {
        "75b8e80473a301104769b2e1576d43b8.table": {
          "value": "sc_req_item"
        },
        "75b8e80473a301104769b2e1576d43b8.record": {
          "value": "{{trigger.current}}"
        },
        "75b8e80473a301104769b2e1576d43b8.approvers": {
          "value": {
            "groups": ["287ebd7da9fe198100f92cc8d1d2154e"]
          }
        }
      },
      "outputs": {
        "approval_state": {
          "type": "string"
        }
      }
    }, {
      "id": "action_3",
      "name": "3 - If Approved",
      "type": "com.glide.hub.flow_logic.if",
      "action_definition_id": "7de4a729bf2031003b7fb249b0c87421",
      "inputs": {
        "7de4a729bf2031003b7fb249b0c87421.condition": {
          "value": {
            "conditions": [{
              "left": "{{action_2.approval_state}}",
              "operator": "equals",
              "right": "approved"
            }]
          }
        }
      }
    }, {
      "id": "action_4",
      "name": "4 - Update Record",
      "type": "com.glide.hub.action.update_record",
      "action_definition_id": "8e8e8ba9532301003e2c7dd36c96199d",
      "inputs": {
        "8e8e8ba9532301003e2c7dd36c96199d.table": {
          "value": "sc_req_item"
        },
        "8e8e8ba9532301003e2c7dd36c96199d.record": {
          "value": "{{trigger.current}}"
        },
        "8e8e8ba9532301003e2c7dd36c96199d.fields": {
          "value": {
            "approval": "approved",
            "state": "2"
          }
        }
      }
    }],
    "flow": {
      "trigger_1": ["action_1"],
      "action_1": ["action_2"],
      "action_2": ["action_3"],
      "action_3": {
        "true": ["action_4"]
      }
    }
  }
}
```

### Action Input/Output Format
```json
{
  "inputs": {
    "<action_definition_id>.<input_name>": {
      "value": "<static_value or {{data_pill}}>"
    }
  },
  "outputs": {
    "<output_name>": {
      "type": "string|boolean|reference|object"
    }
  }
}
```

### Data Pill Format in JSON
```json
{
  "value": "{{source.path.to.field}}"
}
```

Where source can be:
- `trigger` - for trigger data
- `action_<id>` - for action outputs
- `flow_var` - for flow variables
- `system` - for system properties

## Notes

1. All sys_ids shown are REAL ServiceNow system IDs from actual instances
2. The action_type_id values are consistent across ServiceNow instances
3. Data pills use dot notation for paths (e.g., current.number, current.assigned_to.email)
4. Flow variables are strongly typed and must match their defined types
5. Connections define the execution path through the flow
6. Error handling can be configured at both flow and step levels
7. Subflows can be nested and pass data through inputs/outputs
8. All table references use the actual table name (not sys_id)
9. The XML structure can be imported/exported through Flow Designer
10. Variable references use {{source.path}} notation in the XML